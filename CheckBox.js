/*!
 * CheckBox.js - WinForms CheckBox component with Switch support. Needs Control.js and Theme.js.
 *
 *   var cb = new CheckBox({ Text: "Mode Sombre", IsSwitch: true, Checked: true });
 *   cb.on('checkedChanged', function() { console.log(cb.Checked); });
 *   form.Controls.Add(cb);
 */
(function (root) {
    'use strict';
    var Control = root.Control;

    Control.InjectCss([
        /* Style par défaut (Checkbox classique WinForms) */
        '.wf-checkbox{display:inline-flex;align-items:center;cursor:default;font:12px "Segoe UI", Tahoma, sans-serif;user-select:none;gap:6px;box-sizing:border-box;color:var(--wf-text, #000)}',
        '.wf-checkbox-input{margin:0;accent-color:var(--wf-accent, #0078d7);cursor:pointer;width:13px;height:13px}',

        /* Style alternatif (Apparence Switch / Bascule) */
        '.wf-checkbox.wf-is-switch{gap:8px}',
        '.wf-checkbox.wf-is-switch .wf-checkbox-input{-webkit-appearance:none;appearance:none;width:34px;height:18px;background:var(--wf-border, #7a7a7a);border-radius:9px;position:relative;outline:none;cursor:pointer;transition:background 0.2s;margin:0}',
        '.wf-checkbox.wf-is-switch .wf-checkbox-input::before{content:"";position:absolute;width:14px;height:14px;border-radius:50%;top:2px;left:2px;background:#fff;transition:transform 0.2s}',
        '.wf-checkbox.wf-is-switch .wf-checkbox-input:checked{background:var(--wf-accent, #0078d7)}',
        '.wf-checkbox.wf-is-switch .wf-checkbox-input:checked::before{transform:translateX(16px)}',

        /* États désactivés */
        '.wf-checkbox.wf-disabled{color:var(--wf-text-off, #a0a0a0);cursor:default}',
        '.wf-checkbox.wf-disabled .wf-checkbox-input{cursor:default;opacity:0.6}'
    ].join(''));

    function CheckBox(opts) {
        Control.call(this, 'label', 'wf-checkbox');
        this._width = 100;
        this._height = 20;
        this._text = '';
        this._checked = false;
        this._autoCheck = true;
        this._isSwitch = false;
        this.Tag = null;
        this.Name = '';

        this._input = document.createElement('input');
        this._input.type = 'checkbox';
        this._input.className = 'wf-checkbox-input';

        this._textSpan = document.createElement('span');
        this._textSpan.className = 'wf-checkbox-text';

        this.element.appendChild(this._input);
        this.element.appendChild(this._textSpan);

        var self = this;
        this._input.addEventListener('change', function (e) {
            if (self._autoCheck) {
                self._checked = self._input.checked;
            }
            self._raise('checkedChanged', e);
            self._raise('click', e);
        });

        if (opts && opts.Theme) this.Theme = opts.Theme;
        this._applyRect();
        this._applyOptions(opts);
    }

    var P = Control.Extend(CheckBox);

    Object.defineProperty(P, 'Theme', {
        get: function () { return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
        set: function (v) {
            if (root.Theme && root.Theme.Apply) {
                root.Theme.Apply(v, this.element);
            }
        }
    });

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
                    this._raise('checkedChanged', {});
                }
            }
        },
        AutoCheck: {
            get: function () { return this._autoCheck; },
            set: function (v) {
                this._autoCheck = !!v;
            }
        },
        // Supporte "IsSwitch" ainsi que l'alias "IsSwitsh" par sécurité orthographique
        IsSwitch: {
            get: function () { return this._isSwitch; },
            set: function (v) {
                this._isSwitch = !!v;
                this.element.classList.toggle('wf-is-switch', this._isSwitch);
            }
        },
        IsSwitsh: {
            get: function () { return this._isSwitch; },
            set: function (v) {
                this.IsSwitch = v;
            }
        }
    });

    root.CheckBox = CheckBox;
    if (typeof module !== 'undefined' && module.exports) module.exports = CheckBox;
})(typeof window !== 'undefined' ? window : this);