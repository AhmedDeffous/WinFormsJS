/*!
 * ToolStrip.js - WinForms ToolStrip + ToolStripButton + ToolStripSeparator + ToolStripLabel + ToolStripTextBox + ToolStripComboBox. Needs Control.js and Theme.js.
 */
(function (root) {
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
    '.wf-ts-sep{width:1px;height:18px;margin:0 3px;background:var(--wf-sep, #c2c9d3);flex:none}',
    '.wf-ts-lbl{padding:0 4px;font:inherit;color:inherit;flex:none}',
    // Correction ici : forcer le conteneur et le champ interne à rester dans le flux horizontal
    '.wf-ts-control-host{display:inline-flex;align-items:center;margin:0 3px;flex:none;position:relative}',
    '.wf-ts-control-host > * {position:relative !important; display:inline-block !important;}'
  ].join(''));

  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

  function iconHtml(img) {
    if (!img) return '';
    if (/<[a-z][\s\S]*>/i.test(img)) return img;
    return IMG_RE.test(img) ? '<img src="' + esc(img) + '" alt="">' : '<span style="font-size:14px">' + esc(img) + '</span>';
  }

  // --- ToolStripSeparator ---
  function ToolStripSeparator() { this.IsSeparator = true; this._visible = true; this._strip = null; }
  Object.defineProperty(ToolStripSeparator.prototype, 'Visible', {
    get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); }
  });

  // --- ToolStripButton ---
  function ToolStripButton(text, image, onClick, name) {
    var opts = null;
    if (text && typeof text === 'object') { opts = text; text = ''; }
    this.IsSeparator = false;
    this._text = text == null ? '' : String(text);
    this._image = image || null;
    this._checked = false; this._checkOnClick = false;
    this._enabled = true; this._visible = true;
    this._toolTip = ''; this._name = name || '';
    this._strip = null; this.Tag = null;
    if (typeof onClick === 'function') this.on('Click', onClick);
    if (opts) {
      for (var k in opts) {
        if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
        if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
      }
    }
  }
  Control.Events(ToolStripButton.prototype);
  var BP = ToolStripButton.prototype;

  BP.PerformClick = function () {
    if (!this._enabled) return;
    if (this._checkOnClick) this.Checked = !this._checked;
    this._raise('Click');
    if (this._strip && this._strip._raise) this._strip._raise('ItemClicked', { ClickedItem: this });
  };

  Object.defineProperties(BP, {
    Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); if (this._strip) this._strip._render(); } },
    Image: { get: function () { return this._image; }, set: function (v) { this._image = v || null; if (this._strip) this._strip._render(); } },
    Checked: {
      get: function () { return this._checked; },
      set: function (v) {
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

  // --- ToolStripLabel ---
  function ToolStripLabel(text) {
    this.IsSeparator = false; this.IsLabel = true;
    this._text = text == null ? '' : String(text);
    this._visible = true; this._strip = null; this.Tag = null;
  }
  Object.defineProperties(ToolStripLabel.prototype, {
    Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); if (this._strip) this._strip._render(); } },
    Visible: { get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); } }
  });

  // --- ToolStripTextBox ---
  function ToolStripTextBox(opts) {
    this.IsSeparator = false;
    this.IsControlHost = true;
    this._visible = true;
    this._strip = null;
    this.Tag = null;
    
    var width = opts && opts.Width ? opts.Width : 100;
    this.TextBox = new (root.TextBox || Object)({ Width: width });
    this.element = this.TextBox.element;
    
    Object.defineProperty(this, 'Text', {
      get: function () { return this.TextBox.Text; },
      set: function (v) { this.TextBox.Text = v; }
    });

    if (opts) {
      for (var k in opts) {
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
  function ToolStripComboBox(opts) {
    this.IsSeparator = false;
    this.IsControlHost = true;
    this._visible = true;
    this._strip = null;
    this.Tag = null;

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

    if (opts) {
      for (var k in opts) {
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
  function ToolStrip(opts) {
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

  P._initItems = function () {
    var self = this, list = this.Items;
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    var adopt = function (it) { it._strip = self; return it; };
    var make = function (a, b, c, d) {
      if (a && typeof a === 'object') return a;
      if (a === '-') return new ToolStripSeparator();
      return new ToolStripButton(a, b, c, d);
    };
    list.Add = function (a, b, c, d) { var it = adopt(make(a, b, c, d)); list.push(it); self._render(); return it; };
    list.AddRange = function (arr) { arr.forEach(function (x) { list.push(adopt(make(x))); }); self._render(); };
    list.Remove = function (it) { var i = list.indexOf(it); if (i >= 0) { list.splice(i, 1); it._strip = null; self._render(); } };
    list.Clear = function () { list.forEach(function (it) { it._strip = null; }); list.splice(0, list.length); self._render(); };
  };

  P._render = function () {
    var bar = this.element;
    bar.innerHTML = '';
    this.Items.forEach(function (it) {
      if (it._visible === false) return;

      if (it.IsSeparator) {
        var sep = document.createElement('div');
        sep.className = 'wf-ts-sep';
        bar.appendChild(sep);
        return;
      }
      if (it.IsLabel) {
        var lbl = document.createElement('span');
        lbl.className = 'wf-ts-lbl';
        lbl.textContent = it._text;
        bar.appendChild(lbl);
        return;
      }
      if (it.IsControlHost && it.element) {
        var host = document.createElement('div');
        host.className = 'wf-ts-control-host';
        host.appendChild(it.element);
        bar.appendChild(host);
        return;
      }

      // ToolStripButton standard
      var btn = document.createElement('div');
      btn.className = 'wf-ts-btn' + (!it._enabled ? ' dis' : '') + (it._checked ? ' chk' : '');
      if (it._toolTip) btn.title = it._toolTip;
      var inner = iconHtml(it._image) + (it._text ? '<span style="margin-inline-start:4px;">' + esc(it._text) + '</span>' : '');
      btn.innerHTML = inner;

      btn.addEventListener('mousedown', function () { if (it._enabled && typeof it.PerformClick === 'function') btn.classList.add('press'); });
      ['mouseup', 'mouseleave'].forEach(function (ev) {
        btn.addEventListener(ev, function () { btn.classList.remove('press'); });
      });
      btn.addEventListener('click', function () {
        if (typeof it.PerformClick === 'function') {
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ToolStrip: ToolStrip,
      ToolStripButton: ToolStripButton,
      ToolStripSeparator: ToolStripSeparator,
      ToolStripLabel: ToolStripLabel,
      ToolStripTextBox: ToolStripTextBox,
      ToolStripComboBox: ToolStripComboBox
    };
  }
})(typeof window !== 'undefined' ? window : this);