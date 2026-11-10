/*!
 * ProgressBar.js - WinForms ProgressBar component. Needs Control.js and Theme.js.
 *
 *   var pb = new ProgressBar({ Width: 200, Height: 23, Minimum: 0, Maximum: 100, Value: 50 });
 *   pb.Value = 75;
 *   form.Controls.Add(pb);
 */
(function (root) {
  'use strict';
  var Control = root.Control;

  Control.InjectCss([
    '.wf-pb{position:relative;background:var(--wf-field, #fff);border:1px solid var(--wf-border, #7a7a7a);border-radius:2px;overflow:hidden;box-sizing:border-box}',
    '.wf-pb-chunk{position:absolute;left:0;top:0;bottom:0;background:var(--wf-accent, #0078d7);transition:width 0.1s ease-out}',
    '.wf-pb.wf-disabled{background:var(--wf-surface, #f0f0f0);border-color:var(--wf-border-disabled, #bfbfbf)}',
    '.wf-pb.wf-disabled .wf-pb-chunk{background:var(--wf-text-off, #a0a0a0)}',
    '.wf-progressbar-marquee .wf-progress-fill {background - image: linear - gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);animation: wf - marquee 1.5s infinite linear;  width: 40 % !important;}',
    '@keyframes wf - marquee {  0 % { transform: translateX(-100 %); }  100 % { transform: translateX(350 %); }}',
    '.wf - progressbar - continuous.wf - progress - fill {  border - radius: 0;} '
  ].join(''));

  function ProgressBar(opts) {
    Control.call(this, 'div', 'wf-pb');
    this._width = 100;
    this._height = 23;
    this._minimum = 0;
    this._maximum = 100;
    this._value = 0;
    this._step = 10;
    this.Tag = null;
    this.Name = '';

    this._chunk = document.createElement('div');
    this._chunk.className = 'wf-pb-chunk';
    this.element.appendChild(this._chunk);

    if (opts && opts.Theme) this.Theme = opts.Theme;
    this._applyRect();
    this._applyOptions(opts);
    this._updateChunk();
  }

  var P = Control.Extend(ProgressBar);

  Object.defineProperty(P, 'Theme', {
    get: function () { return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
    set: function (v) {
      if (root.Theme && root.Theme.Apply) {
        root.Theme.Apply(v, this.element);
      }
    }
  });

  P._updateChunk = function () {
    var min = this._minimum;
    var max = this._maximum;
    var val = this._value;
    if (max <= min) {
      this._chunk.style.width = '0%';
      return;
    }
    var pct = (val - min) / (max - min);
    pct = Math.max(0, Math.min(1, pct));
    this._chunk.style.width = (pct * 100) + '%';
  };

  P.PerformStep = function () {
    this.Value = Math.min(this._maximum, this._value + this._step);
  };

  P.Increment = function (val) {
    this.Value = Math.min(this._maximum, this._value + (val || 0));
  };

  Object.defineProperties(P, {
    Minimum: {
      get: function () { return this._minimum; },
      set: function (v) {
        var val = parseInt(v, 10);
        if (!isNaN(val)) {
          this._minimum = val;
          if (this._value < this._minimum) this._value = this._minimum;
          if (this._maximum < this._minimum) this._maximum = this._minimum;
          this._updateChunk();
        }
      }
    },
    Maximum: {
      get: function () { return this._maximum; },
      set: function (v) {
        var val = parseInt(v, 10);
        if (!isNaN(val)) {
          this._maximum = val;
          if (this._value > this._maximum) this._value = this._maximum;
          if (this._minimum > this._maximum) this._minimum = this._maximum;
          this._updateChunk();
        }
      }
    },
    Value: {
      get: function () { return this._value; },
      set: function (v) {
        var val = parseInt(v, 10);
        if (!isNaN(val)) {
          this._value = Math.max(this._minimum, Math.min(this._maximum, val));
          this._updateChunk();
          this._raise('ValueChanged', {});
        }
      }
    },
    Step: {
      get: function () { return this._step; },
      set: function (v) {
        var val = parseInt(v, 10);
        if (!isNaN(val)) this._step = val;
      }
    },
    // Inside your ProgressBar property definitions block:
    Style: {
      get: function () {
        return this._progressStyle !== undefined ? this._progressStyle : ProgressBarStyle.Blocks;
      },
      set: function (v) {
        this._progressStyle = +v || 0;

        // Toggle CSS classes on the element for styling/animations
        this.element.classList.toggle('wf-progressbar-blocks', this._progressStyle === ProgressBarStyle.Blocks);
        this.element.classList.toggle('wf-progressbar-continuous', this._progressStyle === ProgressBarStyle.Continuous);
        this.element.classList.toggle('wf-progressbar-marquee', this._progressStyle === ProgressBarStyle.Marquee);

        if (typeof this._updateProgressStyle === 'function') {
          this._updateProgressStyle();
        }
      }
    }
  });

  root.ProgressBar = ProgressBar;
  if (typeof module !== 'undefined' && module.exports) module.exports = ProgressBar;
})(typeof window !== 'undefined' ? window : this);