/*!
 * TreeView.js - WinForms TreeView + TreeNode. Needs Control.js (ImageList.js is optional, MenuStrip.js and
 * ContextMenuStrip.js for node menus).
 *
 *   var tv = new TreeView({ Dock: 'Fill', CheckBoxes: false, ImageList: il, ShowLines: true });
 *   var root = tv.Nodes.Add('Clients');                         // returns the TreeNode
 *   var alger = root.Nodes.Add('Alger');
 *   alger.Nodes.Add('Client 1').Tag = { id: 1 };
 *   tv.Nodes.Add('cle', 'Texte', 0, 1);                          // (key, text, imageIndex, selectedImageIndex)
 *   root.Expand();   tv.SelectedNode = alger;   tv.ExpandAll();
 *   tv.on('AfterSelect', function (s, e) { console.log(e.Node.Text, e.Node.FullPath, e.Node.Tag); });
 *   tv.on('BeforeExpand', function (s, e) { e.Node.Nodes.Add('chargé à la demande'); });   // lazy loading
 *
 * TreeView   : Nodes, SelectedNode, TopNode, CheckBoxes, ShowLines, ShowPlusMinus, ShowRootLines, FullRowSelect,
 *   HideSelection (true: the selection is hidden when the tree loses the focus), HotTracking, LabelEdit (F2 or a click on
 *   the selected node), Indent (19), ItemHeight (20), PathSeparator ('\'), ImageList (ImageList object or array),
 *   ImageIndex / ImageKey / SelectedImageIndex / SelectedImageKey (defaults for all nodes, -1 = none), Sorted,
 *   TreeViewNodeSorter (function(a, b)), BorderStyle ('FixedSingle' | 'None'), VisibleCount
 *   Methods: ExpandAll(), CollapseAll(), GetNodeAt(x, y), GetNodeCount(includeSubTrees), Sort(), BeginUpdate(),
 *   EndUpdate()
 *   Events : BeforeSelect, AfterSelect, BeforeExpand, AfterExpand, BeforeCollapse, AfterCollapse, BeforeCheck, AfterCheck,
 *   NodeMouseClick, NodeMouseDoubleClick, BeforeLabelEdit, AfterLabelEdit  (e.Node, e.Cancel / e.CancelEdit, e.Action)
 * TreeNode   : Text, Name, Tag, Checked, ToolTipText, ForeColor, BackColor, Bold, ImageIndex, ImageKey, SelectedImageIndex,
 *   SelectedImageKey, Image (an image source, wins over the ImageList), ContextMenuStrip, Nodes, Parent, TreeView, Level,
 *   Index, FullPath, FirstNode, LastNode, NextNode, PrevNode, IsExpanded, IsSelected, IsVisible,
 *   Expand(), Collapse(), Toggle(), ExpandAll(), EnsureVisible(), BeginEdit(), EndEdit(cancel), Remove(),
 *   GetNodeCount(includeSubTrees)
 * Nodes (TreeNodeCollection): Add(text | node | key, text, imageIndex, selectedImageIndex), AddRange, Insert(i, ...),
 *   Remove, RemoveAt, RemoveByKey, Clear, Contains, Find(key, searchAllChildren), Count, [i]
 * Keys: Up / Down / Home / End / PageUp / PageDown, Right (expand / first child), Left (collapse / parent), Space (check),
 *   F2 (edit), * (expand all below the node).
 */
/*!
 * TreeView.js - WinForms TreeView + TreeNode. Needs Control.js and Theme.js.
 */
