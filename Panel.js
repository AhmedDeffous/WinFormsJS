/*!
 * Panel.js - WinForms Panel. Needs Control.js.
 *   var pnl = new Panel({ Dock: 'Left', Width: 200, BorderStyle: 'FixedSingle', AutoScroll: false });
 *   pnl.Controls.Add(child);
 * Properties: everything from Control + AutoScroll (scroll bars when the content is larger).
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('Panel.js needs Control.js to be loaded first');

  // Injection du style CSS par défaut basé sur les variables du thème
  Control.InjectCss([
    '.wf-panel{background:var(--pnl-bg,var(--wf-surface,#f0f0f0));color:var(--pnl-fg,var(--wf-text,#000));',
    'border:1px solid var(--pnl-bc,var(--wf-border-soft,#d9d9d9))}'
  ]);

  function Panel(opts) {
    Control.call(this, 'div', 'wf-panel');
    this._width = 200; this._height = 100;
    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(Panel);

  // Permet de gérer les propriétés de couleurs de la même manière que Button.js
  if (Control.ColorParts) {
    Control.ColorParts(Panel, {
      BackColor: '--pnl-bg',
      ForeColor: '--pnl-fg',
      BorderColor: '--pnl-bc'
    });
  }

  Object.defineProperties(P, {
    AutoScroll: {
      get: function () { return !!this._autoScroll; },
      set: function (v) { this._autoScroll = !!v; this.element.style.overflow = v ? 'auto' : ''; }
    }
  });

  root.Panel = Panel;
  if (typeof module !== 'undefined' && module.exports) module.exports = Panel;
})(typeof window !== 'undefined' ? window : this);