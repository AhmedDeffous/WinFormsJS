/*!
 * Timer.js - WinForms Timer component. Needs Control.js.
 *
 *   var timer = new Timer({ Interval: 1000, Enabled: true });
 *   timer.on('Tick', function () {
 *       console.log('Timer tick !');
 *   });
 *   timer.Start();
 *   // timer.Stop();
 */
(function (root) {
  'use strict';
  var Control = root.Control, Events = Control.Events;

  function Timer(opts) {
    this._interval = 100;
    this._enabled = false;
    this._timerId = null;
    this.Tag = null;
    this.Name = '';

    var self = this;
    this._tickHandler = function () {
      self._raise('Tick', {});
    };

    if (opts) {
      for (var k in opts) {
        if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
        if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
      }
    }
  }

  Events(Timer.prototype);
  var TP = Timer.prototype;

  TP._updateState = function () {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    if (this._enabled && this._interval > 0) {
      var self = this;
      this._timerId = setInterval(function () {
        self._tickHandler();
      }, this._interval);
    }
  };

  TP.Start = function () {
    this.Enabled = true;
  };

  TP.Stop = function () {
    this.Enabled = false;
  };

  TP.Dispose = function () {
    this.Stop();
    if (this._events) this._events = {};
  };

  Object.defineProperties(TP, {
    Interval: {
      get: function () { return this._interval; },
      set: function (v) {
        var val = parseInt(v, 10);
        if (!isNaN(val) && val > 0) {
          this._interval = val;
          if (this._enabled) this._updateState();
        }
      }
    },
    Enabled: {
      get: function () { return this._enabled; },
      set: function (v) {
        var val = !!v;
        if (this._enabled !== val) {
          this._enabled = val;
          this._updateState();
        }
      }
    }
  });

  root.Timer = Timer;
  if (typeof module !== 'undefined' && module.exports) module.exports = Timer;
})(typeof window !== 'undefined' ? window : this);