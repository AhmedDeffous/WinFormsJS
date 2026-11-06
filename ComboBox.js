/*!
 * ComboBox.js - WinForms ComboBox. Needs Control.js.
 *
 *   var cb = new ComboBox({ Left: 10, Top: 10, Width: 180, DropDownStyle: 'DropDownList',
 *                           DisplayMember: 'Nom', ValueMember: 'Id',
 *                           DataSource: [{ Id: 1, Nom: 'Alger' }, { Id: 2, Nom: 'Oran' }] });
 *   cb.on('SelectedIndexChanged', function () { console.log(cb.SelectedValue, cb.Text); });
 *   cb.SelectedValue = 2;
 *
 * Items          : Items.Add(x) / AddRange([..]) / Insert(i, x) / Remove(x) / RemoveAt(i) / Clear() / Contains(x) /
 *                  Count, and cb.Items[i]. Items can be strings or objects.
 * Data binding   : DataSource (array; selects the first item like WinForms), DisplayMember (property name or
 *                  function), ValueMember (property name)
 * Selection      : SelectedIndex, SelectedItem, SelectedValue, Text (-1 / null = nothing selected)
 * Other          : DropDownStyle ('DropDown' editable | 'DropDownList' | 'Simple' = DropDown), Sorted, MaxDropDownItems (8),
 *                  DropDownWidth, DroppedDown, FindString(text), FindStringExact(text), SelectAll()
 * Events         : SelectedIndexChanged, SelectedValueChanged, SelectionChangeCommitted (user only), TextChanged,
 *                  DropDown, DropDownClosed
 * Keys           : F4 / Alt+Down open the list, Up/Down change the selection, Enter / Esc, type a letter to jump.
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  if (!Control) throw new Error('ComboBox.js needs Control.js to be loaded first');
  var ITEM_H = 15;
 
  Control.InjectCss([
    '.wf-cb{display:flex;background:var(--cb-bg,var(--wf-field,#ffffff));color:var(--cb-fg,var(--wf-text,#000000));',
    'border:1px solid var(--cb-bc,var(--wf-border,#7a7a7a))}',
    '.wf-cb:hover,.wf-cb:focus-within{border-color:var(--cb-hover-border,var(--wf-border-hover,#0078d7))}',
    '.wf-cb-in{flex:1;min-width:0;height:100%;margin:0;padding:0 3px;border:0;outline:0;background:transparent;font:inherit;color:inherit}',
    '.wf-cb-btn{flex:none;width:17px;display:flex;align-items:center;justify-content:center;',
    'background:var(--cb-btn-bg,var(--wf-button,#e5e5e5));border-inline-start:1px solid var(--cb-btn-bc,var(--wf-button-border,#e5e5e5))}',
    '.wf-cb:hover .wf-cb-btn{background:var(--cb-btn-hover,var(--wf-hover,#e5f1fb))}',
    '.wf-cb.list .wf-cb-in{cursor:default;user-select:none}',
    '.wf-cb.list:focus-within .wf-cb-in{background:var(--cb-sel-bg,var(--wf-accent,#0078d7));color:var(--cb-sel-fg,var(--wf-accent-text,#fff))}',
    '.wf-cb.wf-disabled{background:var(--cb-off-bg,var(--wf-surface,#f0f0f0));border-color:var(--wf-border-disabled,#bfbfbf);color:var(--wf-text-off,#6d6d6d)}',
    '.wf-cb-pop{position:fixed;z-index:100000;overflow-y:auto;',
    'background:var(--cb-pop-bg,var(--wf-field,#ffffff));color:var(--cb-pop-fg,var(--wf-text,#000000));',
    'border:1px solid var(--cb-pop-bc,var(--wf-border-strong,#646464));cursor:default;user-select:none}',
    '.wf-cb-i{height:' + ITEM_H + 'px;line-height:' + ITEM_H + 'px;padding:0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.wf-cb-i.hl{background:var(--cb-hl-bg,var(--wf-accent,#0078d7));color:var(--cb-hl-fg,var(--wf-accent-text,#fff))}'
  ]);
 
Control.InjectCss([
  /* Conteneur principal de la ComboBox */
  '.wf-cb { position: relative; display: inline-flex; align-items: center; background: var(--wf-field, #fff); border: 1px solid var(--wf-border, #7a7a7a); box-sizing: border-box; }',
  
  /* Champ de texte interne */
  '.wf-cb input { flex: 1; border: none; outline: none; background: transparent; padding: 0 4px; font: inherit; color: inherit; height: 100%; box-sizing: border-box; }',
  
  /* Bouton déroulant (la petite flèche) positionné à droite à l'intérieur du contrôle */
  '.wf-cb .wf-cb-btn { position: absolute; right: 0; top: 0; width: 18px; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--wf-button, #e5e5e5); border-left: 1px solid var(--wf-border, #7a7a7a); cursor: default; user-select: none; }',
  '.wf-cb .wf-cb-btn:hover { background: var(--wf-hover, #e5f1fb); }',
  
  /* Le panneau de la liste déroulante (Popup) qui s'affiche sous la ComboBox */
  '.wf-cb-drop { position: fixed; z-index: 100002; background: var(--wf-field, #fff); border: 1px solid var(--wf-border, #7a7a7a); box-shadow: 2px 2px 5px var(--wf-shadow, rgba(0,0,0,0.2)); max-height: 150px; overflow-y: auto; box-sizing: border-box; }',
  '.wf-cb-item { padding: 3px 6px; cursor: default; white-space: nowrap; }',
  '.wf-cb-item:hover, .wf-cb-item.hl { background: var(--wf-accent, #0078d7); color: var(--wf-accent-text, #fff); }'
].join(''));
  var ARROW = '<svg width="7" height="4" viewBox="0 0 7 4"><path d="M0 0h7L3.5 4z" fill="currentColor"/></svg>';

  function ComboBox(opts) {
    Control.call(this, 'div', 'wf-cb');
    this._width = 121; this._height = 21;
    this._items = [];
    this._sel = -1; this._style = 'DropDown';
    this._dm = ''; this._vm = ''; this._ds = null;
    this._sorted = false; this._maxItems = 8; this._ddw = 0;
    this._pop = null; this._hl = -1; this._typed = ''; this._typedAt = 0;

    var self = this;
    this._in = document.createElement('input');
    this._in.className = 'wf-cb-in';
    this._in.type = 'text';
    this._in.spellcheck = false;
    this._btn = document.createElement('div');
    this._btn.className = 'wf-cb-btn';
    this._btn.innerHTML = ARROW;
    this.element.appendChild(this._in);
    this.element.appendChild(this._btn);

    this._mkItems();
    this._bind();
    this._applyRect();
    this._applyOptions(opts);
  }
  var P = Control.Extend(ComboBox);

  if (Control.ColorParts) {
    Control.ColorParts(ComboBox, {
      BackColor: '--cb-bg',
      ForeColor: '--cb-fg',
      BorderColor: '--cb-bc'
    });
  }

  // ---------------------------------------------------------------- items collection (an Array with WinForms methods)
  P._mkItems = function () {
    var self = this, list = this._items;
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    var changed = function (fn) {
      var cur = self._sel >= 0 ? list[self._sel] : undefined, had = self._sel >= 0;
      fn();
      if (self._sorted) self._sort();
      self._sel = had ? list.indexOf(cur) : -1;
      if (had && self._sel < 0) self._in.value = '';
      self._refreshText();
    };
    list.Add = function (x) { changed(function () { list.push(x); }); return list.length - 1; };
    list.AddRange = function (a) { changed(function () { Array.prototype.push.apply(list, a); }); };
    list.Insert = function (i, x) { changed(function () { list.splice(i, 0, x); }); };
    list.Remove = function (x) { var i = list.indexOf(x); if (i >= 0) changed(function () { list.splice(i, 1); }); };
    list.RemoveAt = function (i) { if (i >= 0 && i < list.length) changed(function () { list.splice(i, 1); }); };
    list.Clear = function () { changed(function () { list.length = 0; }); };
    list.Contains = function (x) { return list.indexOf(x) >= 0; };
  };

  P._txt = function (it) {
    if (it == null) return '';
    var dm = this._dm, v = typeof dm === 'function' ? dm(it) : dm ? it[dm] : it;
    return v == null ? '' : String(v);
  };
  P._val = function (it) { return this._vm && it != null ? it[this._vm] : it; };

  P._sort = function () {
    var self = this, cur = this._sel >= 0 ? this._items[this._sel] : undefined;
    this._items.sort(function (a, b) { return self._txt(a).localeCompare(self._txt(b)); });
    this._sel = cur === undefined ? -1 : this._items.indexOf(cur);
  };

  P._refreshText = function () {
    if (this._sel >= 0) this._in.value = this._txt(this._items[this._sel]);
  };

  // ---------------------------------------------------------------- selection
  P._select = function (i, user) {
    if (i < 0 || i >= this._items.length) i = -1;
    var changed = i !== this._sel, before = this._in.value;
    this._sel = i;
    this._in.value = i >= 0 ? this._txt(this._items[i]) : '';
    if (this._in.value !== before) this._raise('TextChanged');
    if (changed) { this._raise('SelectedIndexChanged'); this._raise('SelectedValueChanged'); }
    if (user) this._raise('SelectionChangeCommitted');
  };

  P._enabledChanged = function () { this._in.disabled = !this._enabled; if (!this._enabled) this._close(); };
  P._focusEl = function () { return this._in; };

  // ---------------------------------------------------------------- drop-down list
  P._open = function () {
    if (this._pop || !this._items.length || !this._enabled) return;
    var self = this, el = this.element, r = el.getBoundingClientRect(), n = this._items.length;
    var pop = document.createElement('div');
    pop.className = 'wf wf-cb-pop';
    
    // Héritage éventuel du thème de la page ou du conteneur parent
    if (root.Theme && typeof root.Theme.Inherit === 'function') {
      root.Theme.Inherit(el, pop);
    }

    var h = [];
    for (var i = 0; i < n; i++) h.push('<div class="wf-cb-i" data-i="' + i + '">' + Control.Esc(this._txt(this._items[i])) + '</div>');
    pop.innerHTML = h.join('');
    var rows = Math.min(n, this._maxItems), ph = rows * ITEM_H + 2;
    pop.style.width = Math.max(r.width, this._ddw) + 'px';
    pop.style.maxHeight = ph + 'px';
    pop.style.left = r.left + 'px';
    pop.style.top = (r.bottom + ph > window.innerHeight && r.top - ph > 0 ? r.top - ph + 1 : r.bottom - 1) + 'px';
    document.body.appendChild(pop);
    this._pop = pop;
    this._setHl(this._sel >= 0 ? this._sel : 0, true);

    pop.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('.wf-cb-i') : null;
      if (t) self._setHl(+t.getAttribute('data-i'), false);
    });
    pop.addEventListener('mousedown', function (e) {
      e.preventDefault();                                   // keep the focus in the box
      var t = e.target.closest ? e.target.closest('.wf-cb-i') : null;
      if (!t) return;
      self._select(+t.getAttribute('data-i'), true);
      self._close();
    });
    this._onDoc = function (e) { if (!pop.contains(e.target) && !el.contains(e.target)) self._close(); };
    document.addEventListener('mousedown', this._onDoc, true);
    window.addEventListener('blur', this._onWin = function () { self._close(); });
    this._raise('DropDown');
  };

  P._close = function () {
    if (!this._pop) return;
    this._pop.parentNode && this._pop.parentNode.removeChild(this._pop);
    this._pop = null;
    document.removeEventListener('mousedown', this._onDoc, true);
    window.removeEventListener('blur', this._onWin);
    this._raise('DropDownClosed');
  };

  P._setHl = function (i, scroll) {
    var pop = this._pop;
    if (!pop) return;
    i = Math.max(0, Math.min(this._items.length - 1, i));
    var kids = pop.children;
    if (this._hl >= 0 && kids[this._hl]) kids[this._hl].classList.remove('hl');
    this._hl = i;
    if (kids[i]) kids[i].classList.add('hl');
    if (scroll) {
      var top = i * ITEM_H;
      if (top < pop.scrollTop) pop.scrollTop = top;
      else if (top + ITEM_H > pop.scrollTop + pop.clientHeight) pop.scrollTop = top + ITEM_H - pop.clientHeight;
    }
  };

  // ---------------------------------------------------------------- keyboard / mouse
  P._bind = function () {
    var self = this, inp = this._in;

    this._btn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      inp.focus();
      if (self._pop) self._close(); else self._open();
    });
    this.element.addEventListener('mousedown', function (e) {           // DropDownList: the whole box opens the list
      if (self._style !== 'DropDownList' || e.target === self._btn || self._btn.contains(e.target)) return;
      if (self._pop) self._close(); else self._open();
    });

    inp.addEventListener('input', function () {                         // editable: follow exact matches
      var i = self.FindStringExact(inp.value);
      self._sel = i;
      self._raise('TextChanged');
    });

    inp.addEventListener('keydown', function (e) {
      var k = e.key, n = self._items.length;
      if (k === 'F4' || (e.altKey && k === 'ArrowDown')) { e.preventDefault(); if (self._pop) self._close(); else self._open(); return; }
      if (k === 'Escape') { self._close(); return; }
      if (k === 'Enter') {
        if (self._pop) { e.preventDefault(); self._select(self._hl, true); self._close(); }
        return;
      }
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        var d = k === 'ArrowDown' ? 1 : -1;
        if (self._pop) self._setHl(self._hl + d, true);
        else if (n) self._select(Math.max(0, Math.min(n - 1, self._sel + d)), true);
        return;
      }
      if (self._style === 'DropDownList' && k.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {   // type-ahead
        var now = Date.now();
        self._typed = now - self._typedAt > 700 ? k : self._typed + k;
        self._typedAt = now;
        var start = self._typed.length === 1 ? self._sel + 1 : self._sel, found = -1;
        for (var j = 0; j < n && found < 0; j++) {
          var idx = (start + j) % n;
          if (self._txt(self._items[idx]).toLowerCase().indexOf(self._typed.toLowerCase()) === 0) found = idx;
        }
        if (found >= 0) { e.preventDefault(); if (self._pop) self._setHl(found, true); else self._select(found, true); }
      }
    });
  };

  // ---------------------------------------------------------------- properties
  Object.defineProperties(P, {
    Items: { get: function () { return this._items; } },
    DataSource: {
      get: function () { return this._ds; },
      set: function (v) {
        this._ds = v || null;
        this._items.length = 0;
        if (v) Array.prototype.push.apply(this._items, v);
        if (this._sorted) this._sort();
        this._sel = -1;
        this._in.value = '';
        this._select(this._items.length ? 0 : -1, false);          // WinForms selects the first item when binding
      }
    },
    DisplayMember: {
      get: function () { return this._dm; },
      set: function (v) { this._dm = v || ''; this._refreshText(); }
    },
    ValueMember: { get: function () { return this._vm; }, set: function (v) { this._vm = v || ''; } },
    SelectedIndex: { get: function () { return this._sel; }, set: function (v) { this._select(+v, false); } },
    SelectedItem: {
      get: function () { return this._sel >= 0 ? this._items[this._sel] : null; },
      set: function (v) { this._select(this._items.indexOf(v), false); }
    },
    SelectedValue: {
      get: function () { return this._sel >= 0 ? this._val(this._items[this._sel]) : null; },
      set: function (v) {
        var found = -1;
        for (var i = 0; i < this._items.length && found < 0; i++) {
          var x = this._val(this._items[i]);
          if (x === v || (x != null && v != null && String(x) === String(v))) found = i;
        }
        this._select(found, false);
      }
    },
    Text: {
      get: function () { return this._in.value; },
      set: function (v) {
        v = v == null ? '' : String(v);
        var i = this.FindStringExact(v);
        if (this._style === 'DropDownList') { this._select(i, false); return; }
        if (this._in.value !== v) { this._in.value = v; this._raise('TextChanged'); }
        this._sel = i;
      }
    },
    DropDownStyle: {
      get: function () { return this._style; },
      set: function (v) {
        this._style = /list/i.test(v) ? 'DropDownList' : 'DropDown';
        this._in.readOnly = this._style === 'DropDownList';
        this.element.classList.toggle('list', this._style === 'DropDownList');
      }
    },
    Sorted: { get: function () { return this._sorted; }, set: function (v) { this._sorted = !!v; if (this._sorted) this._sort(); } },
    MaxDropDownItems: { get: function () { return this._maxItems; }, set: function (v) { this._maxItems = Math.max(1, +v || 8); } },
    DropDownWidth: { get: function () { return this._ddw || this.Width; }, set: function (v) { this._ddw = +v || 0; } },
    DroppedDown: {
      get: function () { return !!this._pop; },
      set: function (v) { if (v) this._open(); else this._close(); }
    }
  });

  P.FindString = function (s, start) {
    s = String(s).toLowerCase();
    for (var i = (start == null ? -1 : start) + 1; i < this._items.length; i++) {
      if (this._txt(this._items[i]).toLowerCase().indexOf(s) === 0) return i;
    }
    return -1;
  };
  P.FindStringExact = function (s) {
    s = String(s).toLowerCase();
    for (var i = 0; i < this._items.length; i++) if (this._txt(this._items[i]).toLowerCase() === s) return i;
    return -1;
  };
  P.SelectAll = function () { this._in.select(); };
  P.Dispose = function () { this._close(); Control.prototype.Dispose.call(this); };

  root.ComboBox = ComboBox;
  if (typeof module !== 'undefined' && module.exports) module.exports = ComboBox;
})(typeof window !== 'undefined' ? window : this);