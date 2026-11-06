/*!
 * ToolStripContainer.js - WinForms ToolStripContainer. Needs Control.js and Theme.js.
 */
(function (root) {
  'use strict';
  var Control = root.Control;

  Control.InjectCss([
    '.wf-tsc{position:relative;width:100%;height:100%;overflow:hidden;background:var(--wf-surface, #f0f0f0)}',
    '.wf-tsc-panel{position:absolute;display:flex;flex-direction:column;box-sizing:border-box}',
    '.wf-tsc-content{position:absolute;background:var(--wf-field, #fff);overflow:auto;box-sizing:border-box}'
  ].join(''));

  function ToolStripContainer(opts) {
    Control.call(this, 'div', 'wf-tsc');
    this._width = 300; this._height = 200;

    var self = this;
    this._topPanel = document.createElement('div'); this._topPanel.className = 'wf-tsc-panel';
    this._bottomPanel = document.createElement('div'); this._bottomPanel.className = 'wf-tsc-panel';
    this._leftPanel = document.createElement('div'); this._leftPanel.className = 'wf-tsc-panel';
    this._rightPanel = document.createElement('div'); this._rightPanel.className = 'wf-tsc-panel';
    this._contentPanel = document.createElement('div'); this._contentPanel.className = 'wf-tsc-content';

    this.element.appendChild(this._topPanel);
    this.element.appendChild(this._bottomPanel);
    this.element.appendChild(this._leftPanel);
    this.element.appendChild(this._rightPanel);
    this.element.appendChild(this._contentPanel);

    // Collections simulées pour l'ajout de contrôles dans les panneaux
    this.TopToolStripPanel = makePanelCollection(this._topPanel, this);
    this.BottomToolStripPanel = makePanelCollection(this._bottomPanel, this);
    this.LeftToolStripPanel = makePanelCollection(this._leftPanel, this);
    this.RightToolStripPanel = makePanelCollection(this._rightPanel, this);
    this.ContentPanel = {
      element: this._contentPanel,
      Controls: makePanelCollection(this._contentPanel, this)
    };

    if (opts && opts.Theme) this.Theme = opts.Theme;
    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(ToolStripContainer);

  Object.defineProperty(P, 'Theme', {
    get: function () { return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
    set: function (v) {
      if (root.Theme && root.Theme.Apply) {
        root.Theme.Apply(v, this.element);
      }
    }
  });

  function makePanelCollection(hostEl, container) {
    var list = [];
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    list.Add = function (ctl) {
      if (ctl && ctl.element) {
        hostEl.appendChild(ctl.element);
        list.push(ctl);
        if (container.PerformLayout) container.PerformLayout();
      }
      return ctl;
    };
    list.Remove = function (ctl) {
      var i = list.indexOf(ctl);
      if (i >= 0) {
        list.splice(i, 1);
        if (ctl.element && ctl.element.parentNode) ctl.element.parentNode.removeChild(ctl.element);
        if (container.PerformLayout) container.PerformLayout();
      }
    };
    list.Clear = function () {
      while (list.length > 0) list.Remove(list[list.length - 1]);
    };
    return list;
  }

  P.PerformLayout = function () {
    Control.prototype.PerformLayout.call(this);
    var w = this.Width, h = this.Height;

    // Calcul dynamique des hauteurs et largeurs des panneaux en fonction de leur contenu
    var topH = this._topPanel.scrollHeight || 0;
    var botH = this._bottomPanel.scrollHeight || 0;
    var leftW = this._leftPanel.scrollWidth || 0;
    var rightW = this._rightPanel.scrollWidth || 0;

    // Positionnement Top Panel
    this._topPanel.style.left = '0px';
    this._topPanel.style.top = '0px';
    this._topPanel.style.width = w + 'px';
    this._topPanel.style.height = topH + 'px';

    // Positionnement Bottom Panel
    this._bottomPanel.style.left = '0px';
    this._bottomPanel.style.bottom = '0px';
    this._bottomPanel.style.width = w + 'px';
    this._bottomPanel.style.height = botH + 'px';

    // Positionnement Left Panel
    this._leftPanel.style.left = '0px';
    this._leftPanel.style.top = topH + 'px';
    this._leftPanel.style.width = leftW + 'px';
    this._leftPanel.style.height = Math.max(0, h - topH - botH) + 'px';

    // Positionnement Right Panel
    this._rightPanel.style.right = '0px';
    this._rightPanel.style.top = topH + 'px';
    this._rightPanel.style.width = rightW + 'px';
    this._rightPanel.style.height = Math.max(0, h - topH - botH) + 'px';

    // Positionnement Content Panel (Reste au centre)
    this._contentPanel.style.left = leftW + 'px';
    this._contentPanel.style.top = topH + 'px';
    this._contentPanel.style.width = Math.max(0, w - leftW - rightW) + 'px';
    this._contentPanel.style.height = Math.max(0, h - topH - botH) + 'px';
  };

  root.ToolStripContainer = ToolStripContainer;
  if (typeof module !== 'undefined' && module.exports) module.exports = ToolStripContainer;
})(typeof window !== 'undefined' ? window : this);