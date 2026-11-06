/*!
 * StatusStrip.js - WinForms StatusStrip + ToolStripStatusLabel. Needs Control.js and Theme.js.
 */
(function (root) {
  'use strict';
  var Control = root.Control, esc = Control.Esc;

  Control.InjectCss([
    '.wf-ss{display:flex;align-items:center;height:22px;padding:0 3px;',
    'background:var(--wf-surface, #f0f0f0);border-top:1px solid var(--wf-status-border, #d0d0d0);',
    'color:var(--wf-text, #000);font-size:12px;user-select:none;overflow:hidden}',
    '.wf-ssl{display:inline-flex;align-items:center;padding:0 6px;height:100%;white-space:nowrap;color:inherit;border:1px solid transparent}',
    '.wf-ssl.spring{flex:1}',
    '.wf-ssl img{width:16px;height:16px;margin-inline-end:4px}'
  ].join(''));

  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;
  function iconHtml(img) {
    if (!img) return '';
    return IMG_RE.test(img) ? '<img src="' + esc(img) + '" alt="">' : '<span style="font-size:14px">' + esc(img) + '</span>';
  }

  // --- ToolStripStatusLabel ---
  function ToolStripStatusLabel(text, image, onClick) {
    var opts = null;
    if (text && typeof text === 'object') { opts = text; text = ''; }
    this._text = text == null ? '' : String(text);
    this._image = image || null;
    this._spring = false; this._visible = true; this._strip = null;
    this.Tag = null;
    if (typeof onClick === 'function') this.on('Click', onClick);
    if (opts) {
      for (var k in opts) {
        if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
        if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
      }
    }
  }
  Control.Events(ToolStripStatusLabel.prototype);
  var SP = ToolStripStatusLabel.prototype;

  Object.defineProperties(SP, {
    Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); if (this._strip) this._strip._render(); } },
    Image: { get: function () { return this._image; }, set: function (v) { this._image = v || null; if (this._strip) this._strip._render(); } },
    Spring: { get: function () { return this._spring; }, set: function (v) { this._spring = !!v; if (this._strip) this._strip._render(); } },
    Visible: { get: function () { return this._visible; }, set: function (v) { this._visible = !!v; if (this._strip) this._strip._render(); } }
  });

  // --- StatusStrip ---
  function StatusStrip(opts) {
    Control.call(this, 'div', 'wf-ss');
    this._dock = 'Bottom'; this._height = 22; this._width = 200;
    this.Items = [];
    this._initItems();
    if (opts && opts.Theme) this.Theme = opts.Theme;
    this._applyRect();
    this._applyOptions(opts);
    this._render();
  }
  var P = Control.Extend(StatusStrip);

  Object.defineProperty(P, 'Theme', {
    get: function () { return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
    set: function (v) { if (root.Theme && root.Theme.Apply) root.Theme.Apply(v, this.element); }
  });

  P._initItems = function () {
    var self = this, list = this.Items;
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    var adopt = function (it) { it._strip = self; return list.push(it); };
    list.Add = function (a, b, c) {
      var it = (a instanceof ToolStripStatusLabel) ? a : new ToolStripStatusLabel(a, b, c);
      adopt(it); self._render(); return it;
    };
    list.AddRange = function (arr) { arr.forEach(function (x) { adopt(x instanceof ToolStripStatusLabel ? x : new ToolStripStatusLabel(x)); }); self._render(); };
    list.Remove = function (it) { var i = list.indexOf(it); if (i >= 0) { list.splice(i, 1); it._strip = null; self._render(); } };
    list.Clear = function () { list.forEach(function (it) { it._strip = null; }); list.splice(0, list.length); self._render(); };
  };

  P._render = function () {
    var bar = this.element;
    bar.innerHTML = '';
    this.Items.forEach(function (it) {
      if (!it._visible) return;
      var el = document.createElement('div');
      el.className = 'wf-ssl' + (it._spring ? ' spring' : '');
      el.innerHTML = iconHtml(it._image) + '<span>' + esc(it._text) + '</span>';
      el.addEventListener('click', function () { it._raise('Click'); });
      bar.appendChild(el);
    });
  };

  root.StatusStrip = StatusStrip;
  root.ToolStripStatusLabel = ToolStripStatusLabel;
  if (typeof module !== 'undefined' && module.exports) module.exports = { StatusStrip: StatusStrip, ToolStripStatusLabel: ToolStripStatusLabel };
})(typeof window !== 'undefined' ? window : this);