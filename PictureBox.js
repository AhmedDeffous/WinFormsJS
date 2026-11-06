/*!
 * PictureBox.js - WinForms PictureBox. Needs Control.js (ImageList.js is optional).
 *
 *   var pb = new PictureBox({ Left: 10, Top: 10, Width: 200, Height: 150, SizeMode: 'Zoom', BorderStyle: 'FixedSingle' });
 *   pb.Image = 'photos/a.jpg';                  // URL, data: URI, character / emoji, canvas, <img>, Blob / File
 *   pb.ImageLocation = 'photos/b.jpg';         // same, like WinForms
 *   pb.on('LoadCompleted', function (s, e) { if (e.Error) ... });
 *
 * Properties: Image, ImageLocation, SizeMode ('Normal' | 'StretchImage' | 'AutoSize' | 'CenterImage' | 'Zoom'),
 *   ErrorImage (shown when the image cannot be loaded), BorderStyle ('None' | 'FixedSingle' | 'Fixed3D'), BackColor,
 *   ImageSize (natural size, read only), + everything from Control (Dock, Visible, Enabled, Anchor ...)
 * Methods: Load(url), Clear()
 * Events : LoadCompleted ({ Error }), Click, DoubleClick ...
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('PictureBox.js needs Control.js to be loaded first');
  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

  Control.InjectCss([
    '.wf-pb{overflow:hidden;container-type:size;background:var(--pb-bg,transparent);color:var(--pb-fg,var(--wf-text,#000))}',
    '.wf-pb-i{display:block;border:0;user-select:none;-webkit-user-drag:none;max-width:none}',
    '.wf-pb.m-Normal .wf-pb-i,.wf-pb.m-AutoSize .wf-pb-i{width:auto;height:auto}',
    '.wf-pb.m-StretchImage .wf-pb-i{width:100%;height:100%;object-fit:fill}',
    '.wf-pb.m-Zoom .wf-pb-i{width:100%;height:100%;object-fit:contain}',
    '.wf-pb.m-CenterImage .wf-pb-i{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;height:auto}',
    '.wf-pb-g{display:none;align-items:center;justify-content:center;width:100%;height:100%;font-size:70px;font-size:70cqmin;line-height:1}'
  ]);

  function PictureBox(opts) {
    Control.call(this, 'div', 'wf-pb m-Normal');
    this._width = 100; this._height = 50;
    this._src = ''; this._loc = ''; this._mode = 'Normal'; this._err = '';
    this._img = document.createElement('img');
    this._img.className = 'wf-pb-i';
    this._img.alt = '';
    this._img.style.display = 'none';
    this._glyph = document.createElement('div');
    this._glyph.className = 'wf-pb-g';
    this.element.appendChild(this._img);
    this.element.appendChild(this._glyph);

    var self = this;
    this._img.addEventListener('load', function () {
      if (self._mode === 'AutoSize') self._fit();
      self._raise('LoadCompleted', { Error: false, Cancelled: false });
    });
    this._img.addEventListener('error', function () {
      if (self._err && !self._errShown) { self._errShown = true; self._img.src = self._err; return; }
      self._raise('LoadCompleted', { Error: true, Cancelled: false });
    });
    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(PictureBox);

  if (Control.ColorParts) {
    Control.ColorParts(PictureBox, {
      BackColor: '--pb-bg',
      ForeColor: '--pb-fg'
    });
  }

  // AutoSize: the control takes the size of the image (plus the border)
  P._fit = function () {
    var b = this._bs === 'Fixed3D' ? 4 : this._bs === 'FixedSingle' ? 2 : 0;
    var w = this._img.naturalWidth || 0, h = this._img.naturalHeight || 0;
    if (!w || !h) return;
    this._width = w + b; this._height = h + b;
    this._relayout();
  };

  P._setSource = function (v) {
    if (v && typeof v !== 'string') {
      if (typeof Blob !== 'undefined' && v instanceof Blob) v = URL.createObjectURL(v);
      else if (typeof v.toDataURL === 'function') v = v.toDataURL();
      else if (v.src) v = v.src;
      else v = String(v);
    }
    v = v || '';
    this._src = v;
    this._errShown = false;
    var isImg = !!v && IMG_RE.test(v);
    this._img.style.display = isImg ? '' : 'none';
    this._glyph.style.display = v && !isImg ? 'flex' : 'none';
    this._glyph.textContent = v && !isImg ? v : '';
    if (isImg) this._img.src = v; else this._img.removeAttribute('src');
  };

  Object.defineProperties(P, {
    Image: {
      get: function () { return this._src || null; },
      set: function (v) { this._loc = ''; this._setSource(v); }
    },
    ImageLocation: {
      get: function () { return this._loc; },
      set: function (v) { this._loc = v || ''; this._setSource(this._loc); }
    },
    SizeMode: {
      get: function () { return this._mode; },
      set: function (v) {
        var s = String(v), m = /stretch/i.test(s) ? 'StretchImage' : /auto/i.test(s) ? 'AutoSize' : /center/i.test(s) ? 'CenterImage' :
          /zoom/i.test(s) ? 'Zoom' : 'Normal';
        this.element.classList.remove('m-' + this._mode);
        this._mode = m;
        this.element.classList.add('m-' + m);
        if (m === 'AutoSize') this._fit();
      }
    },
    ErrorImage: { get: function () { return this._err; }, set: function (v) { this._err = v || ''; } },
    ImageSize: { get: function () { return { Width: this._img.naturalWidth || 0, Height: this._img.naturalHeight || 0 }; } }
  });

  P.Load = function (url) { if (url != null) this.ImageLocation = url; else this._setSource(this._loc); };
  P.Clear = function () { this.Image = null; };

  root.PictureBox = PictureBox;
  if (typeof module !== 'undefined' && module.exports) module.exports = PictureBox;
})(typeof window !== 'undefined' ? window : this);