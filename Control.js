/*!
 * Control.js - base class of the WinForms-like web controls
 * (Panel, GroupBox, Label, TextBox, ComboBox, TabControl, Form, MenuStrip, ContextMenuStrip).
 * Load it FIRST. No dependency, CSS is injected automatically.
 *
 *   var p = new Panel({ Name: 'pnlTop', Dock: 'Top', Height: 40, BackColor: '#fff' });
 *   p.Controls.Add(new Label({ Text: '&Nom :', Left: 8, Top: 12 }));
 *   p.AppendTo('#host');                         // host = DOM element or selector (needs a size)
 *   p.Click = ...  ->  p.on('Click', function (sender, e) { ... });
 *
 * Common members
 *   Name, Text, Tag, Visible, Enabled, Dock ('None'|'Top'|'Bottom'|'Left'|'Right'|'Fill'),
 *   Anchor ('Top, Left' ...), Left, Top, Width, Height, Location {X,Y}, Size {Width,Height}, ClientSize,
 *   BackColor, ForeColor, Font (CSS font string or {Family,Size,Bold,Italic}), Cursor, BorderStyle,
 *   Padding, TabIndex, ToolTipText, ContextMenuStrip, Parent, Controls, Element, Host
 *   Controls: Add, AddRange, Remove, RemoveAt, Clear, Contains, Count, GetChildIndex, SetChildIndex
 *   Methods : Show(), Hide(), Focus(), BringToFront(), SendToBack(), PerformLayout(), FindControl(name),
 *             AppendTo(host), Dispose()
 *   Events  : on(name, fn) / off(name, fn); fn(sender, e). Click, DoubleClick, MouseDown/Up/Move/Enter/Leave,
 *             KeyDown/Up/Press, Enter, Leave, GotFocus, LostFocus, TextChanged, VisibleChanged,
 *             EnabledChanged, Resize
 *
 * Docking works like WinForms: Top/Bottom/Left/Right take their strip from the free area, Fill takes what is left.
 * Controls are docked from the last added to the first added (so add the Fill control FIRST, as the WinForms
 * designer does); Fill controls are always processed last.
 * Text accepts "&" mnemonics ("&Fichier" underlines F, "&&" is a literal &).
 */
