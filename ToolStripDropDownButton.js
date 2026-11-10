/*!
 * ToolStripDropDownButton.js - WinForms ToolStripDropDownButton component. Needs Control.js, ToolStripItem.js (or ToolStrip.js).
 *
 *   var dropBtn = new ToolStripDropDownButton({ Text: 'File', Image: '../Resources/folder.png' });
 *   dropBtn.DropDownItems.Add(new ToolStripMenuItem({ Text: 'Open', Click: function() { ... } }));
 *   toolStrip.Items.Add(dropBtn);
 *
 * Properties: Text, Image, DisplayStyle (TextAndImage/Image/Text/None), ShowDropDownArrow (true),
 *   DropDownDirection (BelowRight/Left/Right/Up), DropDownItems (ToolStripItemCollection),
 *   Checked, CheckState, CheckOnClick, Tag, Enabled, Visible, ToolTipText
 * Methods: ShowDropDown(), HideDropDown(), Dispose()
 * Events (sender, e): Click, DropDownOpening, DropDownClosed, DropDownItemClicked
 */
/*!
 * ToolStripDropDownButton.js - WinForms ToolStripDropDownButton equivalent for WinFormJS.
 * Depends on Control.js, ToolStrip.js, and TextImageRelation.js / ToolStripItemDisplayStyle.js.
 */
(function (root) {
    'use strict';
    var Control = root.Control, esc = Control.Esc;

    // Inject CSS specifically for DropDownButton layout (including the drop-down arrow indicator)
    Control.InjectCss([
        '.wf-ts-dd-btn{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 5px;margin:0 1px;',
        'border:1px solid transparent;border-radius:2px;cursor:default;color:inherit;background:transparent;position:relative;user-select:none;flex:none}',
        '.wf-ts-dd-btn:hover{background:var(--wf-hover, #e5f1fb);border-color:var(--wf-hover-border, #7eb4ea)}',
        '.wf-ts-dd-btn.press,.wf-ts-dd-btn.chk{background:var(--wf-press, #cce4f7);border-color:var(--wf-press-border, #569de5)}',
        '.wf-ts-dd-btn.dis{color:var(--wf-text-off, #a0a0a0);opacity:0.6}',
        '.wf-ts-dd-btn img{width:16px;height:16px}',
        '.wf-ts-dd-arrow{width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-top:4px solid currentColor;margin-inline-start:2px;display:inline-block}'
    ].join(''));

    var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

    function iconHtml(img) {
        if (!img) return '';
        if (/<[a-z][\s\S]*>/i.test(img)) return img;
        return IMG_RE.test(img) ? '<img src="' + esc(img) + '" alt="">' : '<span style="font-size:14px">' + esc(img) + '</span>';
    }

    // --- Helper for DropDownItems collection management ---
    function initDropDownItems(ownerItem) {
        var list = [];
        list.Count = 0;

        Object.defineProperty(list, 'Count', {
            get: function () { return list.length; },
            configurable: true
        });

        var adopt = function (it) {
            if (it && typeof it === 'object') {
                it._ownerItem = ownerItem;
            }
            return it;
        };

        var makeItem = function (a, b, c, d) {
            if (a && typeof a === 'object') return a;
            if (a === '-') return new (root.ToolStripSeparator || Object)();
            return new (root.ToolStripButton || Object)(a, b, c, d);
        };

        list.Add = function (a, b, c, d) {
            var it = adopt(makeItem(a, b, c, d));
            list.push(it);
            return it;
        };

        list.AddRange = function (arr) {
            if (Array.isArray(arr)) {
                arr.forEach(function (x) {
                    list.push(adopt(makeItem(x)));
                });
            }
        };

        list.Remove = function (it) {
            var i = list.indexOf(it);
            if (i >= 0) {
                list.splice(i, 1);
                it._ownerItem = null;
            }
        };

        list.Clear = function () {
            list.forEach(function (it) { it._ownerItem = null; });
            list.splice(0, list.length);
        };

        return list;
    }

    // --- ToolStripDropDownButton ---
    function ToolStripDropDownButton(text, image, onClick, name) {
        var opts = null;
        if (text && typeof text === 'object') { opts = text; text = ''; }

        this.IsSeparator = false;
        this.IsDropDownButton = true;
        this._text = text == null ? '' : String(text);
        this._image = image || null;
        this._enabled = true;
        this._visible = true;
        this._showDropDownArrow = true;
        this._displayStyle = (root.ToolStripItemDisplayStyle !== undefined) ? root.ToolStripItemDisplayStyle.ImageAndText : 3;
        this._textImageRelation = (root.TextImageRelation !== undefined) ? root.TextImageRelation.ImageBeforeText : 2;
        this._toolTip = '';
        this._name = name || '';
        this._strip = null;
        this.Tag = null;

        // Initialize DropDownItems with full Add / AddRange / Remove / Clear methods
        this.DropDownItems = initDropDownItems(this);

        if (typeof onClick === 'function') this.on('Click', onClick);
        if (opts) {
            for (var k in opts) {
                if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
                if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
            }
        }
    }

    if (Control.Events) {
        Control.Events(ToolStripDropDownButton.prototype);
    }

    var DDBP = ToolStripDropDownButton.prototype;

    DDBP.PerformClick = function () {
        if (!this._enabled) return;
        this._raise('Click');
        if (this._strip && this._strip._raise) this._strip._raise('ItemClicked', { ClickedItem: this });
    };

    Object.defineProperties(DDBP, {
        Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); if (this._strip) this._strip._render(); } },
        Image: { get: function () { return this._image; }, set: function (v) { this._image = v || null; if (this._strip) this._strip._render(); } },
        ShowDropDownArrow: { get: function () { return this._showDropDownArrow; }, set: function (v) { this._showDropDownArrow = !!v; if (this._strip) this._strip._render(); } },
        DisplayStyle: {
            get: function () { return this._displayStyle; },
            set: function (v) {
                var num = +v;
                if (!isNaN(num)) {
                    this._displayStyle = num;
                    if (this._strip) this._strip._render();
                }
            }
        },
        TextImageRelation: {
            get: function () { return this._textImageRelation; },
            set: function (v) {
                var num = +v;
                if (!isNaN(num)) {
                    this._textImageRelation = num;
                    if (this._strip) this._strip._render();
                }
            }
        },
        Enabled: { get: function () { return this._enabled; }, set: function (v) { this._enabled = !!v; if (this._strip) this._strip._render(); } },
        Visible: { get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); } },
        ToolTipText: { get: function () { return this._toolTip; }, set: function (v) { this._toolTip = v || ''; } },
        Name: { get: function () { return this._name; }, set: function (v) { this._name = String(v); } }
    });

    root.ToolStripDropDownButton = ToolStripDropDownButton;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ToolStripDropDownButton;
    }
})(typeof window !== 'undefined' ? window : this);