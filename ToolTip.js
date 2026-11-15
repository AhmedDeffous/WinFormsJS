/*!
 * ToolStrip.js - WinForms ToolStrip + ToolStripButton + ToolStripSeparator + ToolStripLabel + ToolStripTextBox + ToolStripComboBox + ToolStripDropDownButton. Needs Control.js and Theme.js.
 */
(function (root)
{
    'use strict';
    var Control = root.Control, esc = Control.Esc;

    Control.InjectCss([
        '.wf-ts{display:flex;align-items:center;min-height:26px;padding:2px 3px;',
        'background:linear-gradient(var(--wf-bar-top, #fafbfd), var(--wf-bar-bottom, #e6ebf3));',
        'border:1px solid var(--wf-bar-border, #c5ccd6);color:var(--wf-text, #000);user-select:none;flex-wrap:wrap}',
        '.wf-ts-btn{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 5px;margin:0 1px;',
        'border:1px solid transparent;border-radius:2px;cursor:default;color:inherit;background:transparent;flex:none}',
        '.wf-ts-btn:hover{background:var(--wf-hover, #e5f1fb);border-color:var(--wf-hover-border, #7eb4ea)}',
        '.wf-ts-btn.press,.wf-ts-btn.chk{background:var(--wf-press, #cce4f7);border-color:var(--wf-press-border, #569de5)}',
        '.wf-ts-btn.dis{color:var(--wf-text-off, #a0a0a0);opacity:0.6}',
        '.wf-ts-btn img{width:16px;height:16px}',

        // Flex direction classes for TextImageRelation
        '.wf-ts-btn.tir-overlay{position:relative;}',
        '.wf-ts-btn.tir-overlay img{position:absolute;}',
        '.wf-ts-btn.tir-text-before-image{flex-direction:row-reverse;}',
        '.wf-ts-btn.tir-image-above-text{flex-direction:column;height:auto;line-height:1.1;align-items:center;padding:2px 4px;}',
        '.wf-ts-btn.tir-text-above-image{flex-direction:column-reverse;height:auto;line-height:1.1;align-items:center;padding:2px 4px;}',

        '.wf-ts-sep{width:1px;height:18px;margin:0 3px;background:var(--wf-sep, #c2c9d3);flex:none}',
        '.wf-ts-lbl{padding:0 4px;font:inherit;color:inherit;flex:none}',
        '.wf-ts-control-host{display:inline-flex;align-items:center;margin:0 3px;flex:none;position:relative}',
        '.wf-ts-control-host > * {position:relative !important; display:inline-block !important;}',

        // DropDown arrow styling
        '.wf-ts-dd-arrow{width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;border-top:4px solid currentColor;margin-inline-start:3px;display:inline-block}'
    ].join(''));

    var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

    function iconHtml(img)
    {
        if (!img) return '';
        if (/<[a-z][\s\S]*>/i.test(img)) return img;
        return IMG_RE.test(img) ? '<img src="' + esc(img) + '" alt="">' : '<span style="font-size:14px">' + esc(img) + '</span>';
    }

    // --- Helper for DropDownItems collection management ---
    function initDropDownItems(ownerItem)
    {
        var list = [];
        list.Count = 0;

        Object.defineProperty(list, 'Count', {
            get: function () { return list.length; },
            configurable: true
        });

        var adopt = function (it)
        {
            if (it && typeof it === 'object')
            {
                it._ownerItem = ownerItem;
            }
            return it;
        };

        var makeItem = function (a, b, c, d)
        {
            if (a && typeof a === 'object') return a;
            if (a === '-') return new ToolStripSeparator();
            return new ToolStripButton(a, b, c, d);
        };

        list.Add = function (a, b, c, d)
        {
            var it = adopt(makeItem(a, b, c, d));
            list.push(it);
            return it;
        };

        list.AddRange = function (arr)
        {
            if (Array.isArray(arr))
            {
                arr.forEach(function (x)
                {
                    list.push(adopt(makeItem(x)));
                });
            }
        };

        list.Remove = function (it)
        {
            var i = list.indexOf(it);
            if (i >= 0)
            {
                list.splice(i, 1);
                it._ownerItem = null;
            }
        };

        list.Clear = function ()
        {
            list.forEach(function (it) { it._ownerItem = null; });
            list.splice(0, list.length);
        };

        return list;
    }

    // --- ToolStripSeparator ---
    function ToolStripSeparator() { this.IsSeparator = true; this._visible = true; this._strip = null; }
    Object.defineProperty(ToolStripSeparator.prototype, 'Visible', {
        get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); }
    });

    // --- ToolStripButton ---
    function ToolStripButton(text, image, onClick, name)
    {
        var opts = null;
        if (text && typeof text === 'object') { opts = text; text = ''; }
        this.IsSeparator = false;
        this._text = text == null ? '' : String(text);
        this._image = image || null;
        this._checked = false; this._checkOnClick = false;
        this._enabled = true; this._visible = true;
        this._displayStyle = (root.ToolStripItemDisplayStyle !== undefined) ? root.ToolStripItemDisplayStyle.ImageAndText : 3;
        this._textImageRelation = (root.TextImageRelation !== undefined) ? root.TextImageRelation.ImageBeforeText : 2;
        this._toolTip = ''; this._name = name || '';
        this._strip = null; this.Tag = null;

        this.DropDownItems = initDropDownItems(this);

        if (typeof onClick === 'function') this.on('Click', onClick);
        if (opts)
        {
            for (var k in opts)
            {
                if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
                if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
            }
        }
    }
    Control.Events(ToolStripButton.prototype);
    var BP = ToolStripButton.prototype;

    BP.PerformClick = function ()
    {
        if (!this._enabled) return;
        if (this._checkOnClick) this.Checked = !this._checked;
        this._raise('Click');
        if (this._strip && this._strip._raise) this._strip._raise('ItemClicked', { ClickedItem: this });
    };

    Object.defineProperties(BP, {
        Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); if (this._strip) this._strip._render(); } },
        Image: { get: function () { return this._image; }, set: function (v) { this._image = v || null; if (this._strip) this._strip._render(); } },
        DisplayStyle: {
            get: function () { return this._displayStyle; },
            set: function (v)
            {
                var num = +v;
                if (!isNaN(num))
                {
                    this._displayStyle = num;
                    if (this._strip) this._strip._render();
                }
            }
        },
        TextImageRelation: {
            get: function () { return this._textImageRelation; },
            set: function (v)
            {
                var num = +v;
                if (!isNaN(num))
                {
                    this._textImageRelation = num;
                    if (this._strip) this._strip._render();
                }
            }
        },
        Checked: {
            get: function () { return this._checked; },
            set: function (v)
            {
                v = !!v; if (v === this._checked) return;
                this._checked = v; this._raise('CheckedChanged'); if (this._strip) this._strip._render();
            }
        },
        CheckOnClick: { get: function () { return this._checkOnClick; }, set: function (v) { this._checkOnClick = !!v; } },
        Enabled: { get: function () { return this._enabled; }, set: function (v) { this._enabled = !!v; if (this._strip) this._strip._render(); } },
        Visible: { get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); } },
        ToolTipText: { get: function () { return this._toolTip; }, set: function (v) { this._toolTip = v || ''; } },
        Name: { get: function () { return this._name; }, set: function (v) { this._name = String(v); } }
    });

    //==========================
    // =====================================================================
    //  Popups du DropDown (un seul menu ouvert à la fois)
    // =====================================================================
    var ddMenus = [];     // [menu niveau 0, sous-menu niveau 1, ...]
    var ddOwner = null;   // ToolStripDropDownButton actuellement ouvert

    function ddRaise(o, name, e) { if (o && typeof o._raise === 'function') o._raise(name, e); }

    function ddCloseFrom(level)
    {
        while (ddMenus.length > level)
        {
            var m = ddMenus.pop();
            if (m.parentNode) m.parentNode.removeChild(m);
        }
    }

    function ddCloseAll()
    {
        ddCloseFrom(0);
        var o = ddOwner;
        ddOwner = null;
        ddUnbind();
        if (o)
        {
            o._open = false;
            if (o._el) o._el.classList.remove('press');
            ddRaise(o, 'DropDownClosed', {});
        }
    }

    function ddInside(t, sel) { return !!(t && t.closest && t.closest(sel)); }
    function ddOnDown(e)
    {
        if (ddInside(e.target, '.wf-ts-dd-menu') || ddInside(e.target, '.wf-ts-dd-btn')) return;
        ddCloseAll();
    }
    function ddOnKey(e) { if (e.key === 'Escape') ddCloseAll(); }
    function ddOnWin() { ddCloseAll(); }

    function ddBind()
    {
        document.addEventListener('mousedown', ddOnDown, true);
        document.addEventListener('keydown', ddOnKey, true);
        window.addEventListener('resize', ddOnWin);
        window.addEventListener('blur', ddOnWin);
    }
    function ddUnbind()
    {
        document.removeEventListener('mousedown', ddOnDown, true);
        document.removeEventListener('keydown', ddOnKey, true);
        window.removeEventListener('resize', ddOnWin);
        window.removeEventListener('blur', ddOnWin);
    }

    function ddPlace(menu, rect, dir, isSub)
    {
        document.body.appendChild(menu);
        var w = menu.offsetWidth, h = menu.offsetHeight;
        var vw = window.innerWidth, vh = window.innerHeight, x, y;

        switch (dir)
        {
            case 'BelowLeft': x = rect.right - w; y = rect.bottom; break;
            case 'AboveRight':
            case 'Up': x = rect.left; y = rect.top - h; break;
            case 'AboveLeft': x = rect.right - w; y = rect.top - h; break;
            case 'Right': x = rect.right; y = rect.top; break;
            case 'Left': x = rect.left - w; y = rect.top; break;
            default: x = rect.left; y = rect.bottom; // BelowRight
        }
        if (x + w > vw) x = isSub ? rect.left - w : vw - w;
        if (x < 0) x = 0;
        if (y + h > vh) y = isSub ? vh - h : (rect.top - h >= 0 ? rect.top - h : vh - h);
        if (y < 0) y = 0;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }

    function ddInvoke(it)
    {
        if (typeof it.PerformClick === 'function') it.PerformClick();
        else ddRaise(it, 'Click', {});
    }

    function ddBuildMenu(items, top, level)
    {
        var menu = document.createElement('div');
        menu.className = 'wf-ts-dd-menu';
        var theme = top._strip && top._strip.element && top._strip.element.getAttribute('data-wf-theme');
        if (theme) menu.setAttribute('data-wf-theme', theme);
        // Même police que la barre d'outils
        var srcEl = (top._strip && top._strip.element) || top._el;
        if (srcEl)
        {
            var cs = getComputedStyle(srcEl);
            menu.style.fontFamily = cs.fontFamily;
            menu.style.fontSize = cs.fontSize;
            menu.style.fontWeight = cs.fontWeight;
            menu.style.fontStyle = cs.fontStyle;
        }
        items.forEach(function (it)
        {
            if (!it || it._visible === false) return;

            if (it.IsSeparator)
            {
                var sep = document.createElement('div');
                sep.className = 'wf-ts-dd-sep';
                menu.appendChild(sep);
                return;
            }
            if (it.IsLabel)
            {
                var lbl = document.createElement('div');
                lbl.className = 'wf-ts-dd-lbl';
                lbl.textContent = it._text;
                menu.appendChild(lbl);
                return;
            }

            var text = it.Text != null ? it.Text : (it._text || '');
            var image = it.Image != null ? it.Image : it._image;
            var enabled = it.Enabled !== false && it._enabled !== false;
            var checked = !!(it.Checked || it._checked);
            var subs = (it.DropDownItems && it.DropDownItems.length) ? it.DropDownItems : null;

            var row = document.createElement('div');
            row.className = 'wf-ts-dd-item' + (enabled ? '' : ' dis');
            if (it._toolTip) row.title = it._toolTip;

            var ico = document.createElement('span');
            ico.className = 'wf-ts-dd-ico' + (checked ? ' chk' : '');
            ico.innerHTML = image ? iconHtml(image) : (checked ? '&#10003;' : '');
            row.appendChild(ico);

            var txt = document.createElement('span');
            txt.className = 'wf-ts-dd-txt';
            txt.textContent = text;
            row.appendChild(txt);

            if (subs)
            {
                var arr = document.createElement('span');
                arr.className = 'wf-ts-dd-sub';
                arr.innerHTML = '&#9654;';
                row.appendChild(arr);
            }

            function openSub()
            {
                ddCloseFrom(level + 1);
                var sm = ddBuildMenu(subs, top, level + 1);
                ddMenus.push(sm);
                ddPlace(sm, row.getBoundingClientRect(), 'Right', true);
            }

            row.addEventListener('mouseenter', function ()
            {
                ddCloseFrom(level + 1);
                if (enabled && subs) openSub();
            });
            row.addEventListener('click', function (e)
            {
                e.stopPropagation();
                if (!enabled) return;
                if (subs) { openSub(); return; }
                ddInvoke(it);
                var args = { ClickedItem: it };
                ddRaise(top, 'DropDownItemClicked', args);
                if (top._strip) ddRaise(top._strip, 'ItemClicked', args);
                ddCloseAll();
            });
            menu.appendChild(row);
        });

        return menu;
    }

    // --- ToolStripDropDownButton ---
    function ToolStripDropDownButton(text, image, onClick, name)
    {
        var opts = null;
        if (text && typeof text === 'object') { opts = text; text = ''; }

        this.IsSeparator = false;
        this.IsDropDownButton = true;
        this._text = text == null ? '' : String(text);
        this._image = image || null;
        this._enabled = true;
        this._visible = true;
        this._checked = false;
        this._checkOnClick = false;
        this._open = false;
        this._el = null;
        this._showDropDownArrow = true;
        this._dropDownDirection = 'BelowRight';
        this._displayStyle = (root.ToolStripItemDisplayStyle !== undefined) ? root.ToolStripItemDisplayStyle.ImageAndText : 3;
        this._textImageRelation = (root.TextImageRelation !== undefined) ? root.TextImageRelation.ImageBeforeText : 2;
        this._toolTip = '';
        this._name = name || '';
        this._strip = null;
        this.Tag = null;

        this.DropDownItems = initDropDownItems(this);

        if (typeof onClick === 'function') this.on('Click', onClick);
        if (opts)
        {
            for (var k in opts)
            {
                if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
                if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
            }
        }
    }
    Control.Events(ToolStripDropDownButton.prototype);
    var DDJP = ToolStripDropDownButton.prototype;

    DDJP.PerformClick = function ()
    {
        if (!this._enabled) return;
        if (this._checkOnClick) this.Checked = !this._checked;
        this._raise('Click');
        if (this._strip && this._strip._raise) this._strip._raise('ItemClicked', { ClickedItem: this });
    };

    DDJP.ShowDropDown = function ()
    {
        if (!this._enabled || this._open || !this._el) return;
        if (ddOwner && ddOwner !== this) ddCloseAll();

        this._raise('DropDownOpening');          // les handlers peuvent remplir DropDownItems
        if (!this.DropDownItems.length) return;

        var menu = ddBuildMenu(this.DropDownItems, this, 0);
        ddMenus.push(menu);
        ddOwner = this;
        this._open = true;
        this._el.classList.add('press');
        ddPlace(menu, this._el.getBoundingClientRect(), this._dropDownDirection, false);
        ddBind();
    };

    DDJP.HideDropDown = function ()
    {
        if (ddOwner === this) ddCloseAll();
    };

    DDJP.Dispose = function ()
    {
        this.HideDropDown();
        if (this._strip && this._strip.Items) this._strip.Items.Remove(this);
        this._el = null;
    };

    // Appelé par ToolStrip._render()
    DDJP._renderInto = function (bar)
    {
        var it = this, btn = document.createElement('div'), tir = '';

        switch (it._textImageRelation)
        {
            case 0: tir = ' tir-overlay'; break;
            case 1: tir = ' tir-text-before-image'; break;
            case 4: tir = ' tir-image-above-text'; break;
            case 8: tir = ' tir-text-above-image'; break;
        }

        btn.className = 'wf-ts-btn wf-ts-dd-btn' + tir +
            (!it._enabled ? ' dis' : '') + (it._checked ? ' chk' : '') + (it._open ? ' press' : '');
        if (it._toolTip) btn.title = it._toolTip;

        var showImage = (it._displayStyle === 1 || it._displayStyle === 3);
        var showText = (it._displayStyle === 2 || it._displayStyle === 3);

        var inner = '';
        if (showImage) inner += iconHtml(it._image);
        if (showText && it._text) inner += '<span>' + esc(it._text) + '</span>';
        if (it._showDropDownArrow) inner += '<span class="wf-ts-dd-arrow"></span>';
        btn.innerHTML = inner;

        btn.addEventListener('click', function ()
        {
            if (!it._enabled) return;
            var wasOpen = it._open;
            it.PerformClick();                    // peut re-rendre la barre : it._el est alors mis à jour
            if (wasOpen) it.HideDropDown(); else it.ShowDropDown();
        });

        it._el = btn;
        bar.appendChild(btn);
    };

    Object.defineProperties(DDJP, {
        Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); if (this._strip) this._strip._render(); } },
        Image: { get: function () { return this._image; }, set: function (v) { this._image = v || null; if (this._strip) this._strip._render(); } },
        ShowDropDownArrow: { get: function () { return this._showDropDownArrow; }, set: function (v) { this._showDropDownArrow = !!v; if (this._strip) this._strip._render(); } },
        DropDownDirection: { get: function () { return this._dropDownDirection; }, set: function (v) { this._dropDownDirection = v || 'BelowRight'; } },
        DisplayStyle: {
            get: function () { return this._displayStyle; },
            set: function (v) { var n = +v; if (!isNaN(n)) { this._displayStyle = n; if (this._strip) this._strip._render(); } }
        },
        TextImageRelation: {
            get: function () { return this._textImageRelation; },
            set: function (v) { var n = +v; if (!isNaN(n)) { this._textImageRelation = n; if (this._strip) this._strip._render(); } }
        },
        Checked: {
            get: function () { return this._checked; },
            set: function (v)
            {
                v = !!v; if (v === this._checked) return;
                this._checked = v; this._raise('CheckedChanged'); if (this._strip) this._strip._render();
            }
        },
        CheckState: {
            get: function () { return this._checked ? 1 : 0; },
            set: function (v) { this.Checked = (+v === 1 || v === true); }
        },
        CheckOnClick: { get: function () { return this._checkOnClick; }, set: function (v) { this._checkOnClick = !!v; } },
        Enabled: { get: function () { return this._enabled; }, set: function (v) { this._enabled = !!v; if (!this._enabled) this.HideDropDown(); if (this._strip) this._strip._render(); } },
        Visible: { get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (!this._visible) this.HideDropDown(); if (this._strip) this._strip._render(); } },
        IsOpen: { get: function () { return this._open; } },
        ToolTipText: { get: function () { return this._toolTip; }, set: function (v) { this._toolTip = v || ''; } },
        Name: { get: function () { return this._name; }, set: function (v) { this._name = String(v); } }
    });
 //===========================
    // --- ToolStripLabel ---
    function ToolStripLabel(text)
    {
        this.IsSeparator = false; this.IsLabel = true;
        this._text = text == null ? '' : String(text);
        this._visible = true; this._strip = null; this.Tag = null;
        this.DropDownItems = initDropDownItems(this);
    }
    Object.defineProperties(ToolStripLabel.prototype, {
        Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); if (this._strip) this._strip._render(); } },
        Visible: { get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); } }
    });

    // --- ToolStripTextBox ---
    function ToolStripTextBox(opts)
    {
        this.IsSeparator = false;
        this.IsControlHost = true;
        this._visible = true;
        this._strip = null;
        this.Tag = null;
        this.DropDownItems = initDropDownItems(this);

        var width = opts && opts.Width ? opts.Width : 100;
        this.TextBox = new (root.TextBox || Object)({ Width: width });
        this.element = this.TextBox.element;

        Object.defineProperty(this, 'Text', {
            get: function () { return this.TextBox.Text; },
            set: function (v) { this.TextBox.Text = v; }
        });

        if (opts)
        {
            for (var k in opts)
            {
                if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
                if (k !== 'Width' && typeof opts[k] === 'function') this.TextBox.on(k, opts[k]);
            }
        }
    }
    Object.defineProperty(ToolStripTextBox.prototype, 'Visible', {
        get: function () { return this._visible; },
        set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); }
    });

    // --- ToolStripComboBox ---
    function ToolStripComboBox(opts)
    {
        this.IsSeparator = false;
        this.IsControlHost = true;
        this._visible = true;
        this._strip = null;
        this.Tag = null;
        this.DropDownItems = initDropDownItems(this);

        var width = opts && opts.Width ? opts.Width : 120;
        this.ComboBox = new (root.ComboBox || Object)({ Width: width });
        this.element = this.ComboBox.element;

        this.Items = this.ComboBox.Items;
        Object.defineProperties(this, {
            SelectedIndex: {
                get: function () { return this.ComboBox.SelectedIndex; },
                set: function (v) { this.ComboBox.SelectedIndex = v; }
            },
            Text: {
                get: function () { return this.ComboBox.Text; },
                set: function (v) { this.ComboBox.Text = v; }
            }
        });

        if (opts)
        {
            for (var k in opts)
            {
                if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
                if (k !== 'Width' && typeof opts[k] === 'function') this.ComboBox.on(k, opts[k]);
            }
        }
    }
    Object.defineProperty(ToolStripComboBox.prototype, 'Visible', {
        get: function () { return this._visible; },
        set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); }
    });

    // --- ToolStrip ---
    function ToolStrip(opts)
    {
        Control.call(this, 'div', 'wf-ts');
        this._dock = 'Top'; this._height = 28; this._width = 200;
        this.Items = [];
        this._initItems();
        if (opts && opts.Theme) this.Theme = opts.Theme;
        this._applyRect();
        this._applyOptions(opts);
        this._render();
    }
    var P = Control.Extend(ToolStrip);

    Object.defineProperty(P, 'Theme', {
        get: function () { return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
        set: function (v) { if (root.Theme && root.Theme.Apply) root.Theme.Apply(v, this.element); }
    });

    P._initItems = function ()
    {
        var self = this, list = this.Items;
        Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
        var adopt = function (it) { it._strip = self; return it; };
        var make = function (a, b, c, d)
        {
            if (a && typeof a === 'object') return a;
            if (a === '-') return new ToolStripSeparator();
            if (a instanceof ToolStripDropDownButton) return a;
            return new ToolStripButton(a, b, c, d);
        };
        list.Add = function (a, b, c, d) { var it = adopt(make(a, b, c, d)); list.push(it); self._render(); return it; };
        list.AddRange = function (arr) { arr.forEach(function (x) { list.push(adopt(make(x))); }); self._render(); };
        list.Remove = function (it) { var i = list.indexOf(it); if (i >= 0) { list.splice(i, 1); it._strip = null; self._render(); } };
        list.Clear = function () { list.forEach(function (it) { it._strip = null; }); list.splice(0, list.length); self._render(); };
    };

    P._render = function ()
    {
        var bar = this.element;
        bar.innerHTML = '';
        this.Items.forEach(function (it)
        {
            if (it._visible === false) return;

            if (it.IsSeparator)
            {
                var sep = document.createElement('div');
                sep.className = 'wf-ts-sep';
                bar.appendChild(sep);
                return;
            }
            if (it.IsLabel)
            {
                var lbl = document.createElement('span');
                lbl.className = 'wf-ts-lbl';
                lbl.textContent = it._text;
                bar.appendChild(lbl);
                return;
            }
            if (it.IsControlHost && it.element)
            {
                var host = document.createElement('div');
                host.className = 'wf-ts-control-host';
                host.appendChild(it.element);
                bar.appendChild(host);
                return;
            }
            if (it.IsDropDownButton && typeof it._renderInto === 'function')
            {
                it._renderInto(bar);
                return;
            }
            // Standard Button or DropDownButton rendering
            var btn = document.createElement('div');
            var tirClass = '';

            switch (it._textImageRelation)
            {
                case 0: tirClass = ' tir-overlay'; break;
                case 1: tirClass = ' tir-text-before-image'; break;
                case 2: tirClass = ''; break;
                case 4: tirClass = ' tir-image-above-text'; break;
                case 8: tirClass = ' tir-text-above-image'; break;
                default: tirClass = ''; break;
            }

            btn.className = 'wf-ts-btn' + tirClass + (!it._enabled ? ' dis' : '') + (it._checked ? ' chk' : '');
            if (it._toolTip) btn.title = it._toolTip;

            var showImage = (it._displayStyle === 1 || it._displayStyle === 3);
            var showText = (it._displayStyle === 2 || it._displayStyle === 3);

            var inner = '';
            if (showImage) inner += iconHtml(it._image);
            if (showText && it._text)
            {
                var sepMargin = (showImage && it._textImageRelation !== 4 && it._textImageRelation !== 8) ? ' style="margin-inline-start:4px;"' : '';
                inner += '<span' + sepMargin + '>' + esc(it._text) + '</span>';
            }

            // Append drop-down indicator arrow if it's a DropDownButton and arrow is enabled
            if (it.IsDropDownButton && it._showDropDownArrow !== false)
            {
                inner += '<span class="wf-ts-dd-arrow"></span>';
            }

            btn.innerHTML = inner;

            btn.addEventListener('mousedown', function () { if (it._enabled && typeof it.PerformClick === 'function') btn.classList.add('press'); });
            ['mouseup', 'mouseleave'].forEach(function (ev)
            {
                btn.addEventListener(ev, function () { btn.classList.remove('press'); });
            });
            btn.addEventListener('click', function ()
            {
                if (typeof it.PerformClick === 'function')
                {
                    it.PerformClick();
                }
            });
            bar.appendChild(btn);
        });
    };

    root.ToolStrip = ToolStrip;
    root.ToolStripButton = ToolStripButton;
    root.ToolStripSeparator = ToolStripSeparator;
    root.ToolStripLabel = ToolStripLabel;
    root.ToolStripTextBox = ToolStripTextBox;
    root.ToolStripComboBox = ToolStripComboBox;
    root.ToolStripDropDownButton = ToolStripDropDownButton;

    if (typeof module !== 'undefined' && module.exports)
    {
        module.exports = {
            ToolStrip: ToolStrip,
            ToolStripButton: ToolStripButton,
            ToolStripSeparator: ToolStripSeparator,
            ToolStripLabel: ToolStripLabel,
            ToolStripTextBox: ToolStripTextBox,
            ToolStripComboBox: ToolStripComboBox,
            ToolStripDropDownButton: ToolStripDropDownButton
        };
    }
})(typeof window !== 'undefined' ? window : this);