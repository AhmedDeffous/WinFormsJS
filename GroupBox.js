/*!
 * GroupBox.js - WinForms GroupBox. Needs Control.js.
 *   var gb = new GroupBox({ Text: 'Titre', Left: 10, Top: 10, Width: 200, Height: 150 });
 *   gb.Controls.Add(child);
 * Properties: Text, Font, ForeColor, BackColor, etc. + everything from Control.
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('GroupBox.js needs Control.js to be loaded first');

  Control.InjectCss([
    '.wf-gb{background:var(--gb-bg,transparent);color:var(--gb-fg,var(--wf-text,#000))}',
    '.wf-gb-b{position:absolute;left:0;right:0;top:7px;bottom:0;border:1px solid var(--gb-bc,var(--wf-border,#dcdcdc));border-radius:2px;pointer-events:none}',
    '.wf-gb-t{position:absolute;left:8px;top:0;max-width:calc(100% - 16px);padding:0 3px;line-height:15px;white-space:nowrap;',
    'overflow:hidden;text-overflow:ellipsis;background:var(--gb-t-bg,var(--wf-surface,#f0f0f0));color:var(--gb-t-fg,var(--wf-group-text,var(--wf-text,#000)))}',
    '.wf-gb-c{position:absolute;left:3px;right:3px;top:16px;bottom:3px}'
  ]);

  function GroupBox(opts) {
    Control.call(this, 'div', 'wf-gb');
    this._width = 200; this._height = 100;
    
    // Éléments structurels du GroupBox
    this._b = document.createElement('div'); this._b.className = 'wf-gb-b';
    this._t = document.createElement('div'); this._t.className = 'wf-gb-t';
    this._c = document.createElement('div'); this._c.className = 'wf-gb-c';
    
    // Redirection de la collection Controls vers le conteneur interne (_c)
    this._host = this._c;
    this.Controls._host = this._c; // Ajustement si nécessaire selon votre implémentation de collection

    this.element.appendChild(this._b);
    this.element.appendChild(this._t);
    this.element.appendChild(this._c);

    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(GroupBox);

  if (Control.ColorParts) {
    Control.ColorParts(GroupBox, {
      BackColor: '--gb-bg',
      ForeColor: '--gb-fg',
      BorderColor: '--gb-bc'
    });
  }

  P._renderText = function () {
    this._t.textContent = this._text;
  };

  root.GroupBox = GroupBox;
  if (typeof module !== 'undefined' && module.exports) module.exports = GroupBox;
})(typeof window !== 'undefined' ? window : this);