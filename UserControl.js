/*!
 * UserControl.js - web port of the WinForms UserControl
 * Inherits from Control.js (load Control.js FIRST): Controls collection, Dock/Anchor layout, Width/Height,
 * Visible/Enabled, on(name, fn) / off(name, fn) events and Dispose() all come from Control.
 *
 *   var uc = new UserControl({ Width: 300, Height: 200, Dock: 'Fill', Name: 'uc1' });
 *   uc.Controls.Add(new Label({ Text: 'Hello', Left: 8, Top: 8 }));
 *   uc.AppendTo('#host');
 *   uc.on('Load', function (sender) { ... });          // raised once, right after the control has been created
 *
 * Derived controls (contProduitStat ...):
 *   function MyControl() { UserControl.call(this, { Width: 861, Height: 770 }); ... }
 *   UserControl.Extend(MyControl);
 * Options use the Control member names (Width, Height, Dock, Name ...); lower-case names (width, dock ...) are accepted too.
 */
(function (root) {
  'use strict';

  if (typeof root.Control !== 'function') {
    throw new Error('UserControl.js: Control.js must be loaded first');
  }

  var CSS = [
    '.wf-usercontrol{overflow:hidden;outline:none;background:transparent}',
    '.wf-usercontrol *{box-sizing:border-box}'
  ].join('');

  var cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // width -> Width, dock -> Dock ... (Control.prototype._applyOptions assigns this[key] = value)
  function pascal(o) {
    var r = {};
    Object.keys(o || {}).forEach(function (k) { r[k.charAt(0).toUpperCase() + k.slice(1)] = o[k]; });
    return r;
  }

  function UserControl(opts) {
    if (!(this instanceof UserControl)) return new UserControl(opts);
    injectCss();

    var o = Object.assign({ Width: 150, Height: 150 }, pascal(opts));

    // Control(tag, cls, existing): creates this.element, this.Controls (Collection), _width/_height ...
    root.Control.call(this, 'div', 'wf-usercontrol');
    var self = this;
    this.root = this.element;
    this.element.tabIndex = 0;

    // Width, Height, Dock, Anchor, Name ... and functions given as handlers (on(name, fn))
    this._applyOptions(o);

    // WinForms life cycle: 'Load' is raised once, after the constructors of the whole chain have finished
    setTimeout(function () {
      if (self._disposed) return;
      self._raise('Load');
      if (typeof self.OnLoad === 'function') self.OnLoad();
    }, 0);
  }

  // prototype chain: UserControl -> Control
  var P = root.Control.Extend(UserControl);

  // for the controls derived from UserControl (same role as Control.Extend)
  UserControl.Extend = function (Child) {
    Child.prototype = Object.create(UserControl.prototype, { constructor: { value: Child, writable: true, configurable: true } });
    return Child.prototype;
  };

  // lower-case helper kept for the controls that raise their events with self._emit('load', arg)
  P._emit = function (n, e) {
    n = String(n);
    return this._raise(n.charAt(0).toUpperCase() + n.slice(1), e);
  };

  P.destroy = function () { this.Dispose(); };

  root.UserControl = UserControl;
  if (typeof module !== 'undefined' && module.exports) module.exports = UserControl;
})(typeof window !== 'undefined' ? window : this);
