/*!
 * LinkLabel.js - WinForms LinkLabel component. Needs Control.js (Theme.js is optional).
 *
 *   var lnk = new LinkLabel({ Text: 'Click here', LinkArea: [0, 5], LinkBehavior: 'HoverUnderline', LinkColor: 'Blue' });
 *   lnk.Links.Add(6, 4, 'https://example.com'); // Add a secondary link range
 *   lnk.on('LinkClicked', function (sender, e) { console.log(e.Link.LinkData); });
 *
 * Properties: Text, TextAlign (Left/Center/Right), LinkArea [start, length], Links (LinkCollection),
 *   LinkBehavior ('AlwaysUnderline' | 'HoverUnderline' | 'NeverUnderline'), LinkVisited (false),
 *   VisitedLinkColor ('Purple'), ActiveLinkColor ('Red'), DisabledLinkColor ('Gray'), LinkColor ('Blue'),
 *   UseCompatibleTextRendering, UseMnemonic, TabIndex, TabStop, Tag, Enabled, Visible
 * Methods: Links.Add(start, length, [linkData]), Links.Clear(), Links.Remove(link), Dispose()
 * Events (sender, e): LinkClicked (e.Link, e.LinkData), LinkHover
 */
(function (root) {
    'use strict';
    var Control = root.Control;
    if (!Control) throw new Error('LinkLabel.js needs Control.js to be loaded first');

    Control.InjectCss([
        '.wf-lnk{position:relative;display:inline-flex;align-items:center;box-sizing:border-box;padding:1px 2px;',
        'font:12px "Segoe UI",Tahoma,Arial,sans-serif;color:var(--wf-lnk-color,#0000ff);cursor:default;user-select:none}',
        '.wf-lnk.disabled{color:var(--wf-lnk-disabled,#808080)!important;cursor:default!important}',
        '.wf-lnk a,.wf-lnk span.wf-sublnk{color:inherit;text-decoration:none;outline:none}',
        '.wf-lnk.always-underline a,.wf-lnk.always-underline span.wf-sublnk{text-decoration:underline}',
        '.wf-lnk.hover-underline a:hover,.wf-lnk.hover-underline span.wf-sublnk:hover{text-decoration:underline}',
        '.wf-lnk span.wf-sublnk{cursor:pointer}'
    ].join(''));

    function LinkItem(start, length, linkData, target, enabled) {
        this._start = Math.max(0, start || 0);
        this._len = Math.max(0, length || 0);
        this._data = linkData !== undefined ? linkData : null;
        this._target = target || '';
        this._enabled = enabled !== false;
        this._visited = false;
        this._hovered = false;
    }
    Object.defineProperties(LinkItem.prototype, {
        Start: { get: function () { return this._start; }, set: function (v) { this._start = Math.max(0, +v || 0); } },
        Length: { get: function () { return this._len; }, set: function (v) { this._len = Math.max(0, +v || 0); } },
        LinkData: { get: function () { return this._data; }, set: function (v) { this._data = v; } },
        Description: { get: function () { return this._target; }, set: function (v) { this._target = v == null ? '' : String(v); } },
        Enabled: { get: function () { return this._enabled; }, set: function (v) { this._enabled = !!v; } },
        Visited: { get: function () { return this._visited; }, set: function (v) { this._visited = !!v; } }
    });

    function LinkCollection(owner) {
        this._owner = owner;
        this._list = [];
    }
    LinkCollection.prototype = {
        Add: function (start, length, data, target) {
            var item = new LinkItem(start, length, data, target, true);
            this._list.push(item);
            this._owner._refreshContent();
            return item;
        },
        Clear: function () {
            this._list = [];
            this._owner._refreshContent();
        },
        Remove: function (item) {
            var idx = this._list.indexOf(item);
            if (idx >= 0) {
                this._list.splice(idx, 1);
                this._owner._refreshContent();
            }
        },
        get Count() { return this._list.length; },
        Item: function (i) { return this._list[i]; }
    };

    function normBehavior(v) {
        var s = String(v == null ? '' : v).toLowerCase();
        if (s === 'neverunderline') return 'NeverUnderline';
        if (s === 'alwaysunderline') return 'AlwaysUnderline';
        return 'HoverUnderline';
    }

    function LinkLabel(opts) {
        // Safe instantiation matching standard Control component pattern
        if (typeof Control === 'function') {
            Control.call(this);
        }

        this._el = document.createElement('div');
        this._el.className = 'wf wf-lnk';
        if (this.element) {
            this.element.appendChild(this._el);
        }

        this._text = '';
        this._align = 'Left';
        this._behavior = 'HoverUnderline';
        this._visited = false;
        this._useVisited = true;
        this._area = [0, 0]; // [start, length]
        this._links = new LinkCollection(this);
        this._colors = {
            link: 'blue',
            visited: 'purple',
            active: 'red',
            disabled: 'gray'
        };
        this._activeLink = null;

        var self = this;
        this._el.addEventListener('click', function (e) {
            if (!self._enabled) return;
            var target = e.target;
            if (target && target.classList.contains('wf-sublnk')) {
                var idx = parseInt(target.getAttribute('data-link-idx'), 10);
                var link = self._links.Item(idx);
                if (link && link.Enabled) {
                    link.Visited = true;
                    self._activeLink = link;
                    self._raise('LinkClicked', { Link: link, LinkData: link.LinkData, Button: e.button });
                    if (link.Description) {
                        try { root.open(link.Description, '_blank'); } catch (err) { }
                    }
                    self._refreshContent();
                }
            } else if (self._links.Count === 0 && self._area[1] > 0) {
                self._visited = true;
                self._raise('LinkClicked', { Link: null, LinkData: null, Button: e.button });
                self._refreshContent();
            }
        });

        if (opts) {
            for (var k in opts) {
                if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
                if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
            }
        }
        this._refreshContent();
    }

    LinkLabel.prototype = Object.create(Control.prototype);
    LinkLabel.prototype.constructor = LinkLabel;
    Control.Events(LinkLabel.prototype);
    var P = LinkLabel.prototype;

    P._refreshContent = function () {
        var el = this._el;
        if (!el) return;
        el.className = 'wf wf-lnk ' + this._behavior.toLowerCase() + (!this._enabled ? ' disabled' : '');
        el.innerHTML = '';

        var txt = this._text || '';
        var links = this._links._list;

        el.style.setProperty('--wf-lnk-color', this._colors.link);
        el.style.setProperty('--wf-lnk-disabled', this._colors.disabled);

        if (links.length === 0) {
            var st = this._area[0], len = this._area[1];
            if (len > 0 && st + len <= txt.length) {
                var before = txt.substring(0, st);
                var mid = txt.substring(st, st + len);
                var after = txt.substring(st + len);

                if (before) el.appendChild(document.createTextNode(before));
                var a = document.createElement('span');
                a.className = 'wf-sublnk';
                a.setAttribute('data-link-idx', '0');
                a.textContent = mid;
                a.style.color = (this._visited && this._useVisited) ? this._colors.visited : this._colors.link;
                el.appendChild(a);
                if (after) el.appendChild(document.createTextNode(after));
            } else {
                var fullA = document.createElement('a');
                fullA.className = 'wf-sublnk';
                fullA.setAttribute('data-link-idx', '0');
                fullA.textContent = txt;
                fullA.style.color = (this._visited && this._useVisited) ? this._colors.visited : this._colors.link;
                el.appendChild(fullA);
            }
        } else {
            var lastIdx = 0;
            for (var i = 0; i < links.length; i++) {
                var l = links[i];
                if (l.Start > lastIdx) {
                    el.appendChild(document.createTextNode(txt.substring(lastIdx, l.Start)));
                }
                var subTxt = txt.substring(l.Start, l.Start + l.Length);
                var span = document.createElement('span');
                span.className = 'wf-sublnk';
                span.setAttribute('data-link-idx', String(i));
                span.textContent = subTxt;
                span.style.color = (l.Visited && this._useVisited) ? this._colors.visited : this._colors.link;
                if (!l.Enabled) span.style.color = this._colors.disabled;
                el.appendChild(span);
                lastIdx = l.Start + l.Length;
            }
            if (lastIdx < txt.length) {
                el.appendChild(document.createTextNode(txt.substring(lastIdx)));
            }
        }

        el.style.justifyContent = this._align === 'Center' ? 'center' : (this._align === 'Right' ? 'flex-end' : 'flex-start');
    };

    Object.defineProperties(P, {
        Text: {
            get: function () { return this._text; },
            set: function (v) { this._text = v == null ? '' : String(v); this._refreshContent(); }
        },
        TextAlign: {
            get: function () { return this._align; },
            set: function (v) { this._align = ['Left', 'Center', 'Right'].indexOf(v) >= 0 ? v : 'Left'; this._refreshContent(); }
        },
        LinkBehavior: {
            get: function () { return this._behavior; },
            set: function (v) { this._behavior = normBehavior(v); this._refreshContent(); }
        },
        LinkVisited: {
            get: function () { return this._visited; },
            set: function (v) { this._visited = !!v; this._refreshContent(); }
        },
        UseVisitedLinkColor: {
            get: function () { return this._useVisited; },
            set: function (v) { this._useVisited = !!v; this._refreshContent(); }
        },
        LinkArea: {
            get: function () { return this._area; },
            set: function (v) {
                if (Array.isArray(v) && v.length >= 2) {
                    this._area = [+v[0] || 0, +v[1] || 0];
                    this._refreshContent();
                }
            }
        },
        Links: { get: function () { return this._links; } },
        LinkColor: {
            get: function () { return this._colors.link; },
            set: function (v) { this._colors.link = v || 'blue'; this._refreshContent(); }
        },
        VisitedLinkColor: {
            get: function () { return this._colors.visited; },
            set: function (v) { this._colors.visited = v || 'purple'; this._refreshContent(); }
        },
        ActiveLinkColor: {
            get: function () { return this._colors.active; },
            set: function (v) { this._colors.active = v || 'red'; }
        },
        DisabledLinkColor: {
            get: function () { return this._colors.disabled; },
            set: function (v) { this._colors.disabled = v || 'gray'; this._refreshContent(); }
        }
    });

    root.LinkLabel = LinkLabel;
    if (typeof module !== 'undefined' && module.exports) module.exports = LinkLabel;
})(typeof window !== 'undefined' ? window : this);