(function (root) {
  'use strict';

  var CSS = [
    '.wf{box-sizing:border-box;font:12px "Segoe UI",Tahoma,Arial,sans-serif;color:#000}',
    '.wf *{box-sizing:border-box}',
    '.wf-ctl{position:absolute}',
    '.wf-hide{display:none!important}',
    '.wf-disabled{pointer-events:none;color:#a0a0a0}',
    '.wf-bs1{border:1px solid #646464}',
    '.wf-bs3{border:2px solid;border-color:#a0a0a0 #fff #fff #a0a0a0}'
  ].join('');

  var cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // "&Fichier" -> "<u>F</u>ichier"; "&&" -> "&"
  function formatText(t, mnemonic) {
    t = String(t == null ? '' : t);
    if (mnemonic === false) return esc(t);
    var out = '';
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i);
      if (c === '&' && i + 1 < t.length) {
        i++;
        out += t.charAt(i) === '&' ? '&amp;' : '<u>' + esc(t.charAt(i)) + '</u>';
      } else out += esc(c);
    }
    return out;
  }

  var DOCKS = { none: 'None', top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right', fill: 'Fill' };
  var CURSORS = {
    default: 'default', hand: 'pointer', ibeam: 'text', waitcursor: 'wait', cross: 'crosshair',
    sizeall: 'move', no: 'not-allowed', help: 'help'
  };
  var DOM_EVENTS = {
    Click: 'click', DoubleClick: 'dblclick', MouseDown: 'mousedown', MouseUp: 'mouseup', MouseMove: 'mousemove',
    MouseEnter: 'mouseenter', MouseLeave: 'mouseleave', MouseWheel: 'wheel',
    KeyDown: 'keydown', KeyUp: 'keyup', KeyPress: 'keypress',
    Enter: 'focusin', GotFocus: 'focusin', Leave: 'focusout', LostFocus: 'focusout'
  };

  // ---------------------------------------------------------------- event mixin (also used by menu items)
  function Events(proto) {
    proto.on = function (n, fn) {
      var h = this._ev || (this._ev = {});
      (h[n] = h[n] || []).push(fn);
      if (this._onHandler) this._onHandler(n);
      return this;
    };
    proto.off = function (n, fn) {
      if (this._ev && this._ev[n]) this._ev[n] = this._ev[n].filter(function (f) { return f !== fn; });
      return this;
    };
    proto._raise = function (n, e) {
      e = e || {};
      var l = this._ev && this._ev[n], self = this;
      if (l) l.slice().forEach(function (f) { f.call(self, self, e); });
      return e;
    };
  }

  // ---------------------------------------------------------------- Controls collection
  function Collection(owner) {
    var list = [];
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    list.Add = function (c) {
      if (c.Parent === owner) return c;
      if (c.Parent) c.Parent.Controls.Remove(c);
      list.push(c);
      c.Parent = owner;
      owner._host.appendChild(c.element);
      if (c._onParented) c._onParented(owner);
      owner._ensureObserver();
      owner._childAdded(c);
      owner._scheduleLayout();
      return c;
    };
    list.AddRange = function (arr) { arr.forEach(function (c) { list.Add(c); }); };
    list.Remove = function (c) {
      var i = list.indexOf(c);
      if (i < 0) return;
      list.splice(i, 1);
      c.Parent = null;
      if (c.element.parentNode) c.element.parentNode.removeChild(c.element);
      owner._scheduleLayout();
    };
    list.RemoveAt = function (i) { if (list[i]) list.Remove(list[i]); };
    list.Clear = function () { list.slice().forEach(list.Remove); };
    list.Contains = function (c) { return list.indexOf(c) >= 0; };
    list.GetChildIndex = function (c) { return list.indexOf(c); };
    list.SetChildIndex = function (c, i) {
      var k = list.indexOf(c);
      if (k < 0) return;
      list.splice(k, 1);
      list.splice(Math.max(0, Math.min(list.length, i)), 0, c);
      owner._scheduleLayout();
    };
    return list;
  }

  // ---------------------------------------------------------------- Control-------------------
  function Control(tag, cls, existing) {
    injectCss();
    var el = this.element = existing || document.createElement(tag || 'div');
    if (!existing) el.className = 'wf wf-ctl' + (cls ? ' ' + cls : '');
    el.__wf = this;
    this._host = el;

    this._name = ''; this._text = ''; this.Tag = null; this.Parent = null;
    this._visible = true; this._enabled = true; this._dock = 'None'; this._anchor = 'Top, Left';
    this._left = 0; this._top = 0; this._width = 100; this._height = 23; this._autoSize = false;
    this._pad = { l: 0, t: 0, r: 0, b: 0 };
    this._dom = {}; this._obs = null; this._lp = 0; this._ad = null; this._cms = null;
    this.Controls = Collection(this);
    if (!existing) this._applyRect();
  }
  Events(Control.prototype);
  var P = Control.prototype;

  P._onHandler = function (n) {
    var self = this, dn = DOM_EVENTS[n];
    if (dn && !this._dom[n]) {
      this._dom[n] = 1;
      this.element.addEventListener(dn, function (e) { if (self._enabled) self._raise(n, e); });
    }
    if (n === 'Resize') this._ensureObserver();
  };

  P._ensureObserver = function () {
    if (this._obs || typeof ResizeObserver === 'undefined') return;
    var self = this;
    this._obs = new ResizeObserver(function () {
      self._scheduleLayout();
      if (self._ev && self._ev.Resize) self._raise('Resize');
    });
    this._obs.observe(this._host);
    if (this.element !== this._host) this._obs.observe(this.element);
  };

  P._childAdded = function () { };
  P._renderText = function () { };
  P._enabledChanged = function () { };

  P._applyOptions = function (o) {
    if (!o) return;
    for (var k in o) {
      if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
      if (typeof o[k] === 'function') this.on(k, o[k]); else this[k] = o[k];
    }
  };

  P._applyRect = function () {
    var s = this.element.style;
    s.left = this._left + 'px';
    s.top = this._top + 'px';
    if (this._fixedByAuto()) { s.width = ''; s.height = ''; }
    else { s.width = this._width + 'px'; s.height = this._height + 'px'; }
  };
  P._fixedByAuto = function () { return this._autoSize && this._dock === 'None'; };
  P._relayout = function () {
    this._ad = null;
    this._applyRect();
    if (this.Parent) this.Parent._scheduleLayout();
  };

  // ---------------------------------------------------------------- layout (Dock / Anchor)
  P._scheduleLayout = function () {
    var s = this;
    if (s._lp) return;
    var run = function () { s._lp = 0; s.PerformLayout(); };
    s._lp = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 0);
  };

  function place(c, x, y, w, h) {
    var s = c.element.style;
    s.left = Math.round(x) + 'px';
    s.top = Math.round(y) + 'px';
    if (!c._fixedByAuto()) { s.width = Math.max(0, Math.round(w)) + 'px'; s.height = Math.max(0, Math.round(h)) + 'px'; }
  }

  P._anchorPlace = function (W, H) {
    var a = this._anchor, l = this._left, t = this._top, w = this._width, h = this._height;
    var AL = /left/i.test(a), AR = /right/i.test(a), AT = /top/i.test(a), AB = /bottom/i.test(a);
    if (/none/i.test(a)) AL = AT = AR = AB = false;
    if ((AR || AB) && !this._ad) this._ad = { r: W - (l + w), b: H - (t + h) };
    if (AR) { if (AL) w = Math.max(0, W - l - this._ad.r); else l = W - w - this._ad.r; }
    if (AB) { if (AT) h = Math.max(0, H - t - this._ad.b); else t = H - h - this._ad.b; }
    place(this, l, t, w, h);
  };

  P.PerformLayout = function () {
    var host = this._host, W = host.clientWidth, H = host.clientHeight;
    if (!W && !H) return;                                    // hidden / detached: the observer calls us back
    var p = this._pad, ax = p.l, ay = p.t, aw = W - p.l - p.r, ah = H - p.t - p.b;
    var list = this.Controls, fills = [], i, c;
    for (i = list.length - 1; i >= 0; i--) {                 // from the last added to the first added
      c = list[i];
      if (!c._visible) continue;
      switch (c._dock) {
        case 'Top': place(c, ax, ay, aw, c._height); ay += c._height; ah -= c._height; break;
        case 'Bottom': place(c, ax, ay + ah - c._height, aw, c._height); ah -= c._height; break;
        case 'Left': place(c, ax, ay, c._width, ah); ax += c._width; aw -= c._width; break;
        case 'Right': place(c, ax + aw - c._width, ay, c._width, ah); aw -= c._width; break;
        case 'Fill': fills.push(c); break;
        default: c._anchorPlace(W, H);
      }
    }
    fills.forEach(function (f) { place(f, ax, ay, aw, ah); });
    for (i = 0; i < list.length; i++) list[i].element.style.zIndex = list.length - i;   // index 0 = front
  };

  // ---------------------------------------------------------------- properties
  Object.defineProperties(P, {
    Element: { get: function () { return this.element; } },
    Host: { get: function () { return this._host; } },
    Name: {
      get: function () { return this._name; },
      set: function (v) { this._name = String(v); this.element.setAttribute('data-name', this._name); }
    },
    Text: {
      get: function () { return this._text; },
      set: function (v) {
        v = v == null ? '' : String(v);
        if (v === this._text) return;
        this._text = v;
        this._renderText();
        this._raise('TextChanged');
      }
    },
    Visible: {
      get: function () { return this._visible; },
      set: function (v) {
        v = !!v;
        if (v === this._visible) return;
        this._visible = v;
        this.element.classList.toggle('wf-hide', !v);
        if (this.Parent) this.Parent._scheduleLayout();
        this._raise('VisibleChanged');
      }
    },
    Enabled: {
      get: function () { return this._enabled; },
      set: function (v) {
        v = !!v;
        if (v === this._enabled) return;
        this._enabled = v;
        this.element.classList.toggle('wf-disabled', !v);
        this._enabledChanged();
        this._raise('EnabledChanged');
      }
    },
    Dock: {
      get: function () { return this._dock; },
      set: function (v) { this._dock = DOCKS[String(v).toLowerCase()] || 'None'; this._relayout(); }
    },
    Anchor: {
      get: function () { return this._anchor; },
      set: function (v) { this._anchor = Array.isArray(v) ? v.join(', ') : String(v); this._relayout(); }
    },
    Left: { get: function () { return this._left; }, set: function (v) { this._left = +v || 0; this._relayout(); } },
    Top: { get: function () { return this._top; }, set: function (v) { this._top = +v || 0; this._relayout(); } },
    Width: {
      get: function () { return this._dock !== 'None' && this.element.offsetWidth ? this.element.offsetWidth : this._width; },
      set: function (v) { this._width = Math.max(0, +v || 0); this._relayout(); }
    },
    Height: {
      get: function () { return this._dock !== 'None' && this.element.offsetHeight ? this.element.offsetHeight : this._height; },
      set: function (v) { this._height = Math.max(0, +v || 0); this._relayout(); }
    },
    Right: { get: function () { return this._left + this.Width; } },
    Bottom: { get: function () { return this._top + this.Height; } },
    Location: {
      get: function () { return { X: this._left, Y: this._top }; },
      set: function (v) { this._left = +v.X || 0; this._top = +v.Y || 0; this._relayout(); }
    }/*,
    Size: {
      get: function () { return { Width: this.Width, Height: this.Height }; },
      set: function (v) { this._width = +v.Width || 0; this._height = +v.Height || 0; this._relayout(); }
    },
    ClientSize: {
      get: function () { return { Width: this._host.clientWidth, Height: this._host.clientHeight }; },
      set: function (v) { this.Size = v; }
    }*/,
    Size: {
      get: function () {
        return {
          Width: this.Width,
          Height: this.Height,
          IsEmpty: function () { return this.Width === 0 && this.Height === 0; }
        };
      },
      set: function (v) {
        if (v && typeof v === 'object') {
          if (v.Width !== undefined && v.Height !== undefined) {
            this._width = Math.max(0, +v.Width || 0);
            this._height = Math.max(0, +v.Height || 0);
          } else if (v.width !== undefined && v.height !== undefined) {
            this._width = Math.max(0, +v.width || 0);
            this._height = Math.max(0, +v.height || 0);
          }
        } else if (Array.isArray(v) && v.length >= 2) {
          this._width = Math.max(0, +v[0] || 0);
          this._height = Math.max(0, +v[1] || 0);
        }
        this._relayout();
      }
    },
    ClientSize: {
      get: function () { return { Width: this._host.clientWidth, Height: this._host.clientHeight }; },
      set: function (v) { this.Size = v; }
    },
    BackColor: {
      get: function () { return this.element.style.backgroundColor; },
      set: function (v) { this.element.style.backgroundColor = v || ''; }
    },
    ForeColor: {
      get: function () { return this.element.style.color; },
      set: function (v) { this.element.style.color = v || ''; }
    },
    Font: {
      get: function () { return this.element.style.font; },
      set: function (v) {
        if (v && typeof v === 'object') {          // { Family, Size (points), Bold, Italic }
          v = (v.Italic ? 'italic ' : '') + (v.Bold ? 'bold ' : '') + Math.round((v.Size || 9) * 96 / 72) + 'px ' +
            (v.Family ? '"' + v.Family + '"' : '"Segoe UI"') + ',Tahoma,Arial,sans-serif';
        }
        this.element.style.font = v || '';
      }
    },
    Cursor: {
      get: function () { return this.element.style.cursor; },
      set: function (v) { this.element.style.cursor = CURSORS[String(v).toLowerCase()] || v || ''; }
    },
    BorderStyle: {                                  // 'None' | 'FixedSingle' | 'Fixed3D'
      get: function () { return this._bs || 'None'; },
      set: function (v) {
        this._bs = /single/i.test(v) ? 'FixedSingle' : /3d/i.test(v) ? 'Fixed3D' : 'None';
        this.element.classList.toggle('wf-bs1', this._bs === 'FixedSingle');
        this.element.classList.toggle('wf-bs3', this._bs === 'Fixed3D');
        if (this.Parent) this.Parent._scheduleLayout();
      }
    },
    Padding: {                                      // number, or { Left, Top, Right, Bottom }
      get: function () { var p = this._pad; return { Left: p.l, Top: p.t, Right: p.r, Bottom: p.b }; },
      set: function (v) {
        this._pad = typeof v === 'object'
          ? { l: +v.Left || 0, t: +v.Top || 0, r: +v.Right || 0, b: +v.Bottom || 0 }
          : { l: +v || 0, t: +v || 0, r: +v || 0, b: +v || 0 };
        this._scheduleLayout();
      }
    },
    TabIndex: {
      get: function () { return this._tabIndex || 0; },
      set: function (v) { this._tabIndex = +v || 0; this._focusEl().tabIndex = this._tabIndex; }
    },
    ToolTipText: {
      get: function () { return this.element.title; },
      set: function (v) { this.element.title = v || ''; }
    },
    ContextMenuStrip: {                             // a ContextMenuStrip shown on right click
      get: function () { return this._cms; },
      set: function (v) {
        var self = this;
        this._cms = v;
        if (this._cmsBound) return;
        this._cmsBound = true;
        this.element.addEventListener('contextmenu', function (e) {
          if (!self._cms || !self._enabled) return;
          e.preventDefault();
          e.stopPropagation();
          self._cms.Show(self, e.clientX, e.clientY, true);
        });
      }
    },
    Focused: { get: function () { return document.activeElement === this._focusEl(); } }
  });

  // ---------------------------------------------------------------- methods
  P._focusEl = function () { return this.element; };
  P.Focus = function () { var e = this._focusEl(); if (e.tabIndex < 0) e.tabIndex = 0; e.focus(); return true; };
  P.Show = function () { this.Visible = true; };
  P.Hide = function () { this.Visible = false; };
  P.Refresh = P.Invalidate = function () { this.PerformLayout(); };
  P.BringToFront = function () {
    if (this.Parent) this.Parent.Controls.SetChildIndex(this, 0);
  };
  P.SendToBack = function () {
    if (this.Parent) this.Parent.Controls.SetChildIndex(this, this.Parent.Controls.length);
  };
  P.FindControl = function (name) {
    for (var i = 0; i < this.Controls.length; i++) {
      var c = this.Controls[i];
      if (c.Name === name) return c;
      var f = c.FindControl(name);
      if (f) return f;
    }
    return null;
  };
  P.AppendTo = function (host) {
    Control.Root(host).Controls.Add(this);
    return this;
  };
  P.Dispose = function () {
    if (this._disposed) return;
    this._disposed = true;
    this.Controls.slice().forEach(function (c) { c.Dispose(); });
    if (this._obs) this._obs.disconnect();
    if (this.Parent) this.Parent.Controls.Remove(this);
    else if (this.element.parentNode) this.element.parentNode.removeChild(this.element);
    this._raise('Disposed');
  };
  Object.defineProperty(P, 'IsDisposed', { get: function () { return !!this._disposed; } });

  // ---------------------------------------------------------------- statics
  Control.Root = function (host) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    if (host.__wfRoot) return host.__wfRoot;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var rc = new Control(null, null, host);
    host.__wfRoot = rc;
    return rc;
  };
  Control.Extend = function (Child) {
    Child.prototype = Object.create(Control.prototype, { constructor: { value: Child, writable: true, configurable: true } });
    return Child.prototype;
  };
  Control.Events = Events;
  Control.Collection = Collection;
  Control.FormatText = formatText;
  Control.Esc = esc;

  Control.InjectCss = function (css) {
    injectCss();
    var s = document.createElement('style');
    s.textContent = Array.isArray(css) ? css.join('') : css;
    document.head.appendChild(s);
  };
  Control.ColorParts = function (Child, map, defaults) {
    Child.prototype._applyColorDefaults = function () {
      if (!defaults) return;
      var st = this.element.style;
      for (var k in defaults) {
        if (Object.prototype.hasOwnProperty.call(defaults, k) && !st.getPropertyValue(defaults[k])) {
          st.setProperty(defaults[k], defaults[k + 'Default'] || ''); // Remplacé par setProperty
        }
      }
    };
    for (var prop in map) {
      if (!Object.prototype.hasOwnProperty.call(map, prop)) continue;
      (function (p, cssVar) {
        Object.defineProperty(Child.prototype, p, {
          get: function () { return this.element.style.getPropertyValue(cssVar); },
          set: function (v) {
            if (v) this.element.style.setProperty(cssVar, v); // Remplacé par setProperty
            else this.element.style.removeProperty(cssVar);
            if (this._colorsChanged) this._colorsChanged();
          },
          configurable: true,
          enumerable: true
        });
      })(prop, map[prop]);
    }
  };
  root.Control = Control;
  //==========================================================
  /**
   * Fonction globale pour attacher des événements (compatible WinForms C# -> JS)
   * @param {Object} target - Le contrôle ou l'élément cible
   * @param {string} name - Le nom de l'événement (ex: "Click", "Tick", "Load")
   * @param {Function} handler - La fonction callback liée (.bind(this))
   */
  function AddEventHandler(target, name, handler) {
    if (!target) return;
    if (typeof target.on === 'function') {
      target.on(name, handler);
    } else {
      target[name] = handler;
    }
  }
  // Rendre la fonction disponible globalement (sur window / root)
  root.AddEventHandler = AddEventHandler;
  //==========================================================
  if (typeof module !== 'undefined' && module.exports) module.exports = Control;
})(typeof window !== 'undefined' ? window : this);