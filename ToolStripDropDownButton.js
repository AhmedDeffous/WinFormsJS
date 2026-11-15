/*!
 * ToolStripDropDownButton.js - WinForms ToolStripDropDownButton pour WinFormJS.
 * Needs Control.js, ToolStrip.js (+ TextImageRelation.js / ToolStripItemDisplayStyle.js).
 *
 *   var dropBtn = new ToolStripDropDownButton({ Text: 'File', Image: '../Resources/folder.png' });
 *   dropBtn.DropDownItems.Add(new ToolStripButton({ Text: 'Open', Click: function () { ... } }));
 *   toolStrip.Items.Add(dropBtn);
 *
 * Properties: Text, Image, DisplayStyle, TextImageRelation, ShowDropDownArrow (true),
 *   DropDownDirection ('BelowRight' | 'BelowLeft' | 'AboveRight' | 'AboveLeft' | 'Right' | 'Left' | 'Up'),
 *   DropDownItems, Checked, CheckState, CheckOnClick, Tag, Enabled, Visible, ToolTipText, Name
 * Methods: ShowDropDown(), HideDropDown(), PerformClick(), Dispose()
 * Events: Click, DropDownOpening, DropDownClosed, DropDownItemClicked
 */
(function (root)
{
    'use strict';
    var Control = root.Control, esc = Control.Esc;

    Control.InjectCss([
        '.wf-ts-dd-btn{position:relative}',
        '.wf-ts-dd-arrow{width:0;height:0;border-left:3px solid transparent;border-right:3px solid transparent;',
        'border-top:4px solid currentColor;margin-inline-start:2px;display:inline-block;flex:none}',

        '.wf-ts-dd-menu{position:fixed;z-index:100000;min-width:150px;padding:2px;box-sizing:border-box;',
        'background:var(--wf-menu-bg, var(--wf-bar-top, #f9f9f9));border:1px solid var(--wf-menu-border, #a0a0a0);',
        'color:var(--wf-text, #000);box-shadow:2px 2px 6px rgba(0,0,0,.3);font:inherit;user-select:none}',
        '.wf-ts-dd-item{display:flex;align-items:center;gap:6px;height:24px;padding:0 6px 0 4px;cursor:default;',
        'border:1px solid transparent;white-space:nowrap}',
        '.wf-ts-dd-item:hover:not(.dis){background:var(--wf-hover, #e5f1fb);border-color:var(--wf-hover-border, #7eb4ea)}',
        '.wf-ts-dd-item.dis{color:var(--wf-text-off, #a0a0a0)}',
        '.wf-ts-dd-ico{width:20px;height:16px;display:inline-flex;align-items:center;justify-content:center;flex:none}',
        '.wf-ts-dd-ico img{width:16px;height:16px}',
        '.wf-ts-dd-ico.chk{background:var(--wf-press, #cce4f7);border:1px solid var(--wf-press-border, #569de5)}',
        '.wf-ts-dd-txt{flex:1 1 auto}',
        '.wf-ts-dd-sub{margin-inline-start:16px;font-size:10px}',
        '.wf-ts-dd-sep{height:1px;margin:3px 2px;background:var(--wf-sep, #c2c9d3)}',
        '.wf-ts-dd-lbl{padding:3px 8px;font-weight:bold}'
    ].join(''));

    var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

    function iconHtml(img)
    {
        if (!img) return '';
        if (/<[a-z][\s\S]*>/i.test(img)) return img;
        return IMG_RE.test(img) ? '<img src="' + esc(img) + '" alt="">' : '<span style="font-size:14px">' + esc(img) + '</span>';
    }

    function raise(o, name, e) { if (o && typeof o._raise === 'function') o._raise(name, e); }

    // --- Collection DropDownItems ---
    function initDropDownItems(ownerItem)
    {
        var list = [];
        Object.defineProperty(list, 'Count', { get: function () { return list.length; }, configurable: true });

        var adopt = function (it) { if (it && typeof it === 'object') it._ownerItem = ownerItem; return it; };
        var makeItem = function (a, b, c, d)
        {
            if (a && typeof a === 'object') return a;
            if (a === '-') return new (root.ToolStripSeparator || Object)();
            return new (root.ToolStripButton || Object)(a, b, c, d);
        };

        list.Add = function (a, b, c, d) { var it = adopt(makeItem(a, b, c, d)); list.push(it); return it; };
        list.AddRange = function (arr)
        {
            if (Array.isArray(arr)) arr.forEach(function (x) { list.push(adopt(makeItem(x))); });
        };
        list.Remove = function (it)
        {
            var i = list.indexOf(it);
            if (i >= 0) { list.splice(i, 1); it._ownerItem = null; }
        };
        list.Clear = function ()
        {
            list.forEach(function (it) { it._ownerItem = null; });
            list.splice(0, list.length);
        };
        return list;
    }

    // =====================================================================
    //  Gestion des popups (un seul DropDown ouvert à la fois)
    // =====================================================================
    var openMenus = [];      // [menuNiveau0, sousMenuNiveau1, ...]
    var openOwner = null;    // ToolStripDropDownButton actuellement ouvert

    function closeFrom(level)
    {
        while (openMenus.length > level)
        {
            var m = openMenus.pop();
            if (m.parentNode) m.parentNode.removeChild(m);
        }
    }

    function closeAll()
    {
        closeFrom(0);
        var o = openOwner;
        openOwner = null;
        unbindGlobal();
        if (o)
        {
            o._open = false;
            if (o._el) o._el.classList.remove('press');
            raise(o, 'DropDownClosed', {});
        }
    }

    function inside(t, sel) { return !!(t && t.closest && t.closest(sel)); }
    function onDocDown(e)
    {
        if (inside(e.target, '.wf-ts-dd-menu') || inside(e.target, '.wf-ts-dd-btn')) return;
        closeAll();
    }
    function onKey(e) { if (e.key === 'Escape') closeAll(); }
    function onWin() { closeAll(); }

    function bindGlobal()
    {
        document.addEventListener('mousedown', onDocDown, true);
        document.addEventListener('keydown', onKey, true);
        window.addEventListener('resize', onWin);
        window.addEventListener('blur', onWin);
    }
    function unbindGlobal()
    {
        document.removeEventListener('mousedown', onDocDown, true);
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', onWin);
        window.removeEventListener('blur', onWin);
    }

    function place(menu, rect, dir, isSub)
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

    function invoke(it)
    {
        if (typeof it.PerformClick === 'function') it.PerformClick();
        else raise(it, 'Click', {});
    }

    function buildMenu(items, top, level)
    {
        var menu = document.createElement('div');
        menu.className = 'wf-ts-dd-menu';
        var theme = top._strip && top._strip.element && top._strip.element.getAttribute('data-wf-theme');
        if (theme) menu.setAttribute('data-wf-theme', theme);

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
                closeFrom(level + 1);
                var sm = buildMenu(subs, top, level + 1);
                openMenus.push(sm);
                place(sm, row.getBoundingClientRect(), 'Right', true);
            }

            row.addEventListener('mouseenter', function ()
            {
                closeFrom(level + 1);
                if (enabled && subs) openSub();
            });
            row.addEventListener('click', function (e)
            {
                e.stopPropagation();
                if (!enabled) return;
                if (subs) { openSub(); return; }
                invoke(it);
                var args = { ClickedItem: it };
                raise(top, 'DropDownItemClicked', args);
                if (top._strip) raise(top._strip, 'ItemClicked', args);
                closeAll();
            });
            menu.appendChild(row);
        });

        return menu;
    }

    // =====================================================================
    //  ToolStripDropDownButton
    // =====================================================================
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

    if (Control.Events) Control.Events(ToolStripDropDownButton.prototype);

    var DDBP = ToolStripDropDownButton.prototype;

    DDBP.PerformClick = function ()
    {
        if (!this._enabled) return;
        if (this._checkOnClick) this.Checked = !this._checked;
        this._raise('Click');
        if (this._strip && this._strip._raise) this._strip._raise('ItemClicked', { ClickedItem: this });
    };

    DDBP.ShowDropDown = function ()
    {
        if (!this._enabled || this._open || !this._el) return;
        if (openOwner && openOwner !== this) closeAll();

        this._raise('DropDownOpening');           // les handlers peuvent remplir DropDownItems
        if (!this.DropDownItems.length) return;

        var menu = buildMenu(this.DropDownItems, this, 0);
        openMenus.push(menu);
        openOwner = this;
        this._open = true;
        this._el.classList.add('press');
        place(menu, this._el.getBoundingClientRect(), this._dropDownDirection, false);
        bindGlobal();
    };

    DDBP.HideDropDown = function ()
    {
        if (openOwner === this) closeAll();
    };

    DDBP.Dispose = function ()
    {
        this.HideDropDown();
        if (this._strip && this._strip.Items) this._strip.Items.Remove(this);
        this._el = null;
    };

    // Appelé par ToolStrip._render()
    DDBP._renderInto = function (bar)
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
            it.PerformClick();                    // peut re-rendre la barre (it._el est mis à jour)
            if (wasOpen) it.HideDropDown(); else it.ShowDropDown();
        });

        it._el = btn;
        bar.appendChild(btn);
    };

    Object.defineProperties(DDBP, {
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

    root.ToolStripDropDownButton = ToolStripDropDownButton;

    if (typeof module !== 'undefined' && module.exports)
    {
        module.exports = ToolStripDropDownButton;
    }
})(typeof window !== 'undefined' ? window : this);