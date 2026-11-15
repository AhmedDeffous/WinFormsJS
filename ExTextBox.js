/*!
 * ExTextBox.js - WinForms ExTextBox (single line or Multiline) with CharacterCasing, Hint, Numeric/Integer validation & Min/Max bounds. Needs Control.js.
 *   var tb = new ExTextBox({ Name: 'txtNom', Left: 10, Top: 10, Width: 200, Text: 'abc', MaxLength: 30, CharacterCasing: CharacterCasing.Upper });
 *   tb.on('TextChanged', function (sender, e) { console.log(sender.Text); });
 *
 * Properties: Text, Multiline, ReadOnly, MaxLength, PasswordChar (any non-empty value = hidden text),
 *   UseSystemPasswordChar, TextAlign ('Left'|'Center'|'Right'), CharacterCasing (Supports enum, number, or string 'Normal'|'Upper'|'Lower'),
 *   WordWrap, ScrollBars ('None'|'Vertical'|'Horizontal'|'Both'), PlaceholderText, Hint, HintTextColor, Lines,
 *   SelectionStart, SelectionLength, SelectedText, TextLength,
 *   IsNumeric, IsInteger, MinValue, MaxValue, IsValid, Value, ErrorBackColor, ErrorForeColor
 * Methods: Clear(), SelectAll(), Select(start, length), AppendText(text), Focus()
 * Events: TextChanged, KeyDown, KeyUp, KeyPress, Enter, Leave, GotFocus, LostFocus, Click ...
 */
