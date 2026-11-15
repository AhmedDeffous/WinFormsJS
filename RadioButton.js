/*!
 * RadioButton.js - WinForms RadioButton component. Needs Control.js and Theme.js.
 *
 *   var rb = new RadioButton({ Text: "Option 1", Checked: true, GroupName: "group1" });
 *   rb.on('checkedChanged', function() { console.log(rb.Checked); });
 *   form.Controls.Add(rb);
 */
(function (root) {
    'use strict';
    var Control = root.Control;

    Control.InjectCss([
        '.wf-radio{display:inline-flex;align-items:center;cursor:default;font:12px "Segoe UI", Tahoma, sans-serif;user-select:none;gap:6px;box-sizing:border-box;color:var(--wf-text, #000)}',
        '.wf-radio-input{margin:0;accent-color:var(--wf-accent, #0078d7);cursor:pointer;width:13px;height:13px}',
        '.wf-radio.wf-disabled{color:var(--wf-text-off, #a0a0a0);cursor:default}',
        '.wf-radio.wf-disabled .wf-radio-input{cursor:default}'
    ].join(''));

    function RadioButton(opts) {
        Control.call(this, 'label', 'wf-radio');
        this._width = 100;
        this._height = 20;
        this._text = '';
        this._checked = false;
        this.Tag = null;
        this.Name = '';

        this._input = document.createElement('input');
        this._input.type = 'radio';
        this._input.className = 'wf-radio-input';
        this._input.name = 'wf-radio-group-' + Math.random().toString(36).substring(2, 9);

        this._textSpan = document.createElement('span');
        this._textSpan.className = 'wf-radio-text';

        this.element.appendChild(this._input);
        this.element.appendChild(this._textSpan);

        var self = this;
        this._input.addEventListener('change', function (e) {
            if (self._input.checked) {
                self._checked = true;
                self._raise('checkedChanged', e);
                self._raise('click', e);
            }
        });

        if (opts && opts.Theme) this.Theme = opts.Theme;
        this._applyRect();
        this._applyOptions(opts);
    }

    var P = Control.Extend(RadioButton);

    Object.defineProperty(P, 'Theme', {
        get: function () { return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
        set: function (v) {
            if (root.Theme && root.Theme.Apply) {
                root.Theme.Apply(v, this.element);
            }
        }
    });

    P._uncheckSiblings = function () {
        var parent = this.element.getRootNode ? this.element.getRootNode() : document;
        if (parent && this._input.name) {
            var radios = parent.querySelectorAll('input[type="radio"][name="' + this._input.name + '"]');
            radios.forEach(function (r) {
                if (r !== self._input && r.checked) {
                    r.checked = false;
                    var comp = r.closest('.wf-radio');
                    if (comp && comp.__wfControl) {
                        comp.__wfControl._checked = false;
                    }
                }
            });
        }
    };

    Object.defineProperties(P, {
        Text: {
            get: function () { return this._text; },
            set: function (v) {
                this._text = v == null ? '' : String(v);
                this._textSpan.textContent = this._text;
            }
        },
        Checked: {
            get: function () { return this._checked; },
            set: function (v) {
                var val = !!v;
                if (this._checked !== val) {
                    this._checked = val;
                    this._input.checked = val;
                    if (val) {
                        var parent = this.element.getRootNode ? this.element.getRootNode() : document;
                        if (parent && this._input.name) {
                            var radios = parent.querySelectorAll('input[type="radio"][name="' + this._input.name + '"]');
                            var selfInput = this._input;
                            radios.forEach(function (r) {
                                if (r !== selfInput && r.checked) {
                                    r.checked = false;
                                    var container = r.closest('.wf-radio');
                                    if (container && container.__wfControl) {
                                        container.__wfControl._checked = false;
                                    }
                                }
                            });
                        }
                    }
                    this._raise('checkedChanged', {});
                }
            }
        },
        GroupName: {
            get: function () { return this._input.name; },
            set: function (v) {
                if (v) this._input.name = String(v);
            }
        }
    });

    root.RadioButton = RadioButton;
    if (typeof module !== 'undefined' && module.exports) module.exports = RadioButton;
})(typeof window !== 'undefined' ? window : this);