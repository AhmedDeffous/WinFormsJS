/*!
 * ContextMenuStrip.js - WinForms ContextMenuStrip. Needs Control.js and MenuStrip.js (load them first).
 *
 *   var cms = new ContextMenuStrip();
 *   cms.Items.Add('&Copier', '📋', function () { ... }, 'Ctrl+C');            // text, icon, click, shortcut text
 *   cms.Items.Add('-');
 *   var gras = cms.Items.Add('Gras'); gras.CheckOnClick = true; gras.Checked = true;
 *   var tri = cms.Items.Add('Trier'); tri.DropDownItems.Add('Croissant'); tri.DropDownItems.Add('Décroissant');
 *   cms.on('Opening', function (s, e) { e.Cancel = false; coller.Enabled = hasClipboard(); });
 *
 *   panel.ContextMenuStrip = cms;                 // shown on right click on that control
 *   cms.Show(100, 120);                           // at viewport coordinates
 *   cms.Show(panel, { X: 10, Y: 10 });            // relative to a control (like WinForms Show(Control, Point))
 *   cms.Close();
 *
 * Items: same collection and same ToolStripMenuItem (Text, Image / Icon, Checked, CheckOnClick, Enabled, Visible,
 *        ShortcutKeys (display text), DropDownItems ...) as MenuStrip.
 * Members: Items, Name, Tag, SourceControl (the control that opened it), Show(...), Close()
 * Events : Opening (e.Cancel), Opened, Closed, ItemClicked (e.ClickedItem)
 */
/*!
 * ContextMenuStrip.js - WinForms ContextMenuStrip. Needs Control.js, MenuStrip.js and Theme.js (load them first).
 */
(function (root) {
  'use strict';
  var Control = root.Control, MenuStrip = root.MenuStrip;
  if (!MenuStrip) throw new Error('ContextMenuStrip.js needs MenuStrip.js to be loaded first');

  function ContextMenuStrip(opts) {
    this.Name = '';
    this.Tag = null;
    this.SourceControl = null;
    this.Items = MenuStrip.CreateItems(this);
    if (opts) {
      for (var k in opts) {
        if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
        if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
      }
    }
  }
  Control.Events(ContextMenuStrip.prototype);
  var P = ContextMenuStrip.prototype;

  // Show(x, y) | Show(mouseEvent) | Show(control, { X, Y }) | Show(control, x, y, true)
  P.Show = function (a, b, c, d) {
    var x, y, src = null;
    if (typeof a === 'number') { x = a; y = b; }
    else if (a && a.clientX !== undefined) { x = a.clientX; y = a.clientY; }
    else {
      src = a && a.element ? a : null;
      var el = a && a.element ? a.element : a, r = el.getBoundingClientRect();
      if (typeof b === 'number') { x = d === true ? b : r.left + b; y = d === true ? c : r.top + c; }
      else { x = r.left + ((b && b.X) || 0); y = r.top + ((b && b.Y) || 0); }
    }
    
    var e = this._raise('Opening', { Cancel: false });
    if (e.Cancel || !this.Items.length) return false;
    
    this.SourceControl = src;
    var self = this;
    
    // Transmission du composant source (src) pour que les menus contextuels héritent du thème du Panel / Contrôle parent
    MenuStrip.ShowPopup(this.Items, x, y, function () { self._raise('Closed', {}); }, null, null, src);
    
    this._raise('Opened', {});
    return true;
  };

  P.Close = function () { MenuStrip.CloseAll(); };

  root.ContextMenuStrip = ContextMenuStrip;
  if (typeof module !== 'undefined' && module.exports) module.exports = ContextMenuStrip;
})(typeof window !== 'undefined' ? window : this);