(function (root)
{
    'use strict';
    var Control = root.Control;
    if (!Control) throw new Error('ExTextBox.js needs Control.js to be loaded first');

    Control.InjectCss([
        '.wf-tb{display:flex;background:var(--tb-bg,var(--wf-field,#ffffff));color:var(--tb-fg,var(--wf-text,#000000));',
        'border:1px solid var(--tb-bc,var(--wf-border,#7a7a7a));overflow:hidden}',
        '.wf-tb:hover{border-color:var(--tb-hover-border,var(--wf-border-hover,#171717))}',
        '.wf-tb:focus-within{border-color:var(--tb-focus-border,var(--wf-accent,#0078d7))}',
        '.wf-tb-in{flex:1;min-width:0;width:100%;height:100%;margin:0;padding:1px 3px;border:0;outline:0;background:transparent;',
        'font:inherit;color:inherit;resize:none}',
        'textarea.wf-tb-in{padding:2px 3px;line-height:15px}',
        '.wf-tb.ro{background:var(--tb-ro-bg,var(--wf-surface,#f0f0f0))}',
        '.wf-tb.wf-disabled{background:var(--tb-off-bg,var(--wf-surface,#f0f0f0));border-color:var(--wf-border-disabled,#bfbfbf);color:var(--wf-text-off,#6d6d6d)}'
    ]);

    function ExTextBox(opts)
    {
        Control.call(this, 'div', 'wf-tb');
        this._width = 100; this._height = 21;
        this._in = null; this._multi = false;
        this._readonly = false; this._maxlen = 0; this._ph = ''; this._align = 'Left';

        // Initialisation du CharacterCasing (compatible avec enum.js, string ou number)
        var CC = root.CharacterCasing || { Normal: 0, Upper: 1, Lower: 2 };
        this._case = CC.Normal;

        // Propriétés de validation et bornes étendues
        this._isNumeric = false;
        this._isInteger = false;
        this._minValue = null;
        this._maxValue = null;
        this._errorBackColor = "#FFCCCC"; // Fond rouge clair par défaut en cas d'erreur
        this._errorForeColor = "#990000"; // Texte rouge foncé par défaut en cas d'erreur
        this._originBackColor = "";
        this._originForeColor = "";
        this._hintTextColor = "#808080";

        this._wrap = true; this._scroll = 'None'; this._pwd = false;
        this._makeInput(!!(opts && opts.Multiline));
        this._applyRect();
        this._applyOptions(opts);
    }
    var P = Control.Extend(ExTextBox);

    if (Control.ColorParts)
    {
        Control.ColorParts(ExTextBox, {
            BackColor: '--tb-bg',
            ForeColor: '--tb-fg',
            BorderColor: '--tb-bc'
        });
    }

    // (re)creates the inner <input> / <textarea>, keeping the current value and settings
    P._makeInput = function (multi)
    {
        var self = this, old = this._in, inp = document.createElement(multi ? 'textarea' : 'input');
        if (!multi) inp.type = this._pwd ? 'password' : 'text';
        inp.className = 'wf-tb-in';
        inp.spellcheck = false;
        inp.value = old ? old.value : '';
        inp.readOnly = this._readonly;
        inp.disabled = !this._enabled;
        inp.placeholder = this._ph;
        if (this._maxlen) inp.maxLength = this._maxlen;
        inp.style.textAlign = this._align.toLowerCase();

        if (old)
        {
            this._originBackColor = old.style.backgroundColor;
            this._originForeColor = old.style.color;
            this.element.replaceChild(inp, old);
        } else
        {
            this._originBackColor = inp.style.backgroundColor;
            this._originForeColor = inp.style.color;
            this.element.appendChild(inp);
        }

        this._in = inp;
        this._multi = multi;
        this._applyScroll();

        // Applique le casing initial si nécessaire lors de la création
        if (this._case !== (root.CharacterCasing ? root.CharacterCasing.Normal : 0))
        {
            this._applyCase();
        }

        // Filtrage des touches en temps réel (IsNumeric / IsInteger)
        inp.addEventListener('keypress', function (e)
        {
            self._onKeyPress(e);
        });

        inp.addEventListener('input', function ()
        {
            self._applyCase();
            self._validateState();
            self._raise('TextChanged');
        });

        inp.addEventListener('blur', function ()
        {
            self._validateState();
        });
    };

    P._applyCase = function ()
    {
        var inp = this._in, v = inp.value;
        var CC = root.CharacterCasing || { Normal: 0, Upper: 1, Lower: 2 };
        var c = this._case;

        var n = v;
        if (c === CC.Upper || c === 'Upper' || c === 1)
        {
            n = v.toUpperCase();
        } else if (c === CC.Lower || c === 'Lower' || c === 2)
        {
            n = v.toLowerCase();
        }

        if (n === v) return;
        var s = inp.selectionStart, e = inp.selectionEnd;
        inp.value = n;
        try { inp.setSelectionRange(s, e); } catch (x) { /* ignore */ }
    };

    P._applyScroll = function ()
    {
        if (!this._multi) return;
        var sb = this._scroll, st = this._in.style, wrap = this._wrap && sb !== 'Horizontal' && sb !== 'Both';
        st.overflowY = sb === 'Vertical' || sb === 'Both' ? 'auto' : 'hidden';
        st.overflowX = !wrap && (sb === 'Horizontal' || sb === 'Both') ? 'auto' : 'hidden';
        this._in.wrap = this._wrap && !/Horizontal|Both/.test(sb) ? 'soft' : 'off';
        st.whiteSpace = this._in.wrap === 'off' ? 'pre' : '';
    };

    // --- Filtrage Clavier pour IsNumeric et IsInteger ---
    P._onKeyPress = function (e)
    {
        if (this._isInteger || this._isNumeric)
        {
            var charCode = e.which ? e.which : e.keyCode;
            var charStr = String.fromCharCode(charCode);

            // Touches de contrôle autorisées (Backspace, Tab, Entrée, flèches)
            if (charCode === 8 || charCode === 9 || charCode === 13 || charCode === 37 || charCode === 39)
            {
                return;
            }

            // Chiffres 0-9 toujours autorisés
            if (/[0-9]/.test(charStr))
            {
                return;
            }

            // Signe moins (-) autorisé uniquement au tout début pour les entiers négatifs
            if (this._isInteger && charStr === '-' && this._in.selectionStart === 0 && this._in.value.indexOf('-') === -1)
            {
                return;
            }

            // Point ou virgule autorisé pour les nombres décimaux (un seul exemplaire)
            if (this._isNumeric && (charStr === '.' || charStr === ','))
            {
                if (this._in.value.indexOf('.') === -1 && this._in.value.indexOf(',') === -1)
                {
                    return;
                }
            }

            e.preventDefault();
        }
    };

    // --- Validation visuelle de l'état (Changement de couleur en cas d'erreur) ---
    P._validateState = function ()
    {
        if (!this._in) return;
        if (!this.IsValid)
        {
            this._in.style.backgroundColor = this._errorBackColor;
            this._in.style.color = this._errorForeColor;
        } else
        {
            this._in.style.backgroundColor = this._originBackColor;
            this._in.style.color = this._originForeColor;
        }
    };

    P._enabledChanged = function () { this._in.disabled = !this._enabled; };
    P._focusEl = function () { return this._in; };
    P._renderText = function () { };

    Object.defineProperties(P, {
        Text: {
            get: function () { return this._in.value; },
            set: function (v)
            {
                v = v == null ? '' : String(v);
                var CC = root.CharacterCasing || { Normal: 0, Upper: 1, Lower: 2 };
                var c = this._case;

                if (c === CC.Upper || c === 'Upper' || c === 1)
                {
                    v = v.toUpperCase();
                } else if (c === CC.Lower || c === 'Lower' || c === 2)
                {
                    v = v.toLowerCase();
                }

                if (this._in.value === v) return;
                this._in.value = v;
                this._applyCase();
                this._validateState();
                this._raise('TextChanged');
            }
        },
        Multiline: {
            get: function () { return this._multi; },
            set: function (v)
            {
                v = !!v;
                if (v === this._multi) return;
                this._makeInput(v);
                if (v && this._height < 40) { this._height = 60; this._relayout(); }
            }
        },
        ReadOnly: {
            get: function () { return this._readonly; },
            set: function (v) { this._readonly = !!v; this._in.readOnly = this._readonly; this.element.classList.toggle('ro', this._readonly); }
        },
        MaxLength: {
            get: function () { return this._maxlen; },
            set: function (v) { this._maxlen = Math.max(0, +v || 0); if (this._maxlen) this._in.maxLength = this._maxlen; else this._in.removeAttribute('maxlength'); }
        },
        PasswordChar: {
            get: function () { return this._pwdChar || ''; },
            set: function (v) { this._pwdChar = v ? String(v).charAt(0) : ''; this.UseSystemPasswordChar = !!v; }
        },
        UseSystemPasswordChar: {
            get: function () { return this._pwd; },
            set: function (v) { this._pwd = !!v; if (!this._multi) this._in.type = this._pwd ? 'password' : 'text'; }
        },
        TextAlign: {
            get: function () { return this._align; },
            set: function (v) { this._align = /right/i.test(v) ? 'Right' : /center/i.test(v) ? 'Center' : 'Left'; this._in.style.textAlign = this._align.toLowerCase(); }
        },
        CharacterCasing: {
            get: function () { return this._case; },
            set: function (v)
            {
                if (v !== undefined && v !== null)
                {
                    this._case = v;
                    this._applyCase();
                }
            }
        },
        WordWrap: { get: function () { return this._wrap; }, set: function (v) { this._wrap = !!v; this._applyScroll(); } },
        ScrollBars: {
            get: function () { return this._scroll; },
            set: function (v) { this._scroll = /both/i.test(v) ? 'Both' : /vert/i.test(v) ? 'Vertical' : /horiz/i.test(v) ? 'Horizontal' : 'None'; this._applyScroll(); }
        },
        PlaceholderText: {
            get: function () { return this._ph; },
            set: function (v) { this._ph = v || ''; this._in.placeholder = this._ph; }
        },
        // --- Propriété Hint (Alias direct de PlaceholderText pour compatibilité) ---
        Hint: {
            get: function () { return this._ph; },
            set: function (v) { this._ph = v || ''; this._in.placeholder = this._ph; }
        },
        HintTextColor: {
            get: function () { return this._hintTextColor; },
            set: function (v)
            {
                this._hintTextColor = v;
                if (this._in)
                {
                    if (!this._in.id)
                    {
                        this._in.id = 'tb_' + Math.random().toString(36).substr(2, 9);
                    }
                    var styleId = 'placeholder-style-' + this._in.id;
                    var existingStyle = document.getElementById(styleId);
                    if (existingStyle) existingStyle.remove();

                    var styleElem = document.createElement('style');
                    styleElem.id = styleId;
                    styleElem.innerHTML = `
                        #${this._in.id}::placeholder { color: ${v}; opacity: 1; }
                        #${this._in.id}::-webkit-input-placeholder { color: ${v}; }
                        #${this._in.id}::-moz-placeholder { color: ${v}; opacity: 1; }
                    `;
                    document.head.appendChild(styleElem);
                }
            }
        },
        // --- Propriétés de validation et de typage ---
        IsNumeric: {
            get: function () { return this._isNumeric; },
            set: function (v) { this._isNumeric = !!v; this._validateState(); }
        },
        IsInteger: {
            get: function () { return this._isInteger; },
            set: function (v) { this._isInteger = !!v; this._validateState(); }
        },
        MinValue: {
            get: function () { return this._minValue; },
            set: function (v) { this._minValue = (v !== null && v !== undefined) ? Number(v) : null; this._validateState(); }
        },
        MaxValue: {
            get: function () { return this._maxValue; },
            set: function (v) { this._maxValue = (v !== null && v !== undefined) ? Number(v) : null; this._validateState(); }
        },
        ErrorBackColor: {
            get: function () { return this._errorBackColor; },
            set: function (v) { this._errorBackColor = v; this._validateState(); }
        },
        ErrorForeColor: {
            get: function () { return this._errorForeColor; },
            set: function (v) { this._errorForeColor = v; this._validateState(); }
        },
        IsValid: {
            get: function ()
            {
                if (!this._in) return true;
                var raw = this._in.value;
                if (raw === "") return true; // Champ vide valide (gérer required à part si nécessaire)

                if (this._isInteger)
                {
                    if (!/^-?\d+$/.test(raw)) return false;
                    var valInt = parseInt(raw, 10);
                    if (this._minValue !== null && valInt < this._minValue) return false;
                    if (this._maxValue !== null && valInt > this._maxValue) return false;
                    return true;
                }

                if (this._isNumeric)
                {
                    var cleanRaw = raw.replace(',', '.');
                    if (isNaN(Number(cleanRaw))) return false;
                    var valNum = parseFloat(cleanRaw);
                    if (this._minValue !== null && valNum < this._minValue) return false;
                    if (this._maxValue !== null && valNum > this._maxValue) return false;
                    return true;
                }

                return true;
            }
        },
        Value: {
            get: function ()
            {
                if (!this._in || this._in.value === "")
                {
                    return this._isNumeric || this._isInteger ? 0 : "";
                }
                var raw = this._in.value;
                if (this._isInteger)
                {
                    var parsedInt = parseInt(raw, 10);
                    return isNaN(parsedInt) ? 0 : parsedInt;
                }
                if (this._isNumeric)
                {
                    var parsedFloat = parseFloat(raw.replace(',', '.'));
                    return isNaN(parsedFloat) ? 0.0 : parsedFloat;
                }
                return raw;
            },
            set: function (val)
            {
                if (this._in)
                {
                    this._in.value = (val !== null && val !== undefined) ? val.toString() : "";
                    this._applyCase();
                    this._validateState();
                    this._raise('TextChanged');
                }
            }
        },
        Lines: {
            get: function () { return this._in.value.split(/\r?\n/); },
            set: function (a) { this.Text = (a || []).join('\n'); }
        },
        TextLength: { get: function () { return this._in.value.length; } },
        SelectionStart: { get: function () { return this._in.selectionStart; }, set: function (v) { this._in.selectionStart = +v || 0; } },
        SelectionLength: {
            get: function () { return this._in.selectionEnd - this._in.selectionStart; },
            set: function (v) { this._in.selectionEnd = this._in.selectionStart + (+v || 0); }
        },
        SelectedText: {
            get: function () { return this._in.value.substring(this._in.selectionStart, this._in.selectionEnd); },
            set: function (v)
            {
                var i = this._in, s = i.selectionStart;
                var newVal = i.value.slice(0, s) + v + i.value.slice(i.selectionEnd);

                // Applique les règles de casse si configuré
                var CC = root.CharacterCasing || { Normal: 0, Upper: 1, Lower: 2 };
                if (this._case === CC.Upper || this._case === 'Upper' || this._case === 1) newVal = newVal.toUpperCase();
                else if (this._case === CC.Lower || this._case === 'Lower' || this._case === 2) newVal = newVal.toLowerCase();

                i.value = newVal;
                i.setSelectionRange(s + String(v).length, s + String(v).length);
                this._applyCase();
                this._validateState();
                this._raise('TextChanged');
            }
        }
    });

    P.Clear = function () { this.Text = ''; };
    P.SelectAll = function () { this._in.select(); };
    P.Select = function (start, length) { this._in.focus(); this._in.setSelectionRange(start || 0, (start || 0) + (length || 0)); };
    P.AppendText = function (t) { this.Text = this._in.value + t; };

    root.ExTextBox = ExTextBox;
    if (typeof module !== 'undefined' && module.exports) module.exports = ExTextBox;
})(typeof window !== 'undefined' ? window : this);