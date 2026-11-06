/*!
 * DateTimePicker.js - Web port of the WinForms DateTimePicker control
 * Fully compatible with WinForms Themes, PascalCase nomenclature, and classic inheritance.
 */

(function (root) {
  'use strict';

  var CSS = [
    '.dtp { position: relative; display: inline-flex; align-items: center; box-sizing: border-box; width: 200px; height: 24px;',
    'border: 1px solid var(--wf-frame, #828790); background: var(--wf-field, #fff); color: var(--wf-text, #000);',
    'font: 12px "Segoe UI", Tahoma, Arial, sans-serif; user-select: none; outline: none; }',
    '.dtp:focus-within { border-color: var(--wf-accent, #0078d7); }',
    '.dtp-input { flex: 1; height: 100%; border: none; background: transparent; padding: 0 4px; font: inherit; color: inherit; outline: none; }',
    '.dtp-btn { flex: none; width: 18px; height: 100%; background: var(--wf-button, #e1e1e1); border-left: 1px solid var(--wf-frame, #828790); display: flex; align-items: center; justify-content: center; cursor: default; }',
    '.dtp-btn:hover { background: var(--wf-hover, #e5f1fb); }',
    '.dtp-btn:active { background: var(--wf-press, #cce4f7); }',
    '.dtp-arrow { width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid var(--wf-text, #000); }',
    
    /* Calendar Dropdown Popup (Themed) */
    '.dtp-pop { position: fixed; z-index: 99999; width: 220px; background: var(--wf-surface, #f0f0f0); color: var(--wf-text, #000);',
    'border: 1px solid var(--wf-window-border, #888); box-shadow: 2px 2px 8px var(--wf-shadow, rgba(0,0,0,0.3)); padding: 6px;',
    'font: 12px "Segoe UI", Tahoma, Arial, sans-serif; display: flex; flex-direction: column; gap: 4px; }',
    '.dtp-pop-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; padding: 4px;',
    'background: var(--wf-bar-top, #fafbfd); color: var(--wf-text, #000); border-bottom: 1px solid var(--wf-bar-border, #c5ccd6); }',
    '.dtp-pop-header button { background: var(--wf-button, #e1e1e1); border: 1px solid var(--wf-button-border, #adadad); cursor: pointer; font: inherit; padding: 2px 8px; color: var(--wf-text, #000); border-radius: 2px; }',
    '.dtp-pop-header button:hover { background: var(--wf-hover, #e5f1fb); border-color: var(--wf-accent, #0078d7); }',
    '.dtp-pop-header span { background: transparent; color: var(--wf-text, #000); padding: 2px 4px; }',

    '.dtp-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; gap: 1px; background: var(--wf-surface, #f0f0f0); margin-top: 4px; }',
    '.dtp-dow { font-size: 11px; color: var(--wf-text-dim, #6d6d6d); padding: 2px 0; background: transparent; }',
    '.dtp-day { padding: 4px 0; cursor: default; background: var(--wf-field, #fff); color: var(--wf-text, #000); border: 1px solid transparent; }',
    '.dtp-day:hover { background: var(--wf-hover, #e5f1fb); border-color: var(--wf-accent, #0078d7); }',
    '.dtp-day.other-month { color: var(--wf-text-off, #aaaaaa); }',
    '.dtp-day.selected { background: var(--wf-accent, #0078d7); color: var(--wf-accent-text, #fff); }',
    '.dtp-day.today { font-weight: bold; border-color: var(--wf-accent, #0078d7); }'
  ].join('');

  var cssInjected = false;
  function injectCss() {
    if (cssInjected) return;
    cssInjected = true;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function DateTimePicker(opts) {
    if (!(this instanceof DateTimePicker)) return new DateTimePicker(opts);
    injectCss();

    if (opts === undefined && arguments.length === 1 && typeof arguments[0] === 'object' && !(arguments[0] instanceof Element)) {
      opts = arguments[0];
    }
    opts = opts || {};

    if (root.Control) {
      root.Control.call(this, 'div', opts);
    }

    if (!this.element) {
      this.element = document.createElement('div');
    }
    this.element.className = 'dtp';
    this.element.tabIndex = 0;

    var self = this;

    var valOpt = opts.Value !== undefined ? opts.Value : opts.value;
    this._value = valOpt ? new Date(valOpt) : new Date();
    if (isNaN(this._value.getTime())) this._value = new Date();

    var minOpt = opts.MinDate !== undefined ? opts.MinDate : opts.minDate;
    this._minDate = minOpt ? new Date(minOpt) : null;

    var maxOpt = opts.MaxDate !== undefined ? opts.MaxDate : opts.maxDate;
    this._maxDate = maxOpt ? new Date(maxOpt) : null;

    this._format = opts.Format || opts.format || 'Short';
    this._customFormat = opts.CustomFormat || opts.customFormat || 'yyyy-MM-dd';
    this._handlers = {};

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'dtp-input';

    this.btn = document.createElement('div');
    this.btn.className = 'dtp-btn';
    this.btn.innerHTML = '<div class="dtp-arrow"></div>';

    this.element.appendChild(this.input);
    this.element.appendChild(this.btn);

    this._popup = null;
    this._updateText();

    this.btn.addEventListener('click', function (e) {
      e.stopPropagation();
      self._togglePopup();
    });

    this.input.addEventListener('change', function () {
      var parsed = new Date(self.input.value);
      if (!isNaN(parsed.getTime())) {
        self.Value = parsed;
      } else {
        self._updateText();
      }
    });

    if (o => opts.Theme && root.Theme) {
      this.Theme = opts.Theme;
    }

    if (typeof this._applyOptions === 'function' && opts) {
      var lay = {}, LAYOUT = ['Name', 'Tag', 'Dock', 'Anchor', 'Left', 'Top', 'Width', 'Height', 'Location', 'Size', 'Visible', 'Enabled', 'TabIndex', 'ToolTipText', 'Theme'];
      Object.keys(opts).forEach(function (k) {
        var K = k.charAt(0).toUpperCase() + k.slice(1);
        if (LAYOUT.indexOf(K) >= 0) lay[K] = opts[k];
      });
      this._applyOptions(lay);
    }
  }

  if (root.Control) {
    DateTimePicker.prototype = Object.create(root.Control.prototype);
    DateTimePicker.prototype.constructor = DateTimePicker;
  }

  var P = DateTimePicker.prototype;

  Object.defineProperties(P, {
    Value: {
      get: function () { return new Date(this._value.getTime()); },
      set: function (v) {
        var d = v instanceof Date ? v : new Date(v);
        if (isNaN(d.getTime())) return;
        if (this._minDate && d < this._minDate) d = new Date(this._minDate.getTime());
        if (this._maxDate && d > this._maxDate) d = new Date(this._maxDate.getTime());
        
        var old = this._value;
        this._value = d;
        this._updateText();
        if (old.getTime() !== d.getTime()) {
          this._emit('ValueChanged', { Value: this.Value });
        }
      }
    },
    MinDate: {
      get: function () { return this._minDate ? new Date(this._minDate.getTime()) : null; },
      set: function (v) { this._minDate = v ? new Date(v) : null; }
    },
    MaxDate: {
      get: function () { return this._maxDate ? new Date(this._maxDate.getTime()) : null; },
      set: function (v) { this._maxDate = v ? new Date(v) : null; }
    },
    Format: {
      get: function () { return this._format; },
      set: function (v) { this._format = v; this._updateText(); }
    },
    CustomFormat: {
      get: function () { return this._customFormat; },
      set: function (v) { this._customFormat = v; if (this._format === 'Custom') this._updateText(); }
    },
    Theme: {
      get: function () { return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
      set: function (v) { if (root.Theme) root.Theme.Apply(v, this.element); }
    }
  });

  P.AddOnValueChanged = function (fn) { return this.On('ValueChanged', fn); };
  P.On = function (n, fn) { (this._handlers[n] = this._handlers[n] || []).push(fn); return this; };
  P.Off = function (n, fn) {
    this._handlers[n] = (this._handlers[n] || []).filter(function (f) { return f !== fn; });
    return this;
  };
  P._emit = function (n, arg) {
    var self = this;
    (this._handlers[n] || []).slice().forEach(function (f) { f.call(self, arg); });
  };

  P._updateText = function () {
    var d = this._value;
    var txt = '';
    if (this._format === 'Short') {
      txt = d.toLocaleDateString();
    } else if (this._format === 'Long') {
      txt = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (this._format === 'Time') {
      txt = d.toLocaleTimeString();
    } else {
      txt = this._customFormat
        .replace('yyyy', d.getFullYear())
        .replace('MM', pad(d.getMonth() + 1))
        .replace('dd', pad(d.getDate()))
        .replace('HH', pad(d.getHours()))
        .replace('mm', pad(d.getMinutes()))
        .replace('ss', pad(d.getSeconds()));
    }
    this.input.value = txt;
  };

  P._togglePopup = function () {
    if (this._popup) {
      this._closePopup();
    } else {
      this._showPopup();
    }
  };

  P._closePopup = function () {
    if (this._popup && this._popup.parentNode) {
      this._popup.parentNode.removeChild(this._popup);
      document.removeEventListener('mousedown', this._docMouseDown, true);
      this._popup = null;
    }
  };

  P._showPopup = function () {
    var self = this;
    this._closePopup();

    var pop = document.createElement('div');
    pop.className = 'dtp-pop';
    this._popup = pop;

    // Héritage automatique du thème pour le popup flottant
    if (root.Theme) {
      root.Theme.Inherit(this.element, pop);
    }

    var curYear = this._value.getFullYear();
    var curMonth = this._value.getMonth();

    function renderCalendar(y, m) {
      pop.innerHTML = '';
      var header = document.createElement('div');
      header.className = 'dtp-pop-header';
      
      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.textContent = '<';
      prevBtn.onclick = function (e) { e.stopPropagation(); renderCalendar(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1); };

      var title = document.createElement('span');
      var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      title.textContent = monthNames[m] + ' ' + y;

      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.textContent = '>';
      nextBtn.onclick = function (e) { e.stopPropagation(); renderCalendar(m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1); };

      header.appendChild(prevBtn);
      header.appendChild(title);
      header.appendChild(nextBtn);
      pop.appendChild(header);

      var grid = document.createElement('div');
      grid.className = 'dtp-days-grid';

      ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(function (d) {
        var lbl = document.createElement('div');
        lbl.className = 'dtp-dow';
        lbl.textContent = d;
        grid.appendChild(lbl);
      });

      var firstDayIndex = new Date(y, m, 1).getDay();
      var totalDays = new Date(y, m + 1, 0).getDate();
      var prevTotalDays = new Date(y, m, 0).getDate();
      var today = new Date();

      for (var i = firstDayIndex - 1; i >= 0; i--) {
        var dayEl = document.createElement('div');
        dayEl.className = 'dtp-day other-month';
        dayEl.textContent = prevTotalDays - i;
        grid.appendChild(dayEl);
      }

      for (var dNum = 1; dNum <= totalDays; dNum++) {
        (function (day) {
          var dayEl = document.createElement('div');
          dayEl.className = 'dtp-day';
          if (y === today.getFullYear() && m === today.getMonth() && day === today.getDate()) {
            dayEl.classList.add('today');
          }
          if (y === self._value.getFullYear() && m === self._value.getMonth() && day === self._value.getDate()) {
            dayEl.classList.add('selected');
          }
          dayEl.textContent = day;
          dayEl.onclick = function (e) {
            e.stopPropagation();
            var newVal = new Date(y, m, day, self._value.getHours(), self._value.getMinutes(), self._value.getSeconds());
            self.Value = newVal;
            self._closePopup();
          };
          grid.appendChild(dayEl);
        })(dNum);
      }

      pop.appendChild(grid);
    }

    renderCalendar(curYear, curMonth);
    document.body.appendChild(pop);

    var rect = this.element.getBoundingClientRect();
    pop.style.left = rect.left + 'px';
    pop.style.top = (rect.bottom + 2) + 'px';

    this._docMouseDown = function (e) {
      if (!pop.contains(e.target) && !self.element.contains(e.target)) {
        self._closePopup();
      }
    };
    document.addEventListener('mousedown', this._docMouseDown, true);
  };

  P.Dispose = function () {
    this._closePopup();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  };

  root.DateTimePicker = DateTimePicker;
  if (typeof module !== 'undefined' && module.exports) module.exports = DateTimePicker;

})(typeof window !== 'undefined' ? window : this);