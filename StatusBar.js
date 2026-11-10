/*!
 * StatusBar.js - WinForms StatusBar control for JS Framework
 * Compatible with System.Windows.Forms.StatusBar & StatusBarPanel
 */

(function (root) {
    'use strict';
    var Control = root.Control;
    if (!Control) throw new Error('StatusBar.js needs Control.js to be loaded first');

    // Injection des styles CSS nécessaires
    Control.InjectCss([
        '.wf-statusbar{display:flex;align-items:center;background:var(--sb-bg,var(--wf-surface,#f0f0f0));color:var(--sb-fg,var(--wf-text,#000));border-top:1px solid var(--sb-bc,var(--wf-window-border,#888));height:22px;box-sizing:border-box;font:inherit;font-size:12px;overflow:hidden;user-select:none;width:100%}',
        '.wf-statusbar[data-dock="Bottom"]{position:absolute;bottom:0;left:0;right:0;z-index:1000;}', // <-- Cette ligne force la barre à rester en bas sans laisser d'espace en haut
        '.wf-sb-panel{display:flex;align-items:center;height:100%;padding:0 6px;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.wf-sb-panel.sunken{border-left:1px solid #888;border-top:1px solid #888;border-right:1px solid #fff;border-bottom:1px solid #fff;background:rgba(0,0,0,0.02)}',
        '.wf-sb-panel.raised{border-left:1px solid #fff;border-top:1px solid #fff;border-right:1px solid #888;border-bottom:1px solid #888}',
        '.wf-sb-panel.none{border:none}',
        '.wf-sb-panel img{width:16px;height:16px;margin-right:4px}'
    ]);
    // -------------------------------------------------------------------------
    // StatusBarPanel Class
    // -------------------------------------------------------------------------
    function StatusBarPanel(opts) {
        this._text = '';
        this._width = 100;
        this._alignment = 'Left'; // Left, Right, Center
        this._style = 'Sunken';   // None, Sunken, Raised
        this._autoSize = (root.StatusBarPanelAutoSize ? root.StatusBarPanelAutoSize.None : 'None');
        this._toolTipText = '';
        this._icon = null;
        this._owner = null;
        this.element = document.createElement('div');
        this.element.className = 'wf-sb-panel sunken';

        if (opts) {
            if (opts.Text !== undefined) this.Text = opts.Text;
            if (opts.Width !== undefined) this.Width = opts.Width;
            if (opts.Alignment !== undefined) this.Alignment = opts.Alignment;
            if (opts.Style !== undefined) this.Style = opts.Style;
            if (opts.AutoSize !== undefined) this.AutoSize = opts.AutoSize;
            if (opts.ToolTipText !== undefined) this.ToolTipText = opts.ToolTipText;
            if (opts.Icon !== undefined) this.Icon = opts.Icon;
        }
        this._update();
    }

    var P_Panel = StatusBarPanel.prototype;

    P_Panel._update = function () {
        var el = this.element;
        el.className = 'wf-sb-panel ' + this._style.toLowerCase();

        if (this._autoSize === 'Spring' || this._autoSize === '1' || this._autoSize === true) {
            el.style.flex = '1 1 0%';
            el.style.width = 'auto';
        } else {
            el.style.flex = 'none';
            el.style.width = this._width + 'px';
        }

        el.style.justifyContent = this._alignment === 'Right' ? 'flex-end' : this._alignment === 'Center' ? 'center' : 'flex-start';
        el.title = this._toolTipText || '';

        var html = '';
        if (this._icon) {
            html += '<img src="' + Control.Esc(this._icon) + '" alt="">';
        }
        html += '<span>' + Control.Esc(this._text) + '</span>';
        el.innerHTML = html;

        if (this._owner && typeof this._owner._invalidate === 'function') {
            this._owner._invalidate();
        }
    };

    Object.defineProperties(P_Panel, {
        Text: {
            get: function () { return this._text; },
            set: function (v) { this._text = v == null ? '' : String(v); this._update(); }
        },
        Width: {
            get: function () { return this._width; },
            set: function (v) { this._width = Math.max(10, +v || 0); this._autoSize = 'None'; this._update(); }
        },
        Alignment: {
            get: function () { return this._alignment; },
            set: function (v) { this._alignment = String(v); this._update(); }
        },
        Style: {
            get: function () { return this._style; },
            set: function (v) { this._style = String(v); this._update(); }
        },
        AutoSize: {
            get: function () { return this._autoSize; },
            set: function (v) { this._autoSize = v; this._update(); }
        },
        ToolTipText: {
            get: function () { return this._toolTipText; },
            set: function (v) { this._toolTipText = v == null ? '' : String(v); this._update(); }
        },
        Icon: {
            get: function () { return this._icon; },
            set: function (v) { this._icon = v || null; this._update(); }
        }
    });

    // -------------------------------------------------------------------------
    // StatusBarPanelCollection Class
    // -------------------------------------------------------------------------
    function StatusBarPanelCollection(statusBar) {
        this._sb = statusBar;
        this._list = [];
    }

    var P_Coll = StatusBarPanelCollection.prototype;

    P_Coll.Add = function (panelOrText) {
        var p = (panelOrText instanceof StatusBarPanel) ? panelOrText : new StatusBarPanel({ Text: panelOrText });
        p._owner = this._sb;
        this._list.push(p);
        this._sb.element.appendChild(p.element);
        this._sb._invalidate();
        return p;
    };

    // Implantation de AddRange (Accepte soit un tableau, soit plusieurs arguments)
    P_Coll.AddRange = function (panels) {
        var items = Array.isArray(panels) ? panels : Array.prototype.slice.call(arguments);
        var self = this;
        items.forEach(function (item) {
            self.Add(item);
        });
    };

    P_Coll.Remove = function (panel) {
        var idx = this._list.indexOf(panel);
        if (idx !== -1) {
            this._list.splice(idx, 1);
            if (panel.element.parentNode) panel.element.parentNode.removeChild(panel.element);
            panel._owner = null;
            this._sb._invalidate();
        }
    };

    P_Coll.Clear = function () {
        this._list.forEach(function (p) {
            if (p.element.parentNode) p.element.parentNode.removeChild(p.element);
            p._owner = null;
        });
        this._list = [];
        this._sb._invalidate();
    };

    Object.defineProperty(P_Coll, 'Count', {
        get: function () { return this._list.length; }
    });


    // -------------------------------------------------------------------------
    // StatusBar Class (Hérite de Control)
    // -------------------------------------------------------------------------
    function StatusBar(opts) {
        Control.call(this, 'div', 'wf-statusbar');
        this._showPanels = false;
        this._text = '';
        this._panels = new StatusBarPanelCollection(this);

        this._defaultPanel = document.createElement('div');
        this._defaultPanel.className = 'wf-sb-panel none';
        this._defaultPanel.style.flex = '1';
        this.element.appendChild(this._defaultPanel);

        this._applyOptions(opts);

        // Permet de forcer l'affichage en bas de l'écran proprement
        if (this._dock === 'Bottom') {
            this.element.setAttribute('data-dock', 'Bottom');
        }
    }

    var P_SB = Control.Extend(StatusBar);

    if (Control.ColorParts) {
        Control.ColorParts(StatusBar, {
            BackColor: '--sb-bg',
            ForeColor: '--sb-fg',
            BorderColor: '--sb-bc'
        });
    }

    P_SB._invalidate = function () {
        if (!this._showPanels) {
            this._defaultPanel.style.display = '';
            this._defaultPanel.textContent = this._text;
            this._panels._list.forEach(function (p) { p.element.style.display = 'none'; });
        } else {
            this._defaultPanel.style.display = 'none';
            this._panels._list.forEach(function (p) { p.element.style.display = ''; });
        }
    };

    // Propriétés de StatusBar
    Object.defineProperties(P_SB, {
        Text: {
            get: function () { return this._text; },
            set: function (v) {
                this._text = v == null ? '' : String(v);
                if (!this._showPanels) {
                    this._defaultPanel.textContent = this._text;
                }
                this._raise('TextChanged');
            }
        },
        ShowPanels: {
            get: function () { return this._showPanels; },
            set: function (v) {
                this._showPanels = !!v;
                this._invalidate();
            }
        },
        Panels: {
            get: function () { return this._panels; }
        }
    });

    // Exposer les classes globalement
    root.StatusBar = StatusBar;
    root.StatusBarPanel = StatusBarPanel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { StatusBar, StatusBarPanel };
    }

})(typeof window !== 'undefined' ? window : this);