/*!
 * SplitContainer.js - web port of the WinForms SplitContainer
 * No dependency. CSS is injected automatically.
 *
 *   var sc = new SplitContainer('#host', { orientation: 'Horizontal', splitterDistance: 300 });
 *   new ExListView(sc.Panel1, {...});          // Panel1 / Panel2 are plain <div> elements
 *   new ExListView(sc.Panel2, {...});
 *
 * Orientation (same meaning as WinForms):
 *   'Vertical'   = vertical splitter   -> Panel1 on the left, Panel2 on the right (side by side)
 *   'Horizontal' = horizontal splitter -> Panel1 on top, Panel2 at the bottom (stacked)
 *
 * Properties (PascalCase like WinForms, camelCase aliases also work):
 *   Orientation, SplitterDistance (px, size of Panel1), SplitterWidth (4), Panel1MinSize / Panel2MinSize (25),
 *   Panel1Collapsed, Panel2Collapsed (collapsing one panel un-collapses the other), FixedPanel ('None'|'Panel1'|'Panel2'),
 *   IsSplitterFixed, RightToLeft, Panel1, Panel2
 * Events (on / off): splitterMoving, splitterMoved, collapsedChanged
 * Methods: destroy()
 *
 * Drag the splitter, or focus it and use the arrow keys. SplitterDistance defaults to half of the container.
 */
