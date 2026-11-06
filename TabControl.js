/*!
 * TabControl.js - WinForms TabControl & TabPage with native Controls collection (Add, AddRange). Needs Control.js.
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('TabControl.js needs Control.js to be loaded first');

  Control.InjectCss([
    '.wf-tc{display:flex;flex-direction:column;background:var(--tc-bg,var(--wf-surface,#f0f0f0));border:1px solid var(--tc-bc,var(--wf-border,#7a7a7a));overflow:hidden;position:relative}',
    '.wf-tc-headers{display:flex;flex-wrap:nowrap;background:var(--tc-hd-bg,var(--wf-bar-top,#fafbfd));border-bottom:1px solid var(--tc-hd-bc,var(--wf-bar-border,#c5ccd6));overflow-x:auto;flex-shrink:0;position:relative;z-index:10;pointer-events:auto}',
    '.wf-tc-tab{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;cursor:pointer;border-right:1px solid var(--tc-hd-bc,var(--wf-bar-border,#c5ccd6));background:var(--tc-tab-bg,transparent);color:var(--tc-tab-fg,var(--wf-text,#000));user-select:none;font:inherit;pointer-events:auto}',
    '.wf-tc-tab *{cursor:pointer}',
    '.wf-tc-tab:hover{background:var(--tc-tab-hover,var(--wf-hover,#e5f1fb))}',
    '.wf-tc-tab.sel{background:var(--tc-tab-sel,var(--wf-field,#ffffff));border-bottom-color:var(--wf-field,#ffffff);font-weight:600}',
    '.wf-tc-ico{display:inline-flex;align-items:center;justify-content:center;max-width:16px;max-height:16px;pointer-events:none}',
    '.wf-tc-txt{white-space:nowrap;pointer-events:none}',
    '.wf-tc-close{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:3px;font-size:11px;line-height:1;color:var(--tc-close-fg,var(--wf-text-dim,#6d6d6d));background:transparent;border:0;cursor:pointer;padding:0;pointer-events:auto}',
    '.wf-tc-close:hover{background:var(--tc-close-hover,var(--wf-close,#e81123));color:#fff}',
    '.wf-tc-body{position:absolute;left:0;right:0;bottom:0;background:var(--tc-body-bg,var(--wf-field,#ffffff));overflow:hidden;z-index:1}',
    '.wf-tp-pane{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;z-index:1;display:none}'
  ]);

  // ==========================================
  // TABPAGE
  // ==========================================
// ==========================================
  // TABPAGE
  // ==========================================
// ==========================================
  // TABPAGE
  // ==========================================
 
 // ==========================================
  // TABPAGE
  // ==========================================
  function TabPage(opts) {
    Control.call(this, 'div', 'wf-tp-pane');
    
    this._text = opts && opts.Text != null ? opts.Text : '';
    this._icon = opts && opts.Icon != null ? opts.Icon : '';
    this._showClose = opts && opts.ShowCloseButton != null ? !!opts.ShowCloseButton : null;
    this.Tag = opts && opts.Tag !== undefined ? opts.Tag : null;
    this._tc = null;

    // Gestion du Padding (par défaut 0 ou configurable via options)
    this._padding = opts && opts.Padding !== undefined ? opts.Padding : 0;

    if (opts) {
      if (opts.Control) {
        this.Controls.Add(opts.Control);
      }
      if (opts.Controls && Array.isArray(opts.Controls)) {
        this.Controls.AddRange(opts.Controls);
      }
    }
  }
  var TP = Control.Extend(TabPage);

  Object.defineProperties(TP, {
    Text: {
      get: function () { return this._text; },
      set: function (v) { this._text = v == null ? '' : String(v); if (this._tc) this._tc._renderHeaders(); }
    },
    Icon: {
      get: function () { return this._icon; },
      set: function (v) { this._icon = v || ''; if (this._tc) this._tc._renderHeaders(); }
    },
    ShowCloseButton: {
      get: function () { return this._showClose; },
      set: function (v) { this._showClose = v != null ? !!v : null; if (this._tc) this._tc._renderHeaders(); }
    },
    Padding: {
      get: function () { return this._padding; },
      set: function (v) {
        this._padding = +v || 0;
        if (this.PerformLayout) this.PerformLayout();
      }
    },
    Control: {
      get: function () { return this.Controls.Count > 0 ? this.Controls[0] : null; },
      set: function (v) {
        this.Controls.Clear();
        if (v) this.Controls.Add(v);
      }
    }
  });

  // Surcharge du Layout de la TabPage pour intégrer le décalage de 30px ET le Padding
  TP.PerformLayout = function () {
    Control.prototype.PerformLayout.call(this);
    var topOffset = 30; // Espace réservé pour la barre de titre
    var pad = this._padding;

    for (var i = 0; i < this.Controls.Count; i++) {
      var ctl = this.Controls[i];
      if (ctl.element) {
        // Application du positionnement avec padding et décalage de la barre d'onglets
        ctl.element.style.top = (topOffset + pad) + 'px';
        ctl.element.style.left = pad + 'px';
        ctl.element.style.width = Math.max(0, this.Width - (pad * 2)) + 'px';
        ctl.element.style.height = Math.max(0, this.Height - topOffset - (pad * 2)) + 'px';
        
        if (ctl.PerformLayout) {
          ctl.PerformLayout();
        }
      }
    }
  };
  // ==========================================
  // TABCONTROL
  // ==========================================
  function TabControl(opts) {
    Control.call(this, 'div', 'wf-tc');
    this._width = 300; this._height = 200;
    this._pages = [];
    this._sel = -1;
    this._showClose = false;

    var self = this;
    this._hdEl = document.createElement('div');
    this._hdEl.className = 'wf-tc-headers';
    this._bodyEl = document.createElement('div');
    this._bodyEl.className = 'wf-tc-body';

    this.element.appendChild(this._hdEl);
    this.element.appendChild(this._bodyEl);

    this._mkPages();
    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(TabControl);

  if (Control.ColorParts) {
    Control.ColorParts(TabControl, {
      BackColor: '--tc-bg',
      ForeColor: '--tc-tab-fg'
    });
  }

  P._mkPages = function () {
    var self = this, list = this._pages;
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    
    list.Add = function (p) {
      if (!(p instanceof TabPage)) {
        p = new TabPage(p);
      }
      p._tc = self;
      list.push(p);

      self._bodyEl.appendChild(p.element);
      self.Controls.Add(p);

      self._renderHeaders();
      if (self._sel < 0) self.SelectedIndex = 0;
      else self._updateVisibility();
      return p;
    };

    list.AddRange = function (arr) { arr.forEach(function (p) { list.Add(p); }); };
    
    list.Remove = function (p) {
      var i = list.indexOf(p);
      if (i < 0) return;
      self.TabPages.RemoveAt(i);
    };

    list.RemoveAt = function (i) {
      if (i < 0 || i >= list.length) return;
      var p = list[i];
      
      var e = self._raise('TabPageClosing', { TabPage: p, Index: i, Cancel: false });
      if (e.Cancel) return;

      list.splice(i, 1);
      p._tc = null;
      if (self.Controls.Contains(p)) {
        self.Controls.Remove(p);
      }

      if (self._sel >= list.length) self._sel = list.length - 1;
      self._renderHeaders();
      self._updateVisibility();
      
      self._raise('TabPageClosed', { TabPage: p, Index: i });
      if (self._sel !== i) {
        self._raise('SelectedIndexChanged');
      }
    };

    list.Clear = function () {
      while (list.length > 0) {
        list.RemoveAt(list.length - 1);
      }
    };
  };

  P._renderHeaders = function () {
    var self = this;
    var globalClose = this._showClose;
    
    while (this._hdEl.firstChild) {
      this._hdEl.removeChild(this._hdEl.firstChild);
    }

    for (var i = 0; i < this._pages.length; i++) {
      var p = this._pages[i];
      var isSel = i === this._sel;
      var showClose = p.ShowCloseButton != null ? p.ShowCloseButton : globalClose;

      var tabEl = document.createElement('div');
      tabEl.className = 'wf-tc-tab' + (isSel ? ' sel' : '');
      tabEl.setAttribute('data-i', i);

      if (p.Icon) {
        var icoEl = document.createElement('span');
        icoEl.className = 'wf-tc-ico';
        if (p.Icon.match(/^<svg|^\s*</)) {
          icoEl.innerHTML = p.Icon;
        } else if (p.Icon.match(/\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$|\/|^data:|^http/i)) {
          var imgEl = document.createElement('img');
          imgEl.src = p.Icon;
          imgEl.style.cssText = 'max-width:16px;max-height:16px;vertical-align:middle;pointer-events:none;';
          icoEl.appendChild(imgEl);
        } else {
          icoEl.textContent = p.Icon;
        }
        tabEl.appendChild(icoEl);
      }

      var txtEl = document.createElement('span');
      txtEl.className = 'wf-tc-txt';
      txtEl.textContent = p.Text;
      tabEl.appendChild(txtEl);

      if (showClose) {
        var closeEl = document.createElement('button');
        closeEl.type = 'button';
        closeEl.className = 'wf-tc-close';
        closeEl.textContent = '×';
        closeEl.title = 'Fermer';
        
        closeEl.addEventListener('click', function (e) {
          e.stopPropagation();
          self.TabPages.RemoveAt(i);
        });
        tabEl.appendChild(closeEl);
      }

      (function (idx) {
        tabEl.addEventListener('click', function (e) {
          e.stopPropagation();
          self.SelectedIndex = idx;
        });
      })(i);

      this._hdEl.appendChild(tabEl);
    }
  };

  P._updateVisibility = function () {
    for (var i = 0; i < this._pages.length; i++) {
      var p = this._pages[i];
      if (i === this._sel) {
        p.element.style.display = 'block';
        p.Visible = true;
        if (p.PerformLayout) p.PerformLayout();
      } else {
        p.element.style.display = 'none';
        p.Visible = false;
      }
    }
    this._renderHeaders();
  };

  Object.defineProperties(P, {
    TabPages: { get: function () { return this._pages; } },
    SelectedIndex: {
      get: function () { return this._sel; },
      set: function (v) {
        v = +v;
        if (v < 0 || v >= this._pages.length) v = -1;
        if (v === this._sel) return;
        this._sel = v;
        this._updateVisibility();
        this._raise('SelectedIndexChanged');
      }
    },
    SelectedTab: {
      get: function () { return this._sel >= 0 ? this._pages[this._sel] : null; },
      set: function (v) {
        var i = this._pages.indexOf(v);
        if (i >= 0) this.SelectedIndex = i;
      }
    },
    ShowCloseButton: {
      get: function () { return this._showRootClose || this._showClose; },
      set: function (v) {
        this._showClose = !!v;
        this._renderHeaders();
      }
    }
  });


P.PerformLayout = function () 
{
    Control.prototype.PerformLayout.call(this);
    var hH = this._hdEl.offsetHeight || 28;
    var w = this.Width, h = this.Height;
    
    this._hdEl.style.width = w + 'px';
    this._bodyEl.style.top = hH + 'px';
    this._bodyEl.style.width = w + 'px';
    this._bodyEl.style.height = Math.max(0, h - hH) + 'px';

    // Décalage de 30px vers le bas pour chaque TabPage
    var topOffset =30; 
    for (var i = 0; i < this._pages.length; i++) 
	{
      var p = this._pages[i];
      p.element.style.position = 'absolute';
      p.element.style.top = topOffset + 'px';
      p.element.style.left = '0px';
      p.Width = w;
      p.Height = Math.max(0, h - hH + topOffset);//
      if (p.PerformLayout) {
        p.PerformLayout();
      }
    }
  };
  root.TabControl = TabControl;
  root.TabPage = TabPage;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TabControl: TabControl, TabPage: TabPage };
  }
})(typeof window !== 'undefined' ? window : this);