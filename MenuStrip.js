/*!
 * MenuStrip.js - 
*WinForms MenuStrip + 
*ToolStripMenuItem +
* ToolStripSeparator, and the drop-down engine shared
 * with ContextMenuStrip.js. Needs Control.js and Theme.js.
 */
(function (root) {
  'use strict';
  var Control = root.Control, Events = Control.Events, esc = Control.Esc;

  Control.InjectCss([
    '.wf-ms{display:flex;align-items:center;height:24px;padding:0 2px;',
    'background:linear-gradient(var(--wf-bar-top, #fafbfd), var(--wf-bar-bottom, #e6ebf3));',
    'border-bottom:1px solid var(--wf-bar-border, #c5ccd6);color:var(--wf-text, #000);user-select:none}',
    '.wf-msi{display:flex;align-items:center;flex:none;height:22px;padding:0 7px;white-space:nowrap;border:1px solid transparent;',
    'border-radius:2px;cursor:default;color:inherit}',
    '.wf-msi:hover{background:var(--wf-hover, #e5f1fb);border-color:var(--wf-hover-border, #7eb4ea)}',
    '.wf-msi.open{background:var(--wf-press, #cce4f7);border-color:var(--wf-press-border, #569de5)}',
    '.wf-msi.dis{color:var(--wf-text-off, #a0a0a0)}',
    '.wf-msi img{width:16px;height:16px;margin-inline-end:4px}',
    '.wf-msi .g{margin-inline-end:4px}',
    '.wf-msep{flex:none;width:1px;height:16px;margin:0 3px;background:var(--wf-sep, #c2c9d3)}',
    '.wf-dd{position:fixed;z-index:100001;min-width:160px;padding:2px;',
    'background:var(--wf-popup, #f2f2f2);border:1px solid var(--wf-popup-border, #ccc);',
    'color:var(--wf-text, #000);box-shadow:2px 2px 4px var(--wf-shadow, rgba(0,0,0,.25));user-select:none;cursor:default}',
    '.wf-mi{display:flex;align-items:center;height:22px;padding:0 4px;white-space:nowrap}',
    '.wf-mi.hl{background:var(--wf-menu-hl, #91c9f7)}',
    '.wf-mi.dis{color:var(--wf-text-off, #a0a0a0)}',
    '.wf-mi .ic{flex:none;display:flex;align-items:center;justify-content:center;width:22px;height:18px;margin-inline-end:6px;',
    'border:1px solid transparent}',
    '.wf-mi .ic.on{border-color:var(--wf-hover-border, #7eb4ea);background:var(--wf-press, #cce4f7)}',
    '.wf-mi .ic img{width:16px;height:16px}',
    '.wf-mi .tx{flex:1;padding-inline-end:24px}',
    '.wf-mi .sc{padding-inline-start:20px;color:var(--wf-text-dim, #6d6d6d)}',
    '.wf-mi .ar{width:14px;margin-inline-start:4px;text-align:center;font-size:8px}',
    '.wf-sep{height:1px;margin:3px 2px 3px 30px;background:var(--wf-sep, #d7d7d7)}'
  ].join(''));

  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

  function iconInner(img) {
    if (!img) return '';
    return IMG_RE.test(img) ? '<img src="' + esc(img) + '" alt="">' : '<span class="g">' + esc(img) + '</span>';
  }

  // ---------------------------------------------------------------- items
  function ToolStripSeparator() {
    this.IsSeparator = true;
    this._visible = true;
    this._parentItem = null;
    this._strip = null;
  }
  Object.defineProperty(ToolStripSeparator.prototype, 'Visible', {
    get: function () { return this._visible; }, set: function (v) { this._visible = !!v; }
  });

  function ToolStripMenuItem(text, image, onClick, shortcut) {
    var opts = null;
    if (text && typeof text === 'object') { opts = text; text = ''; }
    this.IsSeparator = false;
    this._text = text == null ? '' : String(text);
    this._image = image || null;
    this._checked = false; this._checkOnClick = false;
    this._enabled = true; this._visible = true;
    this._shortcut = shortcut || ''; this._showShortcut = true;
    this._tip = ''; this._name = '';
    this._parentItem = null; this._strip = null;
    this.Tag = null;
    this.DropDownItems = createItems(this);
    if (typeof onClick === 'function') this.on('Click', onClick);
    if (opts) {
      for (var k in opts) {
        if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
        if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
      }
    }
  }
  Events(ToolStripMenuItem.prototype);
  var IP = ToolStripMenuItem.prototype;

  IP._changed = function () {
    var t = this;
    while (t._parentItem) t = t._parentItem;
    if (t._strip && t._strip._renderBar) t._strip._renderBar();
  };
  IP._rootStrip = function () {
    var t = this;
    while (t._parentItem) t = t._parentItem;
    return t._strip;
  };
  IP._itemsChanged = function () { this._changed(); };

  IP.PerformClick = function () {
    if (!this._enabled) return;
    if (this._checkOnClick) this.Checked = !this._checked;
    this._raise('Click');
    var s = this._rootStrip();
    if (s && s._raise) s._raise('ItemClicked', { ClickedItem: this });
  };

  Object.defineProperties(IP, {
    Text: { get: function () { return this._text; }, set: function (v) { this._text = v == null ? '' : String(v); this._changed(); } },
    Image: { get: function () { return this._image; }, set: function (v) { this._image = v || null; this._changed(); } },
    Icon: { get: function () { return this._image; }, set: function (v) { this._image = v || null; this._changed(); } },
    Checked: {
      get: function () { return this._checked; },
      set: function (v) {
        v = !!v;
        if (v === this._checked) return;
        this._checked = v;
        this._raise('CheckedChanged');
        this._changed();
      }
    },
    CheckOnClick: { get: function () { return this._checkOnClick; }, set: function (v) { this._checkOnClick = !!v; } },
    Enabled: { get: function () { return this._enabled; }, set: function (v) { this._enabled = !!v; this._changed(); } },
    Visible: { get: function () { return this._visible; }, set: function (v) { this._visible = !!v; this._changed(); } },
    ShortcutKeys: { get: function () { return this._shortcut; }, set: function (v) { this._shortcut = v || ''; this._changed(); } },
    ShowShortcutKeys: { get: function () { return this._showShortcut; }, set: function (v) { this._showShortcut = !!v; } },
    ToolTipText: { get: function () { return this._tip; }, set: function (v) { this._tip = v || ''; this._changed(); } },
    Name: { get: function () { return this._name; }, set: function (v) { this._name = String(v); } },
    HasDropDownItems: { get: function () { return this.DropDownItems.length > 0; } }
  });

  // ---------------------------------------------------------------- Items collection
  function createItems(owner) {
    var list = [];
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    var adopt = function (it) {
      if (owner instanceof ToolStripMenuItem) it._parentItem = owner; else it._strip = owner;
      return it;
    };
    var changed = function () { if (owner._itemsChanged) owner._itemsChanged(); };
    var make = function (a, b, c, d) {
      if (a && typeof a === 'object' && (a instanceof ToolStripMenuItem || a instanceof ToolStripSeparator)) return a;
      if (a === '-') return new ToolStripSeparator();
      return new ToolStripMenuItem(a, b, c, d);
    };
    list.Add = function (a, b, c, d) { var it = adopt(make(a, b, c, d)); list.push(it); changed(); return it; };
    list.AddRange = function (arr) { arr.forEach(function (x) { list.push(adopt(make(x))); }); changed(); };
    list.Insert = function (i, a, b, c, d) { var it = adopt(make(a, b, c, d)); list.splice(i, 0, it); changed(); return it; };
    list.Remove = function (it) { var i = list.indexOf(it); if (i >= 0) { list.splice(i, 1); it._parentItem = null; it._strip = null; changed(); } };
    list.RemoveAt = function (i) { if (list[i]) list.Remove(list[i]); };
    list.Clear = function () { list.splice(0, list.length); changed(); };
    list.Contains = function (it) { return list.indexOf(it) >= 0; };
    return list;
  }

  // ---------------------------------------------------------------- drop-down engine
  var stack = [], rootClose = null, rootNav = null, listening = false, hoverTimer = 0;

  function visibleList(items) {
    var out = items.filter(function (it) { return it._visible !== false; });
    while (out.length && out[0].IsSeparator) out.shift();
    while (out.length && out[out.length - 1].IsSeparator) out.pop();
    return out;
  }

  function hilite(en, i) {
    if (en.hl >= 0 && en.rows[en.hl]) en.rows[en.hl].classList.remove('hl');
    en.hl = i;
    if (i >= 0 && en.rows[i]) en.rows[i].classList.add('hl');
  }

  function step(en, d) {
    var n = en.vis.length, i = en.hl;
    for (var k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (i < 0) i = n - 1;
      if (!en.vis[i].IsSeparator && en.vis[i]._enabled) { hilite(en, i); return; }
    }
  }

  function openSub(en, i, keyboard) {
    var it = en.vis[i];
    if (!it || !it._enabled || !it.DropDownItems.length) return;
    it._raise('DropDownOpening');
    var sub = openLevel(it.DropDownItems, 0, 0, en.level + 1, en.rows[i].getBoundingClientRect(), it._strip || en.ownerStrip, en.sourceControl);
    if (sub && keyboard) step(sub, 1);
  }

  function activate(en, i) {
    var it = en.vis[i];
    if (!it || it.IsSeparator || !it._enabled) return;
    if (it.DropDownItems.length) { openSub(en, i, false); return; }
    closeAll();
    it.PerformClick();
  }

  function openLevel(items, x, y, level, anchor, ownerStrip, sourceControl) {
    closeFrom(level);
    var vis = visibleList(items);
    if (!vis.length) return null;
    var el = document.createElement('div');
    el.className = 'wf wf-dd';

    // Héritage automatique du thème (MenuStrip ou SourceControl)
    if (ownerStrip && ownerStrip.element) {
      root.Theme.Inherit(ownerStrip.element, el);
    } else if (sourceControl && sourceControl.element) {
      root.Theme.Inherit(sourceControl.element, el);
    }

    var en = { el: el, vis: vis, level: level, hl: -1, rows: [], ownerStrip: ownerStrip, sourceControl: sourceControl };

    vis.forEach(function (it, i) {
      var row = document.createElement('div');
      if (it.IsSeparator) { row.className = 'wf-sep'; el.appendChild(row); return; }
      row.className = 'wf-mi' + (it._enabled ? '' : ' dis');
      row.setAttribute('data-i', String(i));
      var ic = it._checked && !it._image ? '<span class="g">\u2713</span>' : iconInner(it._image);
      row.innerHTML = '<span class="ic' + (it._checked ? ' on' : '') + '">' + ic + '</span><span class="tx">' +
        Control.FormatText(it._text) + '</span>' +
        (it._shortcut && it._showShortcut ? '<span class="sc">' + esc(it._shortcut) + '</span>' : '') +
        (it.DropDownItems.length ? '<span class="ar">\u25B6</span>' : '');
      if (it._tip) row.title = it._tip;
      row.addEventListener('mouseenter', function () {
        hilite(en, i);
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          if (it.DropDownItems.length && it._enabled) openSub(en, i, false); else closeFrom(en.level + 1);
        }, 120);
      });
      row.addEventListener('click', function (e) { if (e && e.stopPropagation) e.stopPropagation(); activate(en, i); });
      en.rows[i] = row;
      el.appendChild(row);
    });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.body.appendChild(el);

    var w = el.offsetWidth || 160, h = el.offsetHeight || 0, vw = window.innerWidth || 1e5, vh = window.innerHeight || 1e5;
    if (anchor) { x = anchor.right - 2; if (x + w > vw) x = anchor.left - w + 2; y = anchor.top - 3; }
    if (x + w > vw) x = Math.max(0, vw - w);
    if (y + h > vh) y = Math.max(0, vh - h);
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
    stack.push(en);
    return en;
  }

  function closeFrom(level) {
    while (stack.length > level) {
      var en = stack.pop();
      if (en.el.parentNode) en.el.parentNode.removeChild(en.el);
    }
    if (!stack.length && listening) {
      listening = false;
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', closeAll);
      window.removeEventListener('resize', closeAll);
      clearTimeout(hoverTimer);
      var cb = rootClose;
      rootClose = null; rootNav = null;
      if (cb) cb();
    }
  }
  function closeAll() { closeFrom(0); }

  function insideBar(t) {
    while (t && t !== document) {
      if (t.classList && t.classList.contains('wf-ms')) return true;
      t = t.parentNode;
    }
    return false;
  }
  function onDown(e) {
    if (stack.some(function (en) { return en.el.contains(e.target); })) return;
    if (insideBar(e.target)) return;
    closeAll();
  }
  function onKey(e) {
    var en = stack[stack.length - 1], k = e.key;
    if (!en) return;
    var used = true;
    if (k === 'Escape') closeFrom(en.level);
    else if (k === 'ArrowDown') step(en, 1);
    else if (k === 'ArrowUp') step(en, -1);
    else if (k === 'ArrowRight') {
      var it = en.vis[en.hl];
      if (it && it.DropDownItems && it.DropDownItems.length) openSub(en, en.hl, true);
      else if (rootNav) rootNav(1);
    } else if (k === 'ArrowLeft') {
      if (en.level > 0) closeFrom(en.level); else if (rootNav) rootNav(-1);
    } else if (k === 'Enter' || k === ' ') { if (en.hl >= 0) activate(en, en.hl); }
    else used = false;
    if (used) { e.preventDefault(); e.stopPropagation(); }
  }

  function openRoot(items, x, y, onClose, nav, ownerStrip, sourceControl) {
    closeAll();
    var en = openLevel(items, x, y, 0, null, ownerStrip, sourceControl);
    if (!en) { if (onClose) onClose(); return null; }
    rootClose = onClose || null;
    rootNav = nav || null;
    if (!listening) {
      listening = true;
      document.addEventListener('mousedown', onDown, true);
      document.addEventListener('keydown', onKey, true);
      window.addEventListener('blur', closeAll);
      window.addEventListener('resize', closeAll);
    }
    return en;
  }

  // ---------------------------------------------------------------- shortcuts
  var strips = [], keyBound = false;

  function normShortcut(s) {
    var parts = String(s || '').split('+').map(function (p) { return p.trim(); }).filter(Boolean), m = { c: 0, a: 0, s: 0 }, key = '';
    parts.forEach(function (p) {
      var l = p.toLowerCase();
      if (l === 'ctrl' || l === 'control' || l === 'cmd') m.c = 1;
      else if (l === 'alt') m.a = 1;
      else if (l === 'shift') m.s = 1;
      else key = p.length === 1 ? p.toUpperCase() : ({ del: 'Delete', escape: 'Esc', return: 'Enter', ins: 'Insert' }[l] || p.charAt(0).toUpperCase() + p.slice(1));
    });
    return key ? (m.c ? 'Ctrl+' : '') + (m.a ? 'Alt+' : '') + (m.s ? 'Shift+' : '') + key : '';
  }
  function comboOf(e) {
    var k = e.key;
    if (!k || /^(Control|Shift|Alt|Meta)$/.test(k)) return '';
    var name = k.length === 1 ? k.toUpperCase() :
      ({ ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ' ': 'Space', Escape: 'Esc' }[k] || k);
    return (e.ctrlKey || e.metaKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + name;
  }
  function findShortcut(items, combo) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.IsSeparator || !it._visible) continue;
      if (it._shortcut && it._enabled && normShortcut(it._shortcut) === combo && !it.DropDownItems.length) return it;
      var f = findShortcut(it.DropDownItems, combo);
      if (f) return f;
    }
    return null;
  }
  function mnemonicOf(text) {
    var m = /&([^&])/.exec(String(text).replace(/&&/g, '\u0000\u0000'));
    return m ? m[1].toLowerCase() : '';
  }

  function onDocKey(e) {
    if (e.defaultPrevented || stack.length) return;
    var combo = comboOf(e);
    if (!combo) return;
    var hasMod = /^(Ctrl|Alt)/.test(combo) || /^(F\d+|Delete|Insert)$/.test(combo.replace(/^(Ctrl\+)?(Alt\+)?(Shift\+)?/, ''));
    for (var i = 0; i < strips.length; i++) {
      var s = strips[i];
      if (s.element.isConnected === false || !s._visible || !s._enabled) continue;
      if (hasMod) {
        var it = findShortcut(s.Items, combo);
        if (it) { e.preventDefault(); it.PerformClick(); return; }
      }
      if (e.altKey && !e.ctrlKey && e.key.length === 1) {
        var ch = e.key.toLowerCase();
        for (var j = 0; j < s.Items.length; j++) {
          var t = s.Items[j];
          if (!t.IsSeparator && t._visible && t._enabled && mnemonicOf(t._text) === ch) {
            e.preventDefault();
            s._openAt(j, true);
            return;
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- MenuStrip
  function MenuStrip(opts) {
    Control.call(this, 'div', 'wf-ms');
    this._dock = 'Top'; this._height = 24; this._width = 200;
    this.Items = createItems(this);
    this._els = []; this._open = null;
    this._applyRect();
    strips.push(this);
    if (!keyBound) { keyBound = true; document.addEventListener('keydown', onDocKey); }

    if (opts && opts.Theme) {
      this.Theme = opts.Theme;
    }

    this._applyOptions(opts);
    this._renderBar();
  }
  var P = Control.Extend(MenuStrip);

  Object.defineProperty(P, 'Theme', {
    get: function () {
      return this.element.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light');
    },
    set: function (v) {
      if (root.Theme && root.Theme.Apply) {
        root.Theme.Apply(v, this.element);
      }
    }
  });

  P._itemsChanged = function () { this._renderBar(); };

  P._renderBar = function () {
    var self = this, bar = this.element;
    bar.innerHTML = '';
    this._els = [];
    this.Items.forEach(function (it, idx) {
      if (!it._visible) return;
      var d = document.createElement('div');
      if (it.IsSeparator) { d.className = 'wf-msep'; bar.appendChild(d); return; }
      d.className = 'wf-msi' + (it._enabled ? '' : ' dis') + (self._open === it ? ' open' : '');
      d.innerHTML = iconInner(it._image) + Control.FormatText(it._text);
      if (it._tip) d.title = it._tip;
      d.addEventListener('click', function () {
        if (!it._enabled) return;
        if (!it.DropDownItems.length) { closeAll(); it.PerformClick(); return; }
        if (self._open === it) closeAll(); else self._openAt(idx, false);
      });
      d.addEventListener('mouseenter', function () {
        if (self._open && self._open !== it && it._enabled && it.DropDownItems.length) self._openAt(idx, false);
      });
      self._els[idx] = d;
      bar.appendChild(d);
    });
  };

  P._mark = function () {
    var self = this;
    this.Items.forEach(function (it, i) {
      if (self._els[i]) self._els[i].classList.toggle('open', self._open === it);
    });
  };

  P._openAt = function (idx, keyboard) {
    var self = this, it = this.Items[idx], el = this._els[idx];
    if (!it || !el || !it.DropDownItems.length) return;
    closeAll();
    this._open = it;
    this._mark();
    it._raise('DropDownOpening');
    var r = el.getBoundingClientRect();
    var en = openRoot(it.DropDownItems, r.left, r.bottom, function () { self._open = null; self._mark(); },
      function (dir) { self._navigate(dir); }, self, null);
    if (en && keyboard) step(en, 1);
  };

  P._navigate = function (dir) {
    var idxs = [], cur = -1, self = this;
    this.Items.forEach(function (it, i) {
      if (!it.IsSeparator && it._visible && it._enabled && it.DropDownItems.length) { idxs.push(i); if (self._open === it) cur = idxs.length - 1; }
    });
    if (!idxs.length) return;
    this._openAt(idxs[(cur + dir + idxs.length) % idxs.length], true);
  };

  P.Dispose = function () {
    var i = strips.indexOf(this);
    if (i >= 0) strips.splice(i, 1);
    Control.prototype.Dispose.call(this);
  };

  MenuStrip.CreateItems = createItems;
  MenuStrip.ShowPopup = openRoot;
  MenuStrip.CloseAll = closeAll;
  MenuStrip._stack = stack;

  root.ToolStripMenuItem = ToolStripMenuItem;
  root.ToolStripSeparator = ToolStripSeparator;
  root.MenuStrip = MenuStrip;
  if (typeof module !== 'undefined' && module.exports) module.exports = { MenuStrip: MenuStrip, ToolStripMenuItem: ToolStripMenuItem, ToolStripSeparator: ToolStripSeparator };
})(typeof window !== 'undefined' ? window : this);