(function (root) {
  'use strict';
  var Control = root.Control, esc = Control.Esc;
  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

  Control.InjectCss([
    '.wf-tv{background:var(--wf-field, #fff);color:var(--wf-text, #000);border:1px solid var(--wf-border, #828790);outline:none;overflow:hidden}',
    '.wf-tv.nob{border:0}',
    '.wf-tv-sc{position:absolute;left:0;top:0;right:0;bottom:0;overflow:auto}',
    '.wf-tv-body{position:relative;min-width:100%}',
    '.wf-tv-row{position:absolute;left:0;min-width:100%;white-space:nowrap}',
    '.wf-tv-row>i{position:absolute;pointer-events:none}',
    '.wf-tv-row>i.vl{width:0;border-left:1px dotted var(--wf-line, #808080)}',
    '.wf-tv-row>i.hl{height:0;border-top:1px dotted var(--wf-line, #808080)}',
    '.wf-tv-ex{position:absolute;width:9px;height:9px;border:1px solid var(--wf-border-strong, #919191);background:var(--wf-field, #fff);cursor:default}',
    '.wf-tv-ex:before{content:"";position:absolute;left:1px;right:1px;top:3px;height:1px;background:var(--wf-text, #000)}',
    '.wf-tv-ex.c:after{content:"";position:absolute;top:1px;bottom:1px;left:3px;width:1px;background:var(--wf-text, #000)}',
    '.wf-tv-ct{position:absolute;top:0;display:flex;align-items:center;height:100%}',
    '.wf-tv-ic{flex:none;display:inline-flex;align-items:center;justify-content:center;margin-inline-end:4px}',
    '.wf-tv-ic img{width:100%;height:100%;object-fit:contain}',
    '.wf-tv-cb{margin:0 4px 0 2px}',
    '.wf-tv-lbl{padding:0 3px;border:1px solid transparent;color:inherit}',
    '.wf-tv-lbl.b{font-weight:600}',
    '.wf-tv-ed{width:120px;margin:0;padding:0 2px;font:inherit;background:var(--wf-field, #fff);color:var(--wf-text, #000);border:1px solid var(--wf-accent, #0078d7);outline:0}',
    '.wf-tv.hot .wf-tv-lbl:hover{text-decoration:underline;color:var(--wf-link, #0066cc)}',
    '.wf-tv.show .wf-tv-lbl.sel,.wf-tv.show.full .wf-tv-row.sel{background:var(--wf-sel-off, #d9d9d9);color:var(--wf-text, #000)}',
    '.wf-tv:focus .wf-tv-lbl.sel,.wf-tv:focus.full .wf-tv-row.sel{background:var(--wf-accent, #0078d7);color:var(--wf-accent-text, #fff)}',
    '.wf-tv.full .wf-tv-row.sel .wf-tv-lbl{background:transparent}',
    '.wf-tv.wf-disabled{background:var(--wf-surface, #f0f0f0);color:var(--wf-text-off, #a0a0a0)}'
  ].join(''));

  function cls(t) { return String((t && t.className) || ''); }

  // ================================================================= TreeNode
  function TreeNode(text) {
    this._text = text == null ? '' : String(text);
    this.Name = ''; this.Tag = null; this.ContextMenuStrip = null;
    this.Parent = null; this._tree = null;
    this._expanded = false; this._checked = false;
    this._ForeColor = ''; this._BackColor = ''; this._Bold = false; this._ToolTipText = '';
    this._ImageIndex = -1; this._ImageKey = ''; this._SelectedImageIndex = -1; this._SelectedImageKey = ''; this._Image = '';
    this._fi = -1;
    this.Nodes = makeNodes(this);
  }
  var NP = TreeNode.prototype;

  NP._touch = function () { if (this._tree) this._tree._invalidate(false); };

  ['ForeColor', 'BackColor', 'Bold', 'ToolTipText', 'ImageIndex', 'ImageKey', 'SelectedImageIndex', 'SelectedImageKey', 'Image'].forEach(function (n) {
    Object.defineProperty(NP, n, {
      get: function () { return this['_' + n]; },
      set: function (v) { this['_' + n] = v; this._touch(); }
    });
  });

  Object.defineProperties(NP, {
    Text: {
      get: function () { return this._text; },
      set: function (v) {
        this._text = v == null ? '' : String(v);
        if (this._tree) { this._tree._needSort = true; this._tree._invalidate(false); }
      }
    },
    Checked: {
      get: function () { return this._checked; },
      set: function (v) { if (this._tree) this._tree._setChecked(this, !!v, 'Unknown'); else this._checked = !!v; }
    },
    TreeView: { get: function () { return this._tree; } },
    IsExpanded: { get: function () { return this._expanded; } },
    IsSelected: { get: function () { return !!this._tree && this._tree._sel === this; } },
    IsVisible: {
      get: function () {
        if (!this._tree) return false;
        for (var p = this.Parent; p; p = p.Parent) if (!p._expanded) return false;
        return true;
      }
    },
    Level: { get: function () { var l = 0; for (var p = this.Parent; p; p = p.Parent) l++; return l; } },
    Index: { get: function () { var l = this._siblings(); return l ? l.indexOf(this) : -1; } },
    FirstNode: { get: function () { return this.Nodes[0] || null; } },
    LastNode: { get: function () { return this.Nodes[this.Nodes.length - 1] || null; } },
    NextNode: { get: function () { var l = this._siblings(); return l ? l[l.indexOf(this) + 1] || null : null; } },
    PrevNode: { get: function () { var l = this._siblings(); return l && l.indexOf(this) > 0 ? l[l.indexOf(this) - 1] : null; } },
    FullPath: {
      get: function () {
        var sep = this._tree ? this._tree._sep : '\\', parts = [];
        for (var n = this; n; n = n.Parent) parts.unshift(n._text);
        return parts.join(sep);
      }
    }
  });

  NP._siblings = function () { return this.Parent ? this.Parent.Nodes : (this._tree ? this._tree.Nodes : null); };

  NP.Expand = function () { if (this._tree) this._tree._setExpanded(this, true, 'Unknown'); else this._expanded = true; };
  NP.Collapse = function (ignoreChildren) {
    if (!this._tree) { this._expanded = false; return; }
    if (!ignoreChildren) this.Nodes.forEach(function (c) { c.Collapse(); });
    this._tree._setExpanded(this, false, 'Unknown');
  };
  NP.Toggle = function () { if (this._expanded) this.Collapse(true); else this.Expand(); };
  NP.ExpandAll = function () {
    this.Expand();
    this.Nodes.slice().forEach(function (c) { c.ExpandAll(); });
  };
  NP.EnsureVisible = function () { if (this._tree) this._tree._ensureVisible(this); };
  NP.BeginEdit = function () { return this._tree ? this._tree._beginEdit(this) : false; };
  NP.EndEdit = function (cancel) { if (this._tree) this._tree._endEdit(!!cancel); };
  NP.Remove = function () { var l = this._siblings(); if (l) l.Remove(this); };
  NP.GetNodeCount = function (includeSubTrees) {
    var c = this.Nodes.length;
    if (includeSubTrees) this.Nodes.forEach(function (n) { c += n.GetNodeCount(true); });
    return c;
  };
  NP.toString = function () { return 'TreeNode: ' + this._text; };

  // ---------------------------------------------------------------- TreeNodeCollection
  function setTree(n, t) {
    n._tree = t;
    n.Nodes.forEach(function (c) { setTree(c, t); });
  }
  function contains(n, target) {
    for (var p = target; p; p = p.Parent) if (p === n) return true;
    return false;
  }

  function makeNodes(owner) {
    var list = [], isNode = owner instanceof TreeNode;
    var treeOf = function () { return isNode ? owner._tree : owner; };
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });

    var changed = function () { var t = treeOf(); if (t) { t._needSort = true; t._invalidate(true); } };
    var attach = function (n) {
      if (n.Parent) n.Parent.Nodes.Remove(n);
      else if (n._tree && n._tree.Nodes.indexOf(n) >= 0) n._tree.Nodes.Remove(n);
      n.Parent = isNode ? owner : null;
      setTree(n, treeOf());
    };
    var make = function (args) {
      var a = args[0];
      if (a instanceof TreeNode) return a;
      if (args.length > 1) {
        var n = new TreeNode(args[1]);
        n.Name = String(a);
        if (args[2] != null) n._ImageIndex = args[2];
        if (args[3] != null) n._SelectedImageIndex = args[3];
        return n;
      }
      return new TreeNode(a);
    };

    list.Add = function () { var n = make(arguments); attach(n); list.push(n); changed(); return n; };
    list.AddRange = function (arr) { arr.forEach(function (x) { var n = make([x]); attach(n); list.push(n); }); changed(); };
    list.Insert = function (i) {
      var n = make(Array.prototype.slice.call(arguments, 1));
      attach(n);
      list.splice(Math.max(0, Math.min(list.length, i)), 0, n);
      changed();
      return n;
    };
    list.Remove = function (n) {
      var i = list.indexOf(n);
      if (i < 0) return;
      var t = treeOf();
      list.splice(i, 1);
      if (t && t._sel && contains(n, t._sel)) t._sel = null;
      if (t && t._edit && contains(n, t._edit.node)) t._edit = null;
      n.Parent = null;
      setTree(n, null);
      if (t) t._invalidate(true);
    };
    list.RemoveAt = function (i) { if (list[i]) list.Remove(list[i]); };
    list.RemoveByKey = function (key) {
      var f = list.Find(key, false)[0];
      if (f) list.Remove(f);
    };
    list.Clear = function () { list.slice().forEach(list.Remove); };
    list.Contains = function (n) { return list.indexOf(n) >= 0; };
    list.Find = function (key, all) {
      var out = [], k = String(key).toLowerCase();
      (function walk(l) {
        l.forEach(function (n) {
          if (n.Name.toLowerCase() === k) out.push(n);
          if (all) walk(n.Nodes);
        });
      })(list);
      return out;
    };
    return list;
  }

  // ================================================================= TreeView
  function TreeView(opts) {
    Control.call(this, 'div', 'wf-tv show');
    this._width = 121; this._height = 97;
    this._indent = 19; this._itemH = 20;
    this._lines = true; this._plusMinus = true; this._rootLines = true;
    this._check = false; this._full = false; this._hideSel = true; this._hot = false; this._label = false;
    this._sep = '\\'; this._il = null; this._ilFn = null;
    this._imgIdx = -1; this._imgKey = ''; this._selImgIdx = -1; this._selImgKey = '';
    this._sorted = false; this._sorter = null; this._needSort = false;
    this._sel = null; this._flat = []; this._dirty = true; this._upd = 0; this._rp = 0; this._edit = null; this._rerender = false;
    this._bs2 = 'FixedSingle'; this._editTimer = 0;
    this.Nodes = makeNodes(this);

    this._sc = document.createElement('div');
    this._sc.className = 'wf-tv-sc';
    this._body = document.createElement('div');
    this._body.className = 'wf-tv-body';
    this._sc.appendChild(this._body);
    this.element.appendChild(this._sc);
    this.element.tabIndex = 0;
    this._syncHide();

    // Support de la propriété Theme dans les options (ex: new TreeView({ Theme: 'Dark' }))
    if (opts && opts.Theme) {
      this.Theme = opts.Theme;
    }

    this._bind();
    this._applyRect();
    this._applyOptions(opts);
    this._ensureObserver();
    this._invalidate(true);
  }
  var P = Control.Extend(TreeView);

  // Ajout de la gestion de la propriété .Theme sur le composant TreeView
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

  P._invalidate = function (structural) {
    if (structural) this._dirty = true;
    if (this._upd > 0 || this._rp) return;
    var self = this, run = function () { self._rp = 0; self._render(); };
    this._rp = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(run) : setTimeout(run, 0);
  };

  P._sortAll = function (list) {
    var self = this;
    list.sort(this._sorter || function (a, b) { return a._text.localeCompare(b._text); });
    list.forEach(function (n) { if (n.Nodes.length) self._sortAll(n.Nodes); });
  };

  P._buildFlat = function () {
    this._dirty = false;
    if (this._sorted && this._needSort) { this._sortAll(this.Nodes); this._needSort = false; }
    var flat = [];
    (function walk(list, d, cont) {
      for (var i = 0; i < list.length; i++) {
        var n = list[i], last = i === list.length - 1;
        n._fi = flat.length;
        flat.push({ n: n, d: d, last: last, firstRoot: d === 0 && i === 0, cont: cont });
        if (n._expanded && n.Nodes.length) walk(n.Nodes, d + 1, cont.concat([!last]));
      }
    })(this.Nodes, 0, []);
    this._flat = flat;
  };

  P._ensureFlat = function () { if (this._dirty) this._buildFlat(); };

  function imgSrc(il, idx, key) {
    if (!il) return '';
    var arr = il.Images || il;
    if (key && il.Images) { var i = il.Images.IndexOfKey(key); if (i >= 0) return arr[i] || ''; }
    return idx >= 0 ? arr[idx] || '' : '';
  }
  P._iconFor = function (n, selected) {
    if (n._Image) return n._Image;
    var il = this._il;
    var a = imgSrc(il, n._ImageIndex, n._ImageKey) || imgSrc(il, this._imgIdx, this._imgKey);
    if (!selected) return a;
    return imgSrc(il, n._SelectedImageIndex, n._SelectedImageKey) || imgSrc(il, this._selImgIdx, this._selImgKey) || a;
  };

  P._render = function () {
    if (this._upd > 0) return;
    this._ensureFlat();
    var flat = this._flat, H = this._itemH, sc = this._sc, body = this._body;
    body.style.height = flat.length * H + 'px';
    var st = sc.scrollTop, vh = sc.clientHeight || 300;
    var s = Math.max(0, Math.floor(st / H) - 2), e = Math.min(flat.length, Math.ceil((st + vh) / H) + 2);
    this._rerender = true;
    body.innerHTML = '';
    for (var i = s; i < e; i++) body.appendChild(this._row(i));
    this._rerender = false;
    if (this._edit && this._edit.input && this._edit.input.focus) this._edit.input.focus();
  };

  P._row = function (i) {
    var self = this, ent = this._flat[i], n = ent.n, d = ent.d, H = this._itemH, ind = this._indent;
    var off = this._rootLines ? 0 : -1, col = d + off, half = Math.floor(H / 2), sel = this._sel === n;
    var row = document.createElement('div');
    row.className = 'wf-tv-row' + (sel && this._full ? ' sel' : '');
    row.setAttribute('data-i', String(i));
    row.style.top = i * H + 'px';
    row.style.height = H + 'px';
    if (n._ToolTipText) row.title = n._ToolTipText;

    var h = [], kids = n.Nodes.length > 0;
    if (this._lines) {
      for (var k = 0; k < d; k++) {
        if (ent.cont[k] && k + off >= 0) h.push('<i class="vl" style="left:' + ((k + off) * ind + Math.floor(ind / 2)) + 'px;top:0;bottom:0"></i>');
      }
      if (col >= 0) {
        var cx = col * ind + Math.floor(ind / 2), top = ent.firstRoot ? half : 0, bot = ent.last ? half : H;
        if (bot > top) h.push('<i class="vl" style="left:' + cx + 'px;top:' + top + 'px;height:' + (bot - top) + 'px"></i>');
        var hx = cx + (kids && this._plusMinus ? 5 : 0);
        h.push('<i class="hl" style="left:' + hx + 'px;top:' + half + 'px;width:' + Math.max(0, (col + 1) * ind - hx) + 'px"></i>');
      }
    }
    if (this._plusMinus && kids && col >= 0) {
      var ex = col * ind + Math.floor(ind / 2);
      h.push('<span class="wf-tv-ex' + (n._expanded ? '' : ' c') + '" style="left:' + (ex - 4) + 'px;top:' + (half - 4) + 'px"></span>');
    }
    row.innerHTML = h.join('');

    var ct = document.createElement('div');
    ct.className = 'wf-tv-ct';
    ct.style.left = Math.max(0, (col + 1) * ind) + 'px';
    var il = this._il, sz = il && il.ImageSize ? il.ImageSize : { Width: 16, Height: 16 };
    var src = this._iconFor(n, sel), pre = '';
    if (this._check) pre += '<input type="checkbox" class="wf-tv-cb"' + (n._checked ? ' checked' : '') + '>';
    if (src) {
      pre += '<span class="wf-tv-ic" style="width:' + sz.Width + 'px;height:' + sz.Height + 'px;font-size:' + Math.round(sz.Height * 0.8) + 'px;line-height:1">' +
        (IMG_RE.test(src) ? '<img src="' + esc(src) + '" alt="">' : esc(src)) + '</span>';
    }
    ct.innerHTML = pre;

    var lbl;
    if (this._edit && this._edit.node === n) {
      lbl = document.createElement('input');
      lbl.className = 'wf-tv-ed';
      lbl.value = this._edit.value;
      lbl.style.height = Math.max(14, H - 2) + 'px';
      this._edit.input = lbl;
      lbl.addEventListener('input', function () { self._edit.value = lbl.value; });
      lbl.addEventListener('mousedown', function (e) { if (e.stopPropagation) e.stopPropagation(); });
      lbl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); self._endEdit(false); self.element.focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); self._endEdit(true); self.element.focus(); }
        if (e.stopPropagation) e.stopPropagation();
      });
      lbl.addEventListener('blur', function () { if (!self._rerender && self._edit && self._edit.node === n) self._endEdit(false); });
    } else {
      lbl = document.createElement('span');
      lbl.className = 'wf-tv-lbl' + (n._Bold ? ' b' : '') + (sel && !this._full ? ' sel' : '');
      lbl.style.lineHeight = Math.max(10, H - 4) + 'px';
      if (n._ForeColor && !(sel && !this._full)) lbl.style.color = n._ForeColor;
      if (n._BackColor && !(sel && !this._full)) lbl.style.backgroundColor = n._BackColor;
      lbl.textContent = n._text;
    }
    ct.appendChild(lbl);
    row.appendChild(ct);

    var onCt = function (t) {
      while (t && t !== row) { if (cls(t).indexOf('wf-tv-ct') >= 0) return true; t = t.parentNode; }
      return false;
    };
    row.addEventListener('mousedown', function (e) {
      if (e.button !== 0 && e.button !== undefined) return;
      var c = cls(e.target);
      if (c.indexOf('wf-tv-ex') >= 0) { self._setExpanded(n, !n._expanded, 'ByMouse'); return; }
      if (c.indexOf('wf-tv-cb') >= 0 || c.indexOf('wf-tv-ed') >= 0) return;
      if (self._full || onCt(e.target)) {
        var was = self._sel === n;
        self._select(n, 'ByMouse');
        row._was = was;
        self.element.focus();
      }
    });
    row.addEventListener('click', function (e) {
      var c = cls(e.target);
      if (c.indexOf('wf-tv-cb') >= 0) {
        if (!self._setChecked(n, !!e.target.checked, 'ByMouse')) e.target.checked = n._checked;
        return;
      }
      if (c.indexOf('wf-tv-ex') >= 0 || c.indexOf('wf-tv-ed') >= 0) return;
      if (!self._full && !onCt(e.target)) return;
      self._raise('NodeMouseClick', { Node: n, Button: 'Left', Clicks: 1, X: e.clientX, Y: e.clientY });
      if (self._label && row._was && self._sel === n) {
        clearTimeout(self._editTimer);
        self._editTimer = setTimeout(function () { if (self._sel === n) self._beginEdit(n); }, 400);
      }
      row._was = false;
    });
    row.addEventListener('dblclick', function (e) {
      var c = cls(e.target);
      if (c.indexOf('wf-tv-ex') >= 0 || c.indexOf('wf-tv-cb') >= 0 || c.indexOf('wf-tv-ed') >= 0) return;
      clearTimeout(self._editTimer);
      self._raise('NodeMouseDoubleClick', { Node: n, Button: 'Left', Clicks: 2, X: e.clientX, Y: e.clientY });
      if (n.Nodes.length) self._setExpanded(n, !n._expanded, 'ByMouse');
    });
    row.addEventListener('contextmenu', function (e) {
      if (!self._full && !onCt(e.target)) return;
      self._raise('NodeMouseClick', { Node: n, Button: 'Right', Clicks: 1, X: e.clientX, Y: e.clientY });
      var m = n.ContextMenuStrip;
      if (m && m.Show) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        // Transmission du composant source (self) pour que les menus contextuels héritent du thème du TreeView
        m.Show(self, e.clientX, e.clientY, true);
      }
    });
    return row;
  };

  P._expandAncestors = function (n) {
    for (var p = n.Parent; p; p = p.Parent) if (!p._expanded) { p._expanded = true; this._dirty = true; }
  };

  P._select = function (n, action) {
    if (n === this._sel) return true;
    var e = this._raise('BeforeSelect', { Node: n, Cancel: false, Action: action });
    if (e.Cancel) return false;
    this._sel = n;
    if (n) { this._expandAncestors(n); this._scrollTo(n); }
    this._invalidate(true);
    this._raise('AfterSelect', { Node: n, Action: action });
    return true;
  };

  P._scrollTo = function (n) {
    this._ensureFlat();
    var ent = this._flat[n._fi];
    if (!ent || ent.n !== n) return;
    var H = this._itemH, sc = this._sc, top = n._fi * H, vh = (sc.clientHeight || 300);
    if (top < sc.scrollTop) sc.scrollTop = top;
    else if (top + H > sc.scrollTop + vh) sc.scrollTop = top + H - vh;
  };

  P._ensureVisible = function (n) {
    this._expandAncestors(n);
    this._invalidate(true);
    this._scrollTo(n);
  };

  P._setExpanded = function (n, expand, action) {
    if (n._expanded === expand) return;
    var name = expand ? 'Expand' : 'Collapse';
    var e = this._raise('Before' + name, { Node: n, Cancel: false, Action: action });
    if (e.Cancel) return;
    n._expanded = expand;
    if (!expand && this._sel && this._sel !== n && contains(n, this._sel)) this._select(n, action);
    this._invalidate(true);
    this._raise('After' + name, { Node: n, Action: action });
  };

  P._setChecked = function (n, v, action) {
    if (n._checked === v) return true;
    var e = this._raise('BeforeCheck', { Node: n, Cancel: false, Action: action });
    if (e.Cancel) return false;
    n._checked = v;
    this._invalidate(false);
    this._raise('AfterCheck', { Node: n, Action: action });
    return true;
  };

  P._beginEdit = function (n) {
    if (!this._label || this._edit) return false;
    var e = this._raise('BeforeLabelEdit', { Node: n, CancelEdit: false });
    if (e.CancelEdit) return false;
    this._edit = { node: n, value: n._text, input: null };
    this._ensureVisible(n);
    this._render();
    var inp = this._edit && this._edit.input;
    if (inp && inp.select) inp.select();
    return true;
  };

  P._endEdit = function (cancel) {
    var ed = this._edit;
    if (!ed) return;
    this._edit = null;
    var e = this._raise('AfterLabelEdit', { Node: ed.node, Label: cancel ? null : ed.value, CancelEdit: !!cancel });
    if (!cancel && !e.CancelEdit) ed.node.Text = ed.value;
    this._invalidate(true);
    this._render();
  };

  P._bind = function () {
    var self = this;
    this._sc.addEventListener('scroll', function () { self._invalidate(false); });

    this.element.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && String(t.tagName).toUpperCase() === 'INPUT' && cls(t).indexOf('wf-tv-ed') >= 0) return;
      self._ensureFlat();
      var flat = self._flat, cur = self._sel, idx = cur && flat[cur._fi] && flat[cur._fi].n === cur ? cur._fi : -1;
      var page = Math.max(1, Math.floor((self._sc.clientHeight || 300) / self._itemH) - 1), go = null, k = e.key;
      if (!flat.length) return;
      if (k === 'ArrowDown') go = flat[Math.min(flat.length - 1, idx + 1)];
      else if (k === 'ArrowUp') go = flat[Math.max(0, idx < 0 ? 0 : idx - 1)];
      else if (k === 'Home') go = flat[0];
      else if (k === 'End') go = flat[flat.length - 1];
      else if (k === 'PageDown') go = flat[Math.min(flat.length - 1, Math.max(0, idx) + page)];
      else if (k === 'PageUp') go = flat[Math.max(0, idx - page)];
      else if (k === 'ArrowRight' || k === '+') {
        if (!cur) return;
        if (cur.Nodes.length && !cur._expanded) { e.preventDefault(); self._setExpanded(cur, true, 'ByKeyboard'); return; }
        if (k === 'ArrowRight' && cur.Nodes.length) go = { n: cur.Nodes[0] };
      } else if (k === 'ArrowLeft' || k === '-') {
        if (!cur) return;
        if (cur._expanded && cur.Nodes.length) { e.preventDefault(); self._setExpanded(cur, false, 'ByKeyboard'); return; }
        if (k === 'ArrowLeft' && cur.Parent) go = { n: cur.Parent };
      } else if (k === ' ') {
        if (self._check && cur) { e.preventDefault(); self._setChecked(cur, !cur._checked, 'ByKeyboard'); }
        return;
      } else if (k === 'F2') {
        if (cur) { e.preventDefault(); self._beginEdit(cur); }
        return;
      } else if (k === '*' || k === 'Multiply') {
        if (cur) { e.preventDefault(); cur.ExpandAll(); }
        return;
      } else return;
      e.preventDefault();
      if (go) self._select(go.n, 'ByKeyboard');
    });
  };

  P._focusEl = function () { return this.element; };
  P._enabledChanged = function () { };

  P._syncHide = function () {
    var c = this.element.classList;
    c.toggle('show', !this._hideSel);
    c.toggle('full', this._full);
    c.toggle('hot', this._hot);
  };

  var simple = function (name, field, after) {
    return {
      get: function () { return this[field]; },
      set: function (v) { this[field] = v; if (after) after.call(this, v); this._invalidate(true); }
    };
  };

  Object.defineProperties(P, {
    SelectedNode: {
      get: function () { return this._sel; },
      set: function (n) { this._select(n || null, 'Unknown'); }
    },
    TopNode: {
      get: function () {
        this._ensureFlat();
        var e = this._flat[Math.floor(this._sc.scrollTop / this._itemH)];
        return e ? e.n : null;
      },
      set: function (n) { if (n) { this._ensureVisible(n); this._sc.scrollTop = n._fi * this._itemH; this._invalidate(false); } }
    },
    VisibleCount: { get: function () { return Math.floor((this._sc.clientHeight || 0) / this._itemH); } },
    CheckBoxes: simple('CheckBoxes', '_check'),
    ShowLines: simple('ShowLines', '_lines'),
    ShowPlusMinus: simple('ShowPlusMinus', '_plusMinus'),
    ShowRootLines: simple('ShowRootLines', '_rootLines'),
    FullRowSelect: simple('FullRowSelect', '_full', function () { this._syncHide(); }),
    HideSelection: simple('HideSelection', '_hideSel', function (v) { this._hideSel = !!v; this._syncHide(); }),
    HotTracking: simple('HotTracking', '_hot', function () { this._syncHide(); }),
    LabelEdit: { get: function () { return this._label; }, set: function (v) { this._label = !!v; } },
    Indent: {
      get: function () { return this._indent; },
      set: function (v) { this._indent = Math.max(5, +v || 19); this._invalidate(true); }
    },
    ItemHeight: {
      get: function () { return this._itemH; },
      set: function (v) { this._itemH = Math.max(10, +v || 20); this._invalidate(true); }
    },
    PathSeparator: { get: function () { return this._sep; }, set: function (v) { this._sep = String(v); } },
    ImageIndex: simple('ImageIndex', '_imgIdx'),
    ImageKey: simple('ImageKey', '_imgKey'),
    SelectedImageIndex: simple('SelectedImageIndex', '_selImgIdx'),
    SelectedImageKey: simple('SelectedImageKey', '_selImgKey'),
    ImageList: {
      get: function () { return this._il; },
      set: function (v) {
        var self = this;
        if (this._il && this._il.off && this._ilFn) this._il.off('Changed', this._ilFn);
        this._il = v || null;
        if (this._il && this._il.on && this._il.Images) {
          this._ilFn = function () { self._invalidate(true); };
          this._il.on('Changed', this._ilFn);
        }
        this._invalidate(true);
      }
    },
    Sorted: {
      get: function () { return this._sorted; },
      set: function (v) { this._sorted = !!v; this._needSort = this._sorted; this._invalidate(true); }
    },
    TreeViewNodeSorter: {
      get: function () { return this._sorter; },
      set: function (f) { this._sorter = typeof f === 'function' ? f : null; this._needSort = this._sorted; this._invalidate(true); }
    },
    BorderStyle: {
      get: function () { return this._bs2; },
      set: function (v) {
        this._bs2 = /none/i.test(v) ? 'None' : 'FixedSingle';
        this.element.classList.toggle('nob', this._bs2 === 'None');
      }
    }
  });

  P.ExpandAll = function () {
    this.BeginUpdate();
    this.Nodes.slice().forEach(function (n) { n.ExpandAll(); });
    this.EndUpdate();
  };
  P.CollapseAll = function () {
    this.BeginUpdate();
    this.Nodes.slice().forEach(function (n) { n.Collapse(); });
    this.EndUpdate();
  };
  P.GetNodeAt = function (x, y) {
    this._ensureFlat();
    var e = this._flat[Math.floor((y + this._sc.scrollTop) / this._itemH)];
    return e ? e.n : null;
  };
  P.GetNodeCount = function (includeSubTrees) {
    var c = this.Nodes.length;
    if (includeSubTrees) this.Nodes.forEach(function (n) { c += n.GetNodeCount(true); });
    return c;
  };
  P.Sort = function () { this._sortAll(this.Nodes); this._needSort = false; this._invalidate(true); };
  P.BeginUpdate = function () { this._upd++; };
  P.EndUpdate = function () { this._upd = Math.max(0, this._upd - 1); if (!this._upd) { this._dirty = true; this._render(); } };
  P.Dispose = function () {
    if (this._il && this._il.off && this._ilFn) this._il.off('Changed', this._ilFn);
    clearTimeout(this._editTimer);
    Control.prototype.Dispose.call(this);
  };

  TreeView.TreeNode = TreeNode;
  root.TreeNode = TreeNode;
  root.TreeView = TreeView;
  if (typeof module !== 'undefined' && module.exports) module.exports = { TreeView: TreeView, TreeNode: TreeNode };
})(typeof window !== 'undefined' ? window : this);