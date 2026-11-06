/*!
 * TrackBar.js - WinForms TrackBar (slider). Needs Control.js.
 *
 *   var tb = new TrackBar({ Left: 10, Top: 10, Width: 220, Minimum: 0, Maximum: 100, Value: 40,
 *                           TickFrequency: 10, SmallChange: 1, LargeChange: 10 });
 *   tb.on('ValueChanged', function (s) { label.Text = s.Value; });
 *   tb.on('Scroll', function (s) { ... });          // only when the user moves it
 *
 * Properties: Minimum (0), Maximum (10), Value, SmallChange (1), LargeChange (5), TickFrequency (1),
 *   TickStyle ('BottomRight' | 'TopLeft' | 'Both' | 'None'), Orientation ('Horizontal' | 'Vertical'; the sizes
 *   are swapped when it changes), RightToLeftLayout (reverses a horizontal bar), Enabled, Visible, Dock ...
 * Events: ValueChanged, Scroll
 * Mouse: drag the thumb, click on the bar (moves by LargeChange). Keyboard: arrows (SmallChange), PageUp / PageDown
 *   (LargeChange), Home / End. In a vertical TrackBar the Minimum is at the top, like WinForms.
 */
(function (root) {
  'use strict';
  var Control = root.Control;

  Control.InjectCss([
    '.wf-tr{outline:none;touch-action:none;user-select:none}',
    '.wf-tr-in{position:absolute}',
    '.wf-tr-track{position:absolute;background:#e7eaea;border:1px solid #d6d6d6;border-radius:2px}',
    '.wf-tr-tk{position:absolute;background:#757575}',
    '.wf-tr-thumb{position:absolute;filter:drop-shadow(0 0 .6px #555)}',
    '.wf-tr-ti{width:100%;height:100%;background:#d6d6d6}',
    '.wf-tr-thumb:hover .wf-tr-ti,.wf-tr:focus .wf-tr-ti{background:#bcdcf4}',
    '.wf-tr-thumb.on .wf-tr-ti{background:#0078d7}',
    '.wf-tr.wf-disabled .wf-tr-ti{background:#e6e6e6}',
    '.wf-tr.wf-disabled .wf-tr-tk{background:#bbb}'
  ].join(''));

  var TW = 11, TL = 21;                            // thumb thickness / length

  function el(cls) { var e = document.createElement('div'); e.className = cls; return e; }

  function TrackBar(opts) {
    Control.call(this, 'div', 'wf-tr');
    this._width = 104; this._height = 45;
    this._min = 0; this._max = 10; this._val = 0; this._small = 1; this._large = 5; this._freq = 1;
    this._tick = 'BottomRight'; this._horiz = true; this._rtl = false; this._drag = false;

    this._in = el('wf-tr-in');
    this._track = el('wf-tr-track');
    this._ticks = el('wf-tr-ticks');
    this._thumb = el('wf-tr-thumb');
    this._ti = el('wf-tr-ti');
    this._thumb.appendChild(this._ti);
    this._in.appendChild(this._track); this._in.appendChild(this._ticks); this._in.appendChild(this._thumb);
    this.element.appendChild(this._in);
    this.element.tabIndex = 0;
    this._bind();
    this._applyRect();
    this._applyOptions(opts);
    this._apply();
  }
  var P = Control.Extend(TrackBar);

  // ---------------------------------------------------------------- drawing
  P._pct = function (v) { return this._max > this._min ? (v - this._min) / (this._max - this._min) * 100 : 0; };

  P._apply = function () {
    var h = this._horiz, ts = this._tick, A = h
      ? { pos: 'left', c1: 'top', c2: 'bottom', len: 'width', thick: 'height', ml: 'left', mr: 'right', tr: 'translateX(-50%)' }
      : { pos: 'top', c1: 'left', c2: 'right', len: 'height', thick: 'width', ml: 'top', mr: 'bottom', tr: 'translateY(-50%)' };
    var rev = h && this._rtl;
    var inS = this._in.style, tk = this._track.style, th = this._thumb.style, self = this;
    var reset = function (s) { s.top = s.left = s.right = s.bottom = ''; };

    reset(inS);
    inS[A.ml] = '8px'; inS[A.mr] = '8px'; inS[A.c1] = '0px'; inS[A.c2] = '0px';

    reset(tk); reset(th);
    tk[A.ml] = '-5px'; tk[A.mr] = '-5px'; tk[A.thick] = '4px'; tk[A.len] = '';
    th[A.len] = TW + 'px'; th[A.thick] = TL + 'px'; th.transform = A.tr;
    var both = ts === 'Both' || ts === 'None', end = ts === 'TopLeft';
    if (both) { tk[A.c1] = 'calc(50% - 2px)'; th[A.c1] = 'calc(50% - ' + TL / 2 + 'px)'; }
    else if (end) { tk[A.c2] = '12px'; th[A.c2] = '3px'; }
    else { tk[A.c1] = '12px'; th[A.c1] = '3px'; }

    // thumb shape: points towards the ticks
    var clip;
    if (both) clip = 'polygon(0 0,100% 0,100% 100%,0 100%)';
    else if (h) clip = end ? 'polygon(50% 0,100% 38%,100% 100%,0 100%,0 38%)' : 'polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)';
    else clip = end ? 'polygon(38% 0,100% 0,100% 100%,38% 100%,0 50%)' : 'polygon(0 0,62% 0,100% 50%,62% 100%,0 100%)';
    this._ti.style.clipPath = clip;
    this._ti.style.webkitClipPath = clip;

    // ticks (the first and the last one are always drawn)
    this._ticks.innerHTML = '';
    var set = [];
    if (ts !== 'None' && this._max > this._min) {
      for (var v = this._min; v <= this._max && set.length < 400; v += this._freq) set.push(v);
      if (set[set.length - 1] !== this._max) set.push(this._max);
    }
    var sides = ts === 'Both' ? ['a', 'b'] : ts === 'None' ? [] : [end ? 'b' : 'a'];
    sides.forEach(function (side) {
      set.forEach(function (v) {
        var t = el('wf-tr-tk'), s = t.style, p = self._pct(v);
        s[A.len] = '1px'; s[A.thick] = '4px';
        s[A.pos] = (rev ? 100 - p : p) + '%';
        if (ts === 'Both') { if (side === 'a') s[A.c1] = 'calc(50% + 12px)'; else s[A.c2] = 'calc(50% + 12px)'; }
        else if (end) s[A.c2] = '27px';
        else s[A.c1] = '27px';
        self._ticks.appendChild(t);
      });
    });
    this._place();
  };

  P._place = function () {
    var p = this._pct(this._val);
    this._thumb.style[this._horiz ? 'left' : 'top'] = (this._horiz && this._rtl ? 100 - p : p) + '%';
  };

  // ---------------------------------------------------------------- value
  P._clampVal = function (v) { return Math.max(this._min, Math.min(this._max, Math.round(+v || 0))); };

  P._setValue = function (v, user) {
    v = this._clampVal(v);
    if (v === this._val) return false;
    this._val = v;
    this._place();
    if (user) this._raise('Scroll', {});
    this._raise('ValueChanged', {});
    return true;
  };

  P._valueAt = function (e) {
    var r = this._in.getBoundingClientRect();
    var p = this._horiz ? (e.clientX - r.left) / (r.width || 1) : (e.clientY - r.top) / (r.height || 1);
    p = Math.max(0, Math.min(1, p));
    if (this._horiz && this._rtl) p = 1 - p;
    return this._min + p * (this._max - this._min);
  };

  // ---------------------------------------------------------------- input
  P._bind = function () {
    var self = this, tr = this.element;

    tr.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !self._enabled) return;
      e.preventDefault();
      tr.focus();
      if (self._thumb.contains(e.target)) {
        self._drag = true;
        self._thumb.classList.add('on');
        if (tr.setPointerCapture) tr.setPointerCapture(e.pointerId);
      } else {                                        // click on the bar: one LargeChange towards the pointer
        var t = self._valueAt(e);
        self._setValue(self._val + (t > self._val ? self._large : -self._large), true);
      }
    });
    tr.addEventListener('pointermove', function (e) { if (self._drag) self._setValue(self._valueAt(e), true); });
    var end = function () { self._drag = false; self._thumb.classList.remove('on'); };
    tr.addEventListener('pointerup', end);
    tr.addEventListener('pointercancel', end);

    tr.addEventListener('keydown', function (e) {
      var k = e.key, v = self._val, n = null, rev = self._horiz && self._rtl;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = v + (rev && k === 'ArrowRight' ? -self._small : self._small);
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = v - (rev && k === 'ArrowLeft' ? -self._small : self._small);
      else if (k === 'PageDown') n = v + self._large;
      else if (k === 'PageUp') n = v - self._large;
      else if (k === 'Home') n = self._min;
      else if (k === 'End') n = self._max;
      if (n === null) return;
      e.preventDefault();
      self._setValue(n, true);
    });
  };

  // ---------------------------------------------------------------- properties
  Object.defineProperties(P, {
    Minimum: {
      get: function () { return this._min; },
      set: function (v) {
        this._min = Math.round(+v || 0);
        if (this._max < this._min) this._max = this._min;
        this._apply();
        this._setValue(this._val, false);
      }
    },
    Maximum: {
      get: function () { return this._max; },
      set: function (v) {
        this._max = Math.round(+v || 0);
        if (this._min > this._max) this._min = this._max;
        this._apply();
        this._setValue(this._val, false);
      }
    },
    Value: { get: function () { return this._val; }, set: function (v) { this._setValue(v, false); } },
    SmallChange: { get: function () { return this._small; }, set: function (v) { this._small = Math.max(1, Math.round(+v || 1)); } },
    LargeChange: { get: function () { return this._large; }, set: function (v) { this._large = Math.max(1, Math.round(+v || 1)); } },
    TickFrequency: { get: function () { return this._freq; }, set: function (v) { this._freq = Math.max(1, Math.round(+v || 1)); this._apply(); } },
    TickStyle: {
      get: function () { return this._tick; },
      set: function (v) {
        var s = String(v);
        this._tick = /none/i.test(s) ? 'None' : /both/i.test(s) ? 'Both' : /top|left/i.test(s) ? 'TopLeft' : 'BottomRight';
        this._apply();
      }
    },
    Orientation: {
      get: function () { return this._horiz ? 'Horizontal' : 'Vertical'; },
      set: function (v) {
        var h = !/vert/i.test(v);
        if (h === this._horiz) return;
        this._horiz = h;
        var w = this._width; this._width = this._height; this._height = w;       // like WinForms: width and height swap
        this._apply();
        this._relayout();
      }
    },
    RightToLeftLayout: { get: function () { return this._rtl; }, set: function (v) { this._rtl = !!v; this._apply(); } }
  });

  root.TrackBar = TrackBar;
  if (typeof module !== 'undefined' && module.exports) module.exports = TrackBar;
})(typeof window !== 'undefined' ? window : this);
