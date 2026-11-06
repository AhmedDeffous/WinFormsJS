/*!
 * Button.js - WinForms Button. Needs Control.js (ImageList.js is optional).
 *
 *   var ok = new Button({ Text: '&OK', Left: 10, Top: 10, Width: 90, Height: 28, DialogResult: 'OK' });
 *   var save = new Button({ Text: 'Enregistrer', Image: '💾', ImageAlign: 'MiddleLeft', TextAlign: 'MiddleCenter' });
 *   ok.on('Click', function (sender, e) { ... });
 *   form.Controls.AddRange([ok, save]);   form.AcceptButton = ok;  form.CancelButton = cancel;
 *
 * Properties: Text (with & mnemonics), Image (URL, data: URI, character / emoji, canvas, <img>, Blob; or an ImageList image),
 *   ImageAlign and TextAlign ('TopLeft' | 'TopCenter' | 'TopRight' | 'MiddleLeft' | 'MiddleCenter' | 'MiddleRight' |
 *   'BottomLeft' | 'BottomCenter' | 'BottomRight'; both 'MiddleCenter' by default), TextImageRelation ('Overlay' |
 *   'ImageBeforeText' | 'TextBeforeImage' | 'ImageAboveText' | 'TextAboveImage'), ImageList / ImageIndex / ImageKey,
 *   ImageSize {Width, Height}, DialogResult ('None' | 'OK' | 'Cancel' | 'Yes' | 'No' | 'Abort' | 'Retry' | 'Ignore'),
 *   FlatStyle ('Standard' | 'Flat' | 'Popup'), IsDefault (set by Form.AcceptButton), AutoSize, + everything from Control
 *   (Dock, Anchor, Left, Top, Width, Height, Visible, Enabled, Name, Theme, ToolTipText ...)
 * Methods: PerformClick()   Events: Click (and MouseDown, KeyDown ... from Control)
 * Click on a button with a DialogResult sets the DialogResult of its Form (a modal ShowDialog() then returns it).
 * Colors (the theme gives the defaults): BackColor, ForeColor, BorderColor, HoverBackColor, PressedBackColor, HoverBorderColor,
 *   PressedBorderColor, DefaultBorderColor, DisabledBackColor, DisabledForeColor, ResetColors(). A BackColor alone picks a
 *   readable text color.
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('Button.js needs Control.js to be loaded first');
  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

  Control.InjectCss([
    '.wf-bt{display:inline-block;margin:0;padding:0;font:inherit;text-align:center;cursor:default;overflow:hidden;outline:none;',
    '-webkit-appearance:none;appearance:none;user-select:none;border-radius:0;',
    'background:var(--bt-bg,var(--wf-button,#e5e5e5));color:var(--bt-fg,var(--bt-fg-auto,var(--wf-text,#000)));',
    'border:1px solid var(--wf-bc,var(--wf-button-border,#adadad))}',
    '.wf-bt:hover:not(:disabled){background:var(--bt-hover-bg,var(--wf-hover,#e5f1fb));border-color:var(--bt-hover-border,var(--wf-hover-border,#0078d7))}',
    '.wf-bt:active:not(:disabled){background:var(--bt-press-bg,var(--wf-press,#cce4f7));border-color:var(--bt-press-border,var(--wf-press-border,#005499))}',
    '.wf-bt:focus-visible{outline:1px dotted var(--bt-fg,var(--bt-fg-auto,var(--wf-text,#000)));outline-offset:-4px}',
    '.wf-bt.def{border-color:var(--bt-default-border,var(--wf-accent,#0078d7));box-shadow:inset 0 0 0 1px var(--bt-default-border,var(--wf-accent,#0078d7))}',
    '.wf-bt.flat{border-color:var(--wf-bc,var(--wf-border-strong,#646464))}',
    '.wf-bt.popup:not(:hover):not(.def){border-color:transparent;background:transparent}',
    '.wf-bt.bt-custom:hover:not(:disabled){background:var(--bt-hover-bg,rgba(127,127,127,.25))}',
    '.wf-bt.bt-custom:active:not(:disabled){background:var(--bt-press-bg,rgba(127,127,127,.4))}',
    '.wf-bt:disabled,.wf-bt.wf-disabled{background:var(--bt-off-bg,var(--wf-surface,#f0f0f0));color:var(--bt-off-fg,var(--wf-text-off,#a0a0a0));',
    'border-color:var(--wf-border-disabled,#bfbfbf);box-shadow:none}',
    '.wf-bt-l{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;padding:3px 6px;pointer-events:none}',
    '.wf-bt-t{white-space:pre;line-height:15px}',
    '.wf-bt-g{display:inline-flex;align-items:center;gap:4px}',
    '.wf-bt-i{display:inline-block;max-width:100%;max-height:100%}',
    '.wf-bt.auto{display:inline-flex;align-items:center;justify-content:center;padding:3px 10px;white-space:nowrap}',
    '.wf-bt.auto .wf-bt-l{position:static;padding:0}'
  ].join(''));

  var RESULTS = ['None', 'OK', 'Cancel', 'Abort', 'Retry', 'Ignore', 'Yes', 'No'];
  function normResult(v) {
    var s = String(v == null ? 'None' : v).toLowerCase();
    for (var i = 0; i < RESULTS.length; i++) if (RESULTS[i].toLowerCase() === s) return RESULTS[i];
    return 'None';
  }
  var ALIGNS = ['TopLeft', 'TopCenter', 'TopRight', 'MiddleLeft', 'MiddleCenter', 'MiddleRight', 'BottomLeft', 'BottomCenter', 'BottomRight'];
  function normAlign(v) {
    var s = String(v == null ? '' : v).toLowerCase();
    for (var i = 0; i < ALIGNS.length; i++) if (ALIGNS[i].toLowerCase() === s) return ALIGNS[i];
    return 'MiddleCenter';
  }
  function toSource(img) {
    if (img == null || img === '') return '';
    if (typeof img === 'string') return img;
    if (typeof Blob !== 'undefined' && img instanceof Blob) return URL.createObjectURL(img);
    if (typeof img.toDataURL === 'function') return img.toDataURL();
    if (img.src) return img.src;
    return String(img);
  }
  function place(el, a) {                                  // ContentAlignment -> flex alignment
    el.style.alignItems = /^Top/.test(a) ? 'flex-start' : /^Bottom/.test(a) ? 'flex-end' : 'center';
    el.style.justifyContent = /Left$/.test(a) ? 'flex-start' : /Right$/.test(a) ? 'flex-end' : 'center';
  }

  function Button(opts) {
    Control.call(this, 'button', 'wf-bt');
    this._width = 75; this._height = 23;
    this._img = ''; this._ia = 'MiddleCenter'; this._ta = 'MiddleCenter'; this._rel = 'Overlay'; this._dr = 'None';
    this._flat = 'Standard'; this._isDef = false; this._il = null; this._ii = -1; this._ik = ''; this._isz = null; this._use = true;
    this.element.type = 'button';
    this._li = document.createElement('span'); this._li.className = 'wf-bt-l';
    this._lt = document.createElement('span'); this._lt.className = 'wf-bt-l';
    this.element.appendChild(this._li);
    this.element.appendChild(this._lt);

    var self = this;
    this.element.addEventListener('click', function () { if (self._enabled) self._afterClick(); });
    this._applyRect();
    this._render();
    this._applyOptions(opts);
  }
  var P = Control.Extend(Button);

  Control.ColorParts(Button, {
    BackColor: '--bt-bg', ForeColor: '--bt-fg', HoverBackColor: '--bt-hover-bg', PressedBackColor: '--bt-press-bg',
    HoverBorderColor: '--bt-hover-border', PressedBorderColor: '--bt-press-border', DefaultBorderColor: '--bt-default-border',
    DisabledBackColor: '--bt-off-bg', DisabledForeColor: '--bt-off-fg'
  }, { BackColor: '--bt-fg-auto' });

  P._colorsChanged = function () { this.element.classList.toggle('bt-custom', !!this.element.style.getPropertyValue('--bt-bg')); };

  // the image: Image first, then ImageList (ImageKey, then ImageIndex)
  P._source = function () {
    if (this._img) return this._img;
    var il = this._il;
    if (!il) return '';
    var arr = il.Images || il;
    if (this._ik && il.Images) { var i = il.Images.IndexOfKey(this._ik); if (i >= 0) return arr[i] || ''; }
    return this._ii >= 0 ? arr[this._ii] || '' : '';
  };

  P._imgHtml = function (src) {
    var sz = this._isz;
    if (IMG_RE.test(src)) {
      return '<img class="wf-bt-i" src="' + Control.Esc(src) + '" alt=""' +
        (sz ? ' style="width:' + sz.Width + 'px;height:' + sz.Height + 'px"' : '') + '>';
    }
    var px = sz ? sz.Height : 16;
    return '<span class="wf-bt-i" style="font-size:' + Math.round(px * 0.9) + 'px;line-height:1">' + Control.Esc(src) + '</span>';
  };

  P._render = function () {
    var src = this._source(), txt = this._text ? '<span class="wf-bt-t">' + Control.FormatText(this._text, this._use) + '</span>' : '';
    var rel = this._autoSize && src && this._rel === 'Overlay' ? 'ImageBeforeText' : this._rel;
    this.element.classList.toggle('auto', this._autoSize);
    if (!src || rel === 'Overlay') {                        // two independent layers: image at ImageAlign, text at TextAlign
      this._li.style.display = src ? '' : 'none';
      this._li.innerHTML = src ? this._imgHtml(src) : '';
      place(this._li, this._ia);
      this._lt.innerHTML = txt;
      place(this._lt, this._ta);
      return;
    }
    var img = this._imgHtml(src), col = rel === 'ImageAboveText' || rel === 'TextAboveImage';
    var parts = rel === 'ImageBeforeText' || rel === 'ImageAboveText' ? img + txt : txt + img;
    this._li.style.display = 'none';
    this._li.innerHTML = '';
    this._lt.innerHTML = '<span class="wf-bt-g" style="flex-direction:' + (col ? 'column' : 'row') + '">' + parts + '</span>';
    place(this._lt, this._ta);                              // the group follows TextAlign
  };
  P._renderText = function () { this._render(); };

  P._enabledChanged = function () { this.element.disabled = !this._enabled; };

  // Click on a button with a DialogResult: the Form gets it (after the Click handlers, which may change it)
  P._afterClick = function () {
    var self = this;
    setTimeout(function () {
      var dr = self._dr;
      if (dr === 'None') return;
      for (var p = self.Parent; p; p = p.Parent) {
        if (typeof p.ShowDialog === 'function') { p.DialogResult = dr; return; }
      }
    }, 0);
  };

  P.PerformClick = function () {
    if (!this._enabled) return;
    this._raise('Click', {});
    this._afterClick();
  };

  Object.defineProperties(P, {
    Image: {
      get: function () { return this._img || null; },
      set: function (v) { this._img = toSource(v); this._render(); }
    },
    ImageAlign: { get: function () { return this._ia; }, set: function (v) { this._ia = normAlign(v); this._render(); } },
    TextAlign: { get: function () { return this._ta; }, set: function (v) { this._ta = normAlign(v); this._render(); } },
    TextImageRelation: {
      get: function () { return this._rel; },
      set: function (v) {
        var s = String(v).toLowerCase(), list = ['Overlay', 'ImageBeforeText', 'TextBeforeImage', 'ImageAboveText', 'TextAboveImage'];
        this._rel = list.filter(function (n) { return n.toLowerCase() === s; })[0] || 'Overlay';
        this._render();
      }
    },
    ImageList: { get: function () { return this._il; }, set: function (v) { this._il = v || null; this._render(); } },
    ImageIndex: { get: function () { return this._ii; }, set: function (v) { this._ii = v == null ? -1 : +v; this._render(); } },
    ImageKey: { get: function () { return this._ik; }, set: function (v) { this._ik = v || ''; this._render(); } },
    ImageSize: {
      get: function () { return this._isz; },
      set: function (v) { this._isz = v ? { Width: +v.Width || 16, Height: +v.Height || 16 } : null; this._render(); }
    },
    DialogResult: { get: function () { return this._dr; }, set: function (v) { this._dr = normResult(v); } },
    FlatStyle: {
      get: function () { return this._flat; },
      set: function (v) {
        var s = String(v).toLowerCase();
        this._flat = s === 'flat' ? 'Flat' : s === 'popup' ? 'Popup' : 'Standard';
        this.element.classList.toggle('flat', this._flat === 'Flat');
        this.element.classList.toggle('popup', this._flat === 'Popup');
      }
    },
    IsDefault: {
      get: function () { return this._isDef; },
      set: function (v) { this._isDef = !!v; this.element.classList.toggle('def', this._isDef); }
    },
    UseMnemonic: { get: function () { return this._use; }, set: function (v) { this._use = !!v; this._render(); } },
    AutoSize: {
      get: function () { return this._autoSize; },
      set: function (v) { this._autoSize = !!v; this._render(); this._relayout(); }
    }
  });
  P._focusEl = function () { return this.element; };

  root.Button = Button;
  if (typeof module !== 'undefined' && module.exports) module.exports = Button;
})(typeof window !== 'undefined' ? window : this);
