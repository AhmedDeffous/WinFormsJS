/*!
 * TextBox.js - WinForms TextBox (single line or Multiline). Needs Control.js.
 *   var tb = new TextBox({ Name: 'txtNom', Left: 10, Top: 10, Width: 200, Text: 'abc', MaxLength: 30 });
 *   tb.on('TextChanged', function (sender, e) { console.log(sender.Text); });
 *
 * Properties: Text, Multiline, ReadOnly, MaxLength, PasswordChar (any non-empty value = hidden text),
 *   UseSystemPasswordChar, TextAlign ('Left'|'Center'|'Right'), CharacterCasing ('Normal'|'Upper'|'Lower'),
 *   WordWrap, ScrollBars ('None'|'Vertical'|'Horizontal'|'Both'), PlaceholderText, Lines,
 *   SelectionStart, SelectionLength, SelectedText, TextLength
 * Methods: Clear(), SelectAll(), Select(start, length), AppendText(text), Focus()
 * Events: TextChanged, KeyDown, KeyUp, KeyPress, Enter, Leave, GotFocus, LostFocus, Click ...
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('TextBox.js needs Control.js to be loaded first');

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

  function TextBox(opts) {
    Control.call(this, 'div', 'wf-tb');
    this._width = 100; this._height = 21;
    this._in = null; this._multi = false;
    this._readonly = false; this._maxlen = 0; this._ph = ''; this._align = 'Left'; this._case = 'Normal';
    this._wrap = true; this._scroll = 'None'; this._pwd = false;
    this._makeInput(!!(opts && opts.Multiline));
    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(TextBox);

  if (Control.ColorParts) {
    Control.ColorParts(TextBox, {
      BackColor: '--tb-bg',
      ForeColor: '--tb-fg',
      BorderColor: '--tb-bc'
    });
  }

  // (re)creates the inner <input> / <textarea>, keeping the current value and settings
  P._makeInput = function (multi) {
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
    if (old) this.element.replaceChild(inp, old); else this.element.appendChild(inp);
    this._in = inp;
    this._multi = multi;
    this._applyScroll();
    inp.addEventListener('input', function () {
      self._applyCase();
      self._raise('TextChanged');
    });
  };

  P._applyCase = function () {
    var inp = this._in, v = inp.value, n = this._case === 'Upper' ? v.toUpperCase() : this._case === 'Lower' ? v.toLowerCase() : v;
    if (n === v) return;
    var s = inp.selectionStart, e = inp.selectionEnd;
    inp.value = n;
    try { inp.setSelectionRange(s, e); } catch (x) { /* ignore */ }
  };

  P._applyScroll = function () {
    if (!this._multi) return;
    var sb = this._scroll, st = this._in.style, wrap = this._wrap && sb !== 'Horizontal' && sb !== 'Both';
    st.overflowY = sb === 'Vertical' || sb === 'Both' ? 'auto' : 'hidden';
    st.overflowX = !wrap && (sb === 'Horizontal' || sb === 'Both') ? 'auto' : 'hidden';
    this._in.wrap = this._wrap && !/Horizontal|Both/.test(sb) ? 'soft' : 'off';
    st.whiteSpace = this._in.wrap === 'off' ? 'pre' : '';
  };

  P._enabledChanged = function () { this._in.disabled = !this._enabled; };
  P._focusEl = function () { return this._in; };
  P._renderText = function () { };

  Object.defineProperties(P, {
    Text: {
      get: function () { return this._in.value; },
      set: function (v) {
        v = v == null ? '' : String(v);
        if (this._in.value === v) return;
        this._in.value = v;
        this._applyCase();
        this._raise('TextChanged');
      }
    },
    Multiline: {
      get: function () { return this._multi; },
      set: function (v) {
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
      set: function (v) { this._case = /upper/i.test(v) ? 'Upper' : /lower/i.test(v) ? 'Lower' : 'Normal'; this._applyCase(); }
    },
    WordWrap: { get: function () { return this._wrap; }, set: function (v) { this._wrap = !!v; this._applyScroll(); } },
    ScrollBars: {
      get: function () { return this._scroll; },
      set: function (v) { this._scroll = /both/i.test(v) ? 'Both' : /vert/i.test(v) ? 'Vertical' : /horiz/i.test(v) ? 'Horizontal' : 'None'; this._applyScroll(); }
    },
    PlaceholderText: { get: function () { return this._ph; }, set: function (v) { this._ph = v || ''; this._in.placeholder = this._ph; } },
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
      set: function (v) {
        var i = this._in, s = i.selectionStart;
        i.value = i.value.slice(0, s) + v + i.value.slice(i.selectionEnd);
        i.setSelectionRange(s + String(v).length, s + String(v).length);
        this._applyCase();
        this._raise('TextChanged');
      }
    }
  });

  P.Clear = function () { this.Text = ''; };
  P.SelectAll = function () { this._in.select(); };
  P.Select = function (start, length) { this._in.focus(); this._in.setSelectionRange(start || 0, (start || 0) + (length || 0)); };
  P.AppendText = function (t) { this.Text = this._in.value + t; };

  root.TextBox = TextBox;
  if (typeof module !== 'undefined' && module.exports) module.exports = TextBox;
})(typeof window !== 'undefined' ? window : this);