(function (root) {
  'use strict';

  var CSS = [
    '.sc{position:relative;box-sizing:border-box;width:100%;height:100%;overflow:hidden;background:#f0f0f0}',
    '.sc *{box-sizing:border-box}',
    '.sc-p{position:absolute;overflow:hidden}',
    '.sc-bar{position:absolute;background:#f0f0f0;outline:none;touch-action:none}',
    '.sc.v>.sc-bar{cursor:col-resize}.sc.h>.sc-bar{cursor:row-resize}',
    '.sc.fx>.sc-bar{cursor:default}',
    '.sc-bar:focus-visible,.sc-bar.on{background:#c8c8c8}',
    '.sc.sc-drag{user-select:none}',
    '.sc-p .exlv{min-height:0}'                      // an ExListView can shrink with its panel
  ].join('');

  var cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function normOrient(v) { return String(v).toLowerCase().charAt(0) === 'h' ? 'Horizontal' : 'Vertical'; }
  function normFixed(v) {
    v = String(v);
    return /1/.test(v) ? 'Panel1' : /2/.test(v) ? 'Panel2' : 'None';
  }
  function rect(el, x, y, w, h) {
    el.style.insetInlineStart = x + 'px';
    el.style.top = y + 'px';
    el.style.width = Math.max(0, w) + 'px';
    el.style.height = Math.max(0, h) + 'px';
  }

  function SplitContainer(host, opts) {
    if (!(this instanceof SplitContainer)) return new SplitContainer(host, opts);
    injectCss();
    var o = Object.assign({
      orientation: 'Vertical', splitterDistance: null, splitterWidth: 4, panel1MinSize: 25, panel2MinSize: 25,
      panel1Collapsed: false, panel2Collapsed: false, fixedPanel: 'None', isSplitterFixed: false, rtl: false
    }, opts || {});
    var self = this;
    this.host = typeof host === 'string' ? document.querySelector(host) : host;

    this._orient = normOrient(o.orientation);
    this._sw = Math.max(1, +o.splitterWidth || 4);
    this._min1 = Math.max(0, +o.panel1MinSize || 0);
    this._min2 = Math.max(0, +o.panel2MinSize || 0);
    this._c1 = !!o.panel1Collapsed;
    this._c2 = !!o.panel2Collapsed && !this._c1;
    this._fixed = normFixed(o.fixedPanel);
    this._isFixed = !!o.isSplitterFixed;
    this._rtl = !!o.rtl;
    this._init = o.splitterDistance == null ? null : +o.splitterDistance;
    this._dist = null; this._ratio = 0.5; this._p2 = 0;
    this._laid = false; this._distTotal = null;
    this._handlers = {}; this._drag = null;

    var r = this.root = document.createElement('div');
    this._e1 = document.createElement('div'); this._e1.className = 'sc-p sc-p1';
    this._e2 = document.createElement('div'); this._e2.className = 'sc-p sc-p2';
    this._bar = document.createElement('div');
    this._bar.className = 'sc-bar'; this._bar.tabIndex = 0; this._bar.setAttribute('role', 'separator');
    r.appendChild(this._e1); r.appendChild(this._bar); r.appendChild(this._e2);
    this.host.appendChild(r);
    this._classes();
    this._bind();
    this._layout();
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(function () { self._layout(); });
      this._ro.observe(r);
    } else {
      window.addEventListener('resize', this._onWin = function () { self._layout(); });
    }
  }

  SplitContainer.Orientation = { Vertical: 'Vertical', Horizontal: 'Horizontal' };
  var P = SplitContainer.prototype;

  // ---------------------------------------------------------------- properties
  Object.defineProperties(P, {
    Panel1: { get: function () { return this._e1; } },
    Panel2: { get: function () { return this._e2; } },
    Orientation: {
      get: function () { return this._orient; },
      set: function (v) { this._orient = normOrient(v); this._distTotal = null; this._classes(); this._layout(); }
    },
    SplitterDistance: {
      get: function () { return this._dist != null ? this._dist : (this._init != null ? this._init : 0); },
      set: function (v) { this._setDist(+v, false); }
    },
    SplitterWidth: {
      get: function () { return this._sw; },
      set: function (v) { this._sw = Math.max(1, +v || 4); this._distTotal = null; this._layout(); }
    },
    Panel1MinSize: {
      get: function () { return this._min1; },
      set: function (v) { this._min1 = Math.max(0, +v || 0); this._reclamp(); }
    },
    Panel2MinSize: {
      get: function () { return this._min2; },
      set: function (v) { this._min2 = Math.max(0, +v || 0); this._reclamp(); }
    },
    Panel1Collapsed: {
      get: function () { return this._c1; },
      set: function (v) { this._collapse(!!v, v ? false : this._c2); }
    },
    Panel2Collapsed: {
      get: function () { return this._c2; },
      set: function (v) { this._collapse(v ? false : this._c1, !!v); }
    },
    FixedPanel: {
      get: function () { return this._fixed; },
      set: function (v) { this._fixed = normFixed(v); this._remember(); }
    },
    IsSplitterFixed: {
      get: function () { return this._isFixed; },
      set: function (v) { this._isFixed = !!v; this._classes(); }
    },
    RightToLeft: {
      get: function () { return this._rtl; },
      set: function (v) { this._rtl = !!v; this._classes(); this._layout(); }
    }
  });
  ['Panel1', 'Panel2', 'Orientation', 'SplitterDistance', 'SplitterWidth', 'Panel1MinSize', 'Panel2MinSize',
   'Panel1Collapsed', 'Panel2Collapsed', 'FixedPanel', 'IsSplitterFixed', 'RightToLeft'].forEach(function (n) {
    Object.defineProperty(P, n.charAt(0).toLowerCase() + n.slice(1), Object.getOwnPropertyDescriptor(P, n));
  });

  // ---------------------------------------------------------------- events
  P.on = function (n, fn) { (this._handlers[n] = this._handlers[n] || []).push(fn); return this; };
  P.off = function (n, fn) {
    this._handlers[n] = (this._handlers[n] || []).filter(function (f) { return f !== fn; });
    return this;
  };
  P._emit = function (n, arg) {
    var self = this;
    (this._handlers[n] || []).slice().forEach(function (f) { f.call(self, arg); });
  };

  // ---------------------------------------------------------------- layout
  P._classes = function () {
    this.root.className = 'sc ' + (this._orient === 'Vertical' ? 'v' : 'h') + (this._isFixed ? ' fx' : '') +
      (this._drag ? ' sc-drag' : '');
    this.root.dir = this._rtl ? 'rtl' : 'ltr';
  };

  P._avail = function () {
    var t = this._orient === 'Vertical' ? this.root.clientWidth : this.root.clientHeight;
    return Math.max(0, t - this._sw);
  };

  P._clamp = function (d, avail) {
    var lo = Math.min(this._min1, avail), hi = Math.max(lo, avail - this._min2);
    return Math.min(hi, Math.max(lo, Math.round(d)));
  };

  // what to keep when the container is resized (ratio, or the size of the fixed panel)
  P._remember = function () {
    if (!this._laid || this._dist == null) return;
    var a = this._avail();
    this._ratio = a ? this._dist / a : 0.5;
    this._p2 = a - this._dist;
  };

  P._layout = function () {
    var W = this.root.clientWidth, H = this.root.clientHeight;
    if (!W || !H) return;                                   // hidden: laid out when it becomes visible
    var vert = this._orient === 'Vertical', total = vert ? W : H;

    if (this._c1 || this._c2) {                             // one panel collapsed: the other fills everything
      this._bar.style.display = 'none';
      this._e1.style.display = this._c1 ? 'none' : '';
      this._e2.style.display = this._c2 ? 'none' : '';
      rect(this._c1 ? this._e2 : this._e1, 0, 0, W, H);
      return;
    }
    this._bar.style.display = ''; this._e1.style.display = ''; this._e2.style.display = '';

    var avail = Math.max(0, total - this._sw), d;
    if (!this._laid) {
      d = this._clamp(this._init != null ? this._init : avail / 2, avail);
      this._laid = true;
      this._dist = d;
      this._remember();
    } else if (this._distTotal !== total) {                 // the container was resized
      if (this._fixed === 'Panel1') d = this._dist;
      else if (this._fixed === 'Panel2') d = avail - this._p2;
      else d = this._ratio * avail;
      d = this._clamp(d, avail);
    } else {
      d = this._dist;
    }
    this._dist = d; this._distTotal = total;

    if (vert) {
      rect(this._e1, 0, 0, d, H);
      rect(this._bar, d, 0, this._sw, H);
      rect(this._e2, d + this._sw, 0, avail - d, H);
    } else {
      rect(this._e1, 0, 0, W, d);
      rect(this._bar, 0, d, W, this._sw);
      rect(this._e2, 0, d + this._sw, W, avail - d);
    }
  };

  // moving = true while dragging (splitterMoving), otherwise splitterMoved
  P._setDist = function (d, moving) {
    if (!this._laid) { this._init = d; this._layout(); return; }
    d = this._clamp(d, this._avail());
    if (d === this._dist) return;
    this._dist = d;
    this._remember();
    this._distTotal = null;                                 // distance is explicit: do not rescale on this pass
    this._layout();
    this._emit(moving ? 'splitterMoving' : 'splitterMoved', { distance: d });
  };

  P._reclamp = function () {
    if (!this._laid) return;
    this._dist = this._clamp(this._dist, this._avail());
    this._remember();
    this._distTotal = null;
    this._layout();
  };

  P._collapse = function (c1, c2) {
    if (c1 === this._c1 && c2 === this._c2) return;
    this._c1 = c1; this._c2 = c2;
    this._layout();
    this._emit('collapsedChanged', { panel1Collapsed: c1, panel2Collapsed: c2 });
  };

  // ---------------------------------------------------------------- mouse / touch / keyboard
  P._bind = function () {
    var self = this, bar = this._bar;

    bar.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || self._c1 || self._c2 || self._isFixed || !self._laid) return;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      bar.focus();
      var vert = self._orient === 'Vertical';
      self._drag = { pos: vert ? e.clientX : e.clientY, d: self._dist, sign: vert && self._rtl ? -1 : 1 };
      bar.classList.add('on');
      self._classes();
    });
    bar.addEventListener('pointermove', function (e) {
      var g = self._drag;
      if (!g) return;
      var pos = self._orient === 'Vertical' ? e.clientX : e.clientY;
      self._setDist(g.d + (pos - g.pos) * g.sign, true);
    });
    var end = function () {
      if (!self._drag) return;
      self._drag = null;
      bar.classList.remove('on');
      self._classes();
      self._emit('splitterMoved', { distance: self._dist });
    };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);

    bar.addEventListener('keydown', function (e) {
      if (self._isFixed) return;
      var vert = self._orient === 'Vertical', step = e.shiftKey ? 1 : 10, delta = 0;
      if (vert && e.key === 'ArrowLeft') delta = self._rtl ? step : -step;
      else if (vert && e.key === 'ArrowRight') delta = self._rtl ? -step : step;
      else if (!vert && e.key === 'ArrowUp') delta = -step;
      else if (!vert && e.key === 'ArrowDown') delta = step;
      if (!delta) return;
      e.preventDefault();
      self._setDist((self._dist || 0) + delta, false);
    });
  };

  P.destroy = function () {
    if (this._ro) this._ro.disconnect();
    if (this._onWin) window.removeEventListener('resize', this._onWin);
    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
  };

  root.SplitContainer = SplitContainer;
  if (typeof module !== 'undefined' && module.exports) module.exports = SplitContainer;
})(typeof window !== 'undefined' ? window : this);
