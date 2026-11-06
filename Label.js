/*!
 * Label.js - WinForms Label. Needs Control.js.
 *   var lbl = new Label({ Text: '&Nom :', Left: 10, Top: 14 });                   // AutoSize (default)
 *   var big = new Label({ AutoSize: false, Width: 200, Height: 40, TextAlign: 'MiddleCenter', Text: 'Titre' });
 * Properties: Text (with & mnemonics), AutoSize, TextAlign (TopLeft ... BottomRight), UseMnemonic, BorderStyle.
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('Label.js needs Control.js to be loaded first');

  Control.InjectCss([
    '.wf-label{display:flex;overflow:hidden;line-height:15px;',
    'background:var(--lbl-bg,transparent);color:var(--lbl-fg,var(--wf-text,#000));',
    'border-color:var(--lbl-bc,transparent)}',
    '.wf-label.auto{white-space:pre}',
    '.wf-label>span{display:block;max-width:100%}'
  ]);

  function Label(opts) {
    Control.call(this, 'div', 'wf-label');
    this._autoSize = true; this._height = 15; this._width = 35;
    this._use = true; this._align = 'TopLeft';
    this._span = document.createElement('span');
    this.element.appendChild(this._span);
    this.element.classList.add('auto');
    this._alignCss();
    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(Label);

  if (Control.ColorParts) {
    Control.ColorParts(Label, {
      BackColor: '--lbl-bg',
      ForeColor: '--lbl-fg',
      BorderColor: '--lbl-bc'
    });
  }

  P._renderText = function () { this._span.innerHTML = Control.FormatText(this._text, this._use); };

  P._alignCss = function () {
    var a = this._align, s = this.element.style;
    s.alignItems = /^Top/.test(a) ? 'flex-start' : /^Bottom/.test(a) ? 'flex-end' : 'center';
    s.justifyContent = /Left$/.test(a) ? 'flex-start' : /Right$/.test(a) ? 'flex-end' : 'center';
    this._span.style.textAlign = /Left$/.test(a) ? 'left' : /Right$/.test(a) ? 'right' : 'center';
  };

  Object.defineProperties(P, {
    AutoSize: {
      get: function () { return this._autoSize; },
      set: function (v) {
        this._autoSize = !!v;
        this.element.classList.toggle('auto', this._autoSize);
        if (this._autoSize) { this.element.style.width = ''; this.element.style.height = ''; }
        this._relayout();
      }
    },
    TextAlign: {
      get: function () { return this._align; },
      set: function (v) { this._align = String(v); this._alignCss(); }
    },
    UseMnemonic: {
      get: function () { return this._use; },
      set: function (v) { this._use = !!v; this._renderText(); }
    }
  });

  root.Label = Label;
  if (typeof module !== 'undefined' && module.exports) module.exports = Label;
})(typeof window !== 'undefined' ? window : this);