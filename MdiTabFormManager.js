/*!
 * MdiTabFormManager.js - web port of Infragistics.Win.UltraWinTabbedMdi.UltraTabbedMdiManager
 * Shows the MDI child forms (or any control / DOM element) as tabs. Load Control.js FIRST.
 *
 *   var mgr = new MdiTabFormManager({ MdiParent: frmMain, TabStyle: 'Standard', ShowCloseButton: true });
 *   var tab = mgr.AddForm(new contProduitStat(), 'Produit');          // child = Form | UserControl | Control | HTMLElement
 *   mgr.on('TabActivated', function (sender, e) { console.log(e.Tab.Text); });
 *   mgr.on('TabClosing',   function (sender, e) { if (dirty) e.Cancel = true; });
 *   tab.Activate();  tab.Close();  mgr.TabFromForm(child);  mgr.CloseAllTabs();
 *
 * MdiTabFormManager (is a Control: Dock, Width, Height ... AppendTo(host), Dispose())
 *   MdiParent        Control | DOM element | selector the manager is put in (Dock = 'Fill'); get returns the parent control
 *   AddForm(child, text?, opts?)  / Tabs.Add(child, text, opts) -> MdiTab. The same child (or the same Key) is activated, not added twice.
 *                    opts: { Text, Image, ToolTip, Key, Tag, Group (index | MdiTabGroup), Activate (default true), AllowClose }
 *   TabFromForm(child), TabFromKey(key), ActiveTab (get / set), Tabs (all tabs, display order), TabGroups (MdiTabGroup[])
 *   ActivateTab(tab), ActivateNext(), ActivatePrevious(), CloseTab(tab), CloseAllTabs(), CloseOtherTabs(tab)
 *   NewHorizontalTabGroup(tab?) / NewVerticalTabGroup(tab?)   the tab goes to a new group beside / under its group
 *   Settings (the Infragistics TabGroupSettings / TabSettings names are accepted as options):
 *   TabStyle         'Standard' | 'Flat' | 'Rounded'            TabPosition       'Top' | 'Bottom'
 *   ShowCloseButton  true       CloseButtonLocation 'Tab' | 'TabGroup' | 'None'     TabCloseAction 'Close' | 'Hide'
 *   ShowTabListButton true      TabSizing 'AutoSize' | 'Fixed'   TabWidth 140   TabMinWidth 60   TabMaxWidth 220   TabHeight 26
 *   AllowDrag true (drag a tab to reorder it / move it to another group)     MiddleClickClose true     ShowTabContextMenu true
 *   RightToLeft false (Arabic labels, mirrored)     Labels { close, closeAll, ... } overrides the texts     PrepareChild fn(child)
 *   Events (fn(sender, e)): InitializeTab {Tab}  TabActivating {Tab, PreviousTab, Cancel}  TabActivated {Tab, PreviousTab}
 *     TabClosing {Tab, CloseReason, Cancel}  TabClosed {Tab, CloseReason}  TabMoved {Tab, TabGroup, Index}
 *     TabGroupCreated {TabGroup}  TabGroupDisposed {TabGroup}  TabDoubleClick {Tab}  TabContextMenuOpening {Tab, Items, Cancel}
 *   Keys: Ctrl+Tab / Ctrl+Shift+Tab (next / previous tab), Ctrl+F4 (close the active tab) - a browser may keep these for itself;
 *         with the focus on a tab strip: Left / Right / Home / End / Delete.
 *
 * MdiTab    Text, Image (url | data: uri | short text), ToolTip, Key, Tag, Visible, BackColor, ForeColor, Index, TabGroup, Active,
 *           Form (the child), Settings { AllowClose, TabCloseAction, ShowCloseButton }, Manager,
 *           Activate(), Close(reason?), MoveToNewGroup('Horizontal'|'Vertical'), MoveToGroup(group, index?), MoveToNextGroup(), MoveToPreviousGroup()
 * MdiTabGroup  Index, Tabs, ActiveTab, Size (relative weight), Manager
 *
 * A child that has Close() (a Form) is closed through it, so its own FormClosing / FormClosed logic can veto the closing; a child that
 * is disposed or closes itself (Disposed / FormClosed events) loses its tab by itself. A child control is Dock = 'Fill'ed in the tab area.
 */
(function (root)
{
    'use strict';

    var Control = root.Control;
    if (typeof Control !== 'function') throw new Error('MdiTabFormManager.js: Control.js must be loaded first');

    var CSS = [
        '.mdi-mgr{background:var(--wf-surface);color:var(--wf-text);overflow:hidden;--mdi-th:26px;--mdi-tmin:60px;--mdi-tmax:220px;--mdi-tw:140px;--mdi-accent:var(--wf-accent,#0078d7)}',
        '.mdi-area{position:absolute;left:0;top:0;right:0;bottom:0;display:flex}',
        '.mdi-area.mdi-h{flex-direction:row}.mdi-area.mdi-v{flex-direction:column}',
        '.mdi-group{position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden;background:var(--wf-surface);color:var(--wf-text)}',
        '.mdi-group.mdi-pos-bottom{flex-direction:column-reverse}',
        '.mdi-split{flex:0 0 5px;background:var(--wf-surface);z-index:2}',
        '.mdi-h>.mdi-split{cursor:col-resize}.mdi-v>.mdi-split{cursor:row-resize}',
        '.mdi-split:hover,.mdi-split.mdi-sdrag{background:var(--mdi-accent)}',
        '.mdi-strip{flex:0 0 auto;display:flex;align-items:stretch;background:var(--wf-surface);user-select:none;-webkit-user-select:none;outline:none;position:relative;min-width:0}',
        '.mdi-pos-top>.mdi-strip{border-bottom:1px solid var(--wf-border,#adadad)}.mdi-pos-bottom>.mdi-strip{border-top:1px solid var(--wf-border,#adadad)}',
        '.mdi-strip:focus-visible{box-shadow:inset 0 0 0 1px var(--mdi-accent)}',
        '.mdi-vp{flex:1 1 auto;min-width:0;overflow:hidden;display:flex}',
        '.mdi-tabs{position:relative;display:flex;flex:0 0 auto;align-items:flex-end;gap:2px;padding:3px 4px 0}',
        '.mdi-pos-bottom .mdi-tabs{align-items:flex-start;padding:0 4px 3px}',
        '.mdi-tab{position:relative;display:flex;align-items:center;gap:6px;flex:0 0 auto;height:var(--mdi-th);padding:0 6px 0 10px;box-sizing:border-box;',
        'min-width:var(--mdi-tmin);max-width:var(--mdi-tmax);cursor:default;color:var(--wf-text,#000);background:var(--wf-button,#e1e1e1);',
        'border:1px solid var(--wf-border,#adadad);border-bottom:0;white-space:nowrap}',
        '.mdi-fixed .mdi-tab{width:var(--mdi-tw);min-width:0;max-width:none}',
        '.mdi-pos-bottom .mdi-tab{border-bottom:1px solid var(--wf-border,#adadad);border-top:0}',
        '.mdi-tab:hover{background:var(--wf-hover,#e5f1fb);color:var(--wf-text,#000)}',
        '.mdi-tab.active{background:var(--wf-surface);color:var(--wf-text,#000);margin-bottom:-1px;height:calc(var(--mdi-th) + 1px);z-index:1;font-weight:600;}',
        '.mdi-pos-bottom .mdi-tab.active{margin-bottom:0;margin-top:-1px}',
        '.mdi-gactive .mdi-tab.active{box-shadow:inset 0 2px 0 var(--mdi-accent)}',
        '.mdi-pos-bottom.mdi-gactive .mdi-tab.active{box-shadow:inset 0 -2px 0 var(--mdi-accent)}',
        '.mdi-s-rounded .mdi-tab{border-radius:7px 7px 0 0}.mdi-s-rounded.mdi-pos-bottom .mdi-tab,.mdi-pos-bottom.mdi-s-rounded .mdi-tab{border-radius:0 0 7px 7px}',
        '.mdi-s-flat .mdi-tab{background:transparent;border-color:transparent}',
        '.mdi-s-flat .mdi-tab:hover{background:var(--wf-hover,#e5f1fb)}',
        '.mdi-s-flat .mdi-tab.active{background:var(--wf-surface);border-color:var(--wf-border,#adadad)}',
        '.mdi-ti{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;font-size:13px;line-height:16px}',
        '.mdi-ti img{width:16px;height:16px;display:block}',
        '.mdi-tt{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}',
        '.mdi-tx,.mdi-nb{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;padding:0}',
        '.mdi-tx{width:16px;height:16px;border-radius:3px;font-size:11px;line-height:1;opacity:.65}',
        '.mdi-tab.active .mdi-tx,.mdi-tab:hover .mdi-tx{opacity:1}',
        '.mdi-tx:hover{background:#e81123;color:#fff}',
        '.mdi-nb{width:22px;font-size:10px;color:var(--wf-text,#000)}.mdi-nb:hover{background:var(--wf-hover,#e5f1fb)}',
        '.mdi-nb[disabled]{opacity:.35;cursor:default;background:transparent}',
        '.mdi-prev,.mdi-next,.mdi-list{display:none}.mdi-over .mdi-prev,.mdi-over .mdi-next{display:inline-flex}',
        '.mdi-over.mdi-wlist .mdi-list{display:inline-flex}',
        '.mdi-rtl .mdi-prev,.mdi-rtl .mdi-next{transform:scaleX(-1)}',
        '.mdi-closeact{display:none}.mdi-cact .mdi-closeact{display:inline-flex}',
        '.mdi-content{position:relative;flex:1 1 auto;min-width:0;min-height:0;overflow:auto;background:var(--wf-surface,#fff);color:var(--wf-text,#000)}',
        '.mdi-ghost{position:fixed;z-index:100000;pointer-events:none;opacity:.85;box-shadow:0 2px 8px rgba(0,0,0,.35);font:12px "Segoe UI",Tahoma,Arial,sans-serif;color:var(--wf-text,#000)}',
        '.mdi-mark{position:fixed;z-index:100001;pointer-events:none;width:3px;background:var(--mdi-accent)}',
        '.mdi-dragging,.mdi-dragging *{cursor:grabbing!important}',
        '.mdi-menu{position:fixed;z-index:100002;min-width:210px;padding:3px 0;background:var(--wf-surface);color:var(--wf-text);border:1px solid var(--wf-border,#adadad);box-shadow:2px 3px 8px rgba(0,0,0,.3);font:12px "Segoe UI",Tahoma,Arial,sans-serif}',
        '.mdi-mi{padding:5px 26px 5px 24px;cursor:default;white-space:nowrap;display:flex;gap:8px}',
        '.mdi-mi:hover{background:var(--wf-hover,#e5f1fb)}.mdi-mi.dis{color:var(--wf-text-muted,#999);pointer-events:none}',
        '.mdi-mi .ck{width:12px;margin-left:-16px}',
        '.mdi-sep{height:1px;margin:3px 2px;background:var(--wf-border,#d7d7d7)}',
    ].join('');
    var cssDone = false;

    function injectCss()
    {
        if (cssDone) return;
        cssDone = true;
        var s = document.createElement('style');
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    var LABELS = {
        ltr:
        {
            close: 'Fermer',
            closeOthers: 'Fermer les autres onglets',
            closeAll: 'Tout fermer',
            newH: 'Nouveau groupe d\'onglets horizontal',
            newV: 'Nouveau groupe d\'onglets vertical',
            moveNext: 'D\u00e9placer vers le groupe suivant',
            movePrev: 'D\u00e9placer vers le groupe pr\u00e9c\u00e9dent',
            list: 'Liste des onglets',
            prev: 'Pr\u00e9c\u00e9dent',
            next: 'Suivant',
            closeActive: 'Fermer l\'onglet actif',
            untitled: 'Sans titre'
        },
        rtl:
        {
            close: '\u0625\u063a\u0644\u0627\u0642',
            closeOthers: '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0628\u0627\u0642\u064a',
            closeAll: '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0643\u0644',
            newH: '\u0645\u062c\u0645\u0648\u0639\u0629 \u062a\u0628\u0648\u064a\u0628 \u0623\u0641\u0642\u064a\u0629 \u062c\u062f\u064a\u062f\u0629',
            newV: '\u0645\u062c\u0645\u0648\u0639\u0629 \u062a\u0628\u0648\u064a\u0628 \u0639\u0645\u0648\u062f\u064a\u0629 \u062c\u062f\u064a\u062f\u0629',
            moveNext: '\u0646\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629',
            movePrev: '\u0646\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629',
            list: '\u0642\u0627\u0626\u0645\u0629 \u0639\u0644\u0627\u0645\u0627\u062a \u0627\u0644\u062a\u0628\u0648\u064a\u0628',
            prev: '\u0627\u0644\u0633\u0627\u0628\u0642',
            next: '\u0627\u0644\u062a\u0627\u0644\u064a',
            closeActive: '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062a\u0628\u0648\u064a\u0628 \u0627\u0644\u0646\u0634\u0637',
            untitled: '\u0628\u062f\u0648\u0646 \u0639\u0646\u0648\u0627\u0646'
        }
    };

    // ---------------------------------------------------------------- helpers
    function mk(tag, cls, parent)
    {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (parent) parent.appendChild(e);
        return e;
    }

    function pascal(o)
    {
        var r = {};
        Object.keys(o ||
        {}).forEach(function (k)
        {
            r[k.charAt(0).toUpperCase() + k.slice(1)] = o[k];
        });
        return r;
    }

    function isCtl(c)
    {
        return !!c && typeof c === 'object' && c.element instanceof Element && c.Controls && typeof c.PerformLayout === 'function';
    }

    function oneOf(v, list, d)
    {
        v = String(v == null ? '' : v).toLowerCase();
        for (var i = 0; i < list.length; i++)
            if (list[i].toLowerCase() === v) return list[i];
        return d;
    }

    function decorate(arr, members)
    {
        Object.keys(members).forEach(function (n)
        {
            Object.defineProperty(arr, n,
            {
                value: members[n],
                writable: true,
                configurable: true,
                enumerable: false
            });
        });
        return arr;
    }

    function countProp(arr)
    {
        Object.defineProperty(arr, 'Count',
        {
            get: function ()
            {
                return arr.length;
            },
            configurable: true,
            enumerable: false
        });
    }

    // ================================================================= MdiTab
    function MdiTab(mgr, child)
    {
        this._mgr = mgr;
        this._group = null;
        this._removed = false;
        this._closing = false;
        this._followChild = true;
        this._hs = [];
        this._kind = isCtl(child) ? 'control' : 'element';
        this.Form = child;
        this.text = '';
        this.image = '';
        this.tooltip = '';
        this.key = '';
        this.Tag = undefined;
        this.visible = true;
        this.backColor = '';
        this.foreColor = '';
        this.settings = {
            AllowClose: true,
            TabCloseAction: null,
            ShowCloseButton: null
        };
        this.el = null;
    }
    MdiTab.prototype._refresh = function ()
    {
        if (this._group && !this._removed) this._mgr._renderStrip(this._group);
    };
    MdiTab.prototype.Activate = function ()
    {
        return this._mgr.ActivateTab(this);
    };
    MdiTab.prototype.Close = function (reason)
    {
        console.log('MdiTab.prototype.Close');
        return this._mgr._closeTab(this, reason || 'ApplicationCode');

    };
    MdiTab.prototype.MoveToNewGroup = function (orientation)
    {
        return this._mgr._moveToNewGroup(this, orientation);
    };
    MdiTab.prototype.MoveToGroup = function (group, index)
    {
        return this._mgr._moveToGroup(this, group, index);
    };
    MdiTab.prototype.MoveToNextGroup = function ()
    {
        return this._mgr._moveToSibling(this, 1);
    };
    MdiTab.prototype.MoveToPreviousGroup = function ()
    {
        return this._mgr._moveToSibling(this, -1);
    };
    MdiTab.prototype.toString = function ()
    {
        return 'MdiTab: ' + this.text;
    };
    var tabToolTip = {
        get: function ()
        {
            return this.tooltip;
        },
        set: function (v)
        {
            this.tooltip = v == null ? '' : String(v);
            this._refresh();
        }
    };
    Object.defineProperties(MdiTab.prototype,
    {
        Text:
        {
            get: function ()
            {
                return this.text;
            },
            set: function (v)
            {
                this.text = v == null ? '' : String(v);
                this._followChild = false;
                this._refresh();
            }
        },
        Image:
        {
            get: function ()
            {
                return this.image;
            },
            set: function (v)
            {
                this.image = v == null ? '' : String(v);
                this._refresh();
            }
        },
        ToolTip: tabToolTip,
        ToolTipText: tabToolTip,
        Key:
        {
            get: function ()
            {
                return this.key;
            },
            set: function (v)
            {
                this.key = v == null ? '' : String(v);
            }
        },
        Visible:
        {
            get: function ()
            {
                return this.visible;
            },
            set: function (v)
            {
                this._mgr._setTabVisible(this, !!v);
            }
        },
        BackColor:
        {
            get: function ()
            {
                return this.backColor;
            },
            set: function (v)
            {
                this.backColor = v == null ? '' : String(v);
                this._refresh();
            }
        },
        ForeColor:
        {
            get: function ()
            {
                return this.foreColor;
            },
            set: function (v)
            {
                this.foreColor = v == null ? '' : String(v);
                this._refresh();
            }
        },
        Settings:
        {
            get: function ()
            {
                return this.settings;
            }
        },
        Control:
        {
            get: function ()
            {
                return this.Form;
            }
        },
        Index:
        {
            get: function ()
            {
                return this._group ? this._group.tabs.indexOf(this) : -1;
            }
        },
        TabGroup:
        {
            get: function ()
            {
                return this._group;
            }
        },
        Manager:
        {
            get: function ()
            {
                return this._mgr;
            }
        },
        Active:
        {
            get: function ()
            {
                return this._mgr._active === this;
            }
        }
    });

    // ================================================================= MdiTabGroup
    function MdiTabGroup(mgr)
    {
        this._mgr = mgr;
        this._active = null;
        this._mru = [];
        this.size = 1;
        var tabs = [],
            group = this;
        countProp(tabs);
        decorate(tabs,
        {
            Add: function (child, text, opts)
            {
                if (text !== null && typeof text === 'object')
                {
                    opts = text;
                    text = undefined;
                }
                opts = pascal(opts);
                opts.Group = group;
                return mgr._addTab(child, text, opts);
            }
        });
        this.tabs = tabs;
    }
    Object.defineProperties(MdiTabGroup.prototype,
    {
        Index:
        {
            get: function ()
            {
                return this._mgr._groups.indexOf(this);
            }
        },
        Tabs:
        {
            get: function ()
            {
                return this.tabs;
            }
        },
        ActiveTab:
        {
            get: function ()
            {
                return this._active;
            },
            set: function (t)
            {
                if (t && t._group === this) this._mgr.ActivateTab(t);
            }
        },
        Size:
        {
            get: function ()
            {
                return this.size;
            },
            set: function (v)
            {
                v = +v;
                if (v > 0)
                {
                    this.size = v;
                    this._mgr._applySizes();
                }
            }
        },
        Manager:
        {
            get: function ()
            {
                return this._mgr;
            }
        }
    });

    // ================================================================= MdiTabFormManager
    function MdiTabFormManager(opts)
    {
        if (!(this instanceof MdiTabFormManager)) return new MdiTabFormManager(opts);
        injectCss();
        Control.call(this, 'div', 'mdi-mgr');
        var self = this;
        this._width = 400;
        this._height = 300;
        this._applyRect();
        this._groups = [];
        countProp(this._groups);
        this._active = null;
        this._tabStyle = 'Standard';
        this._tabPos = 'Top';
        this._showClose = true;
        this._closeLoc = 'Tab';
        this._closeAction = 'Close';
        this._showList = true;
        this._sizing = 'AutoSize';
        this._tabW = 140;
        this._tabMin = 60;
        this._tabMax = 220;
        this._tabH = 26;
        this._allowDrag = true;
        this._midClose = true;
        this._ctxMenu = true;
        this._rtl = false;
        this._labels = {};
        this._orient = 'Horizontal';
        this.PrepareChild = null;
        this._area = mk('div', 'mdi-area mdi-h', this.element);
        this.element.setAttribute('role', 'application');
        this.element.addEventListener('keydown', function (e)
        {
            self._onKey(e);
        });
        this._bindClose();
        this._newGroup(0);
        this._restyle();

        var o = pascal(opts),
            parent = o.MdiParent;
        delete o.MdiParent;
        this._applyOptions(o);
        if (parent) this.MdiParent = parent;
    }
    Control.Extend(MdiTabFormManager);
    var P = MdiTabFormManager.prototype;

    P._L = function ()
    {
        var b = this._rtl ? LABELS.rtl : LABELS.ltr,
            o = this._labels,
            r = {};
        Object.keys(b).forEach(function (k)
        {
            r[k] = o && o[k] != null ? o[k] : b[k];
        });
        return r;
    };

    // ---------------------------------------------------------------- settings
    function setting(name, field, norm)
    {
        return {
            get: function ()
            {
                return this[field];
            },
            set: function (v)
            {
                this[field] = norm ? norm.call(this, v) : v;
                this._restyle();
            }
        };
    }
    var num = function (min, field)
    {
        return function (v)
        {
            v = Math.round(+v);
            return isNaN(v) ? this[field] : Math.max(min, v);
        };
    };
    Object.defineProperties(P,
    {
        TabStyle: setting('TabStyle', '_tabStyle', function (v)
        {
            return oneOf(v, ['Standard', 'Flat', 'Rounded'], 'Standard');
        }),
        TabPosition: setting('TabPosition', '_tabPos', function (v)
        {
            return oneOf(v, ['Top', 'Bottom'], 'Top');
        }),
        ShowCloseButton: setting('ShowCloseButton', '_showClose', function (v)
        {
            return !!v;
        }),
        CloseButtonLocation: setting('CloseButtonLocation', '_closeLoc', function (v)
        {
            return oneOf(v, ['Tab', 'TabGroup', 'None'], 'Tab');
        }),
        TabCloseAction: setting('TabCloseAction', '_closeAction', function (v)
        {
            return oneOf(v, ['Close', 'Hide'], 'Close');
        }),
        ShowTabListButton: setting('ShowTabListButton', '_showList', function (v)
        {
            return !!v;
        }),
        TabSizing: setting('TabSizing', '_sizing', function (v)
        {
            return oneOf(v, ['AutoSize', 'Fixed'], 'AutoSize');
        }),
        TabWidth: setting('TabWidth', '_tabW', num(30, '_tabW')),
        TabMinWidth: setting('TabMinWidth', '_tabMin', num(20, '_tabMin')),
        TabMaxWidth: setting('TabMaxWidth', '_tabMax', num(40, '_tabMax')),
        TabHeight: setting('TabHeight', '_tabH', num(16, '_tabH')),
        AllowDrag: setting('AllowDrag', '_allowDrag', function (v)
        {
            return !!v;
        }),
        MiddleClickClose: setting('MiddleClickClose', '_midClose', function (v)
        {
            return !!v;
        }),
        ShowTabContextMenu: setting('ShowTabContextMenu', '_ctxMenu', function (v)
        {
            return !!v;
        }),
        RightToLeft: setting('RightToLeft', '_rtl', function (v)
        {
            return !!v;
        }),
        Labels: setting('Labels', '_labels', function (v)
        {
            return v && typeof v === 'object' ? v :
            {};
        }),
        TabGroupOrientation:
        {
            get: function ()
            {
                return this._orient;
            },
            set: function (v)
            {
                this._orient = oneOf(v, ['Horizontal', 'Vertical'], 'Horizontal');
                this._restyle();
            }
        },
        MdiParent:
        {
            get: function ()
            {
                return this.Parent;
            },
            set: function (p)
            {
                if (typeof p === 'string')
                    p = document.querySelector(p);

                if (!p) return;

                var host = isCtl(p) ? p : Control.Root(p);

                host.Controls.Add(this);
                this.Dock = 'Fill';

                if (window.Theme && Theme.Inherit)
                {
                    Theme.Inherit(
                        document.documentElement,
                        host.element || host
                    );

                    Theme.Inherit(
                        host.element || host,
                        this.element
                    );
                }
            }
        },
        ActiveTab:
        {
            get: function ()
            {
                return this._active;
            },
            set: function (t)
            {
                if (t) this.ActivateTab(t);
            }
        },
        TabGroups:
        {
            get: function ()
            {
                return this._groups;
            }
        },
        Tabs:
        {
            get: function ()
            {
                return this._allTabs();
            }
        },
        TabCount:
        {
            get: function ()
            {
                return this._allTabs().length;
            }
        }
    });

    P._restyle = function ()
    {
        var el = this.element,
            self = this;
        el.classList.remove('mdi-s-standard', 'mdi-s-flat', 'mdi-s-rounded');
        el.classList.add('mdi-s-' + this._tabStyle.toLowerCase());
        el.classList.toggle('mdi-fixed', this._sizing === 'Fixed');
        el.classList.toggle('mdi-rtl', this._rtl);
        el.dir = this._rtl ? 'rtl' : 'ltr';
        el.style.setProperty('--mdi-th', this._tabH + 'px');
        el.style.setProperty('--mdi-tw', this._tabW + 'px');
        el.style.setProperty('--mdi-tmin', this._tabMin + 'px');
        el.style.setProperty('--mdi-tmax', Math.max(this._tabMax, this._tabMin) + 'px');
        this._area.className = 'mdi-area ' + (this._orient === 'Vertical' ? 'mdi-v' : 'mdi-h');
        if (this._groups) this._groups.forEach(function (g)
        {
            g.el.classList.toggle('mdi-pos-bottom', self._tabPos === 'Bottom');
            g.el.classList.toggle('mdi-pos-top', self._tabPos !== 'Bottom');
            g.strip.classList.toggle('mdi-wlist', self._showList);
            g.strip.classList.toggle('mdi-cact', self._closeLoc === 'TabGroup');
            var L = self._L();
            g.prev.title = L.prev;
            g.next.title = L.next;
            g.list.title = L.list;
            g.xAct.title = L.closeActive;
            self._renderStrip(g);
        });
    };

    // ---------------------------------------------------------------- groups
    P._newGroup = function (index)
    {
        var self = this,
            g = new MdiTabGroup(this);
        g.el = mk('div', 'mdi-group');
        g.strip = mk('div', 'mdi-strip', g.el);
        g.strip.tabIndex = 0;
        g.strip.setAttribute('role', 'tablist');
        g.prev = mk('button', 'mdi-nb mdi-prev', g.strip);
        g.prev.type = 'button';
        g.prev.textContent = '\u25C0';
        g.vp = mk('div', 'mdi-vp', g.strip);
        g.tabsEl = mk('div', 'mdi-tabs', g.vp);
        g.next = mk('button', 'mdi-nb mdi-next', g.strip);
        g.next.type = 'button';
        g.next.textContent = '\u25B6';
        g.list = mk('button', 'mdi-nb mdi-list', g.strip);
        g.list.type = 'button';
        g.list.textContent = '\u25BE';
        g.xAct = mk('button', 'mdi-nb mdi-closeact', g.strip);
        g.xAct.type = 'button';
        g.xAct.textContent = '\u2715';
        g.contentEl = mk('div', 'mdi-content', g.el);
        g.cc = new Control(null, null, g.contentEl); // layout engine (Dock / Anchor) of the child controls
        g.contentEl.style.position = 'relative';
        g.contentEl.addEventListener('pointerdown', function ()
        {
            if (g._active) self._setFocusGroup(g);
        }, true);

        g.prev.addEventListener('click', function ()
        {
            self._scrollStrip(g, -1);
        });
        g.next.addEventListener('click', function ()
        {
            self._scrollStrip(g, 1);
        });
        g.list.addEventListener('click', function ()
        {
            self._showTabList(g);
        });
        g.xAct.addEventListener('click', function ()
        {
            if (g._active)
                self._closeTab(g._active, 'UserClosing');
        });
        g.strip.addEventListener('pointerdown', function (e)
        {
            self._onStripDown(g, e);
        });
        g.strip.addEventListener('auxclick', function (e)
        {
            self._onStripAux(g, e);
        });
        g.strip.addEventListener('dblclick', function (e)
        {
            var t = self._tabAt(e.target);
            if (t) self._raise('TabDoubleClick',
            {
                Tab: t
            });
        });
        g.strip.addEventListener('contextmenu', function (e)
        {
            self._onStripMenu(g, e);
        });
        g.strip.addEventListener('keydown', function (e)
        {
            self._onStripKey(g, e);
        });
        g.vp.addEventListener('wheel', function (e)
        {
            if (g.strip.classList.contains('mdi-over'))
            {
                e.preventDefault();
                g.vp.scrollLeft += (e.deltaY || e.deltaX);
            }
        },
        {
            passive: false
        });
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function ()
        {
            self._updateOverflow(g);
        }).observe(g.strip);

        this._groups.splice(index == null || index < 0 ? this._groups.length : index, 0, g);
        this._layoutGroups();
        this._restyle();
        return g;
    };

    P._layoutGroups = function ()
    {
        var area = this._area,
            groups = this._groups;
        [].slice.call(area.children).forEach(function (c)
        {
            if (c.classList.contains('mdi-split')) area.removeChild(c);
        });
        groups.forEach(function (g, i)
        { // reorder only what moved (keeps the DOM state of the others)
            if (area.children[i] !== g.el) area.insertBefore(g.el, area.children[i] || null);
        });
        var self = this;
        groups.forEach(function (g, i)
        {
            if (i === 0) return;
            var sp = mk('div', 'mdi-split');
            sp.addEventListener('pointerdown', function (e)
            {
                self._splitDown(groups[i - 1], g, sp, e);
            });
            area.insertBefore(sp, g.el);
        });
        this._applySizes();
    };
    P._applySizes = function ()
    {
        this._groups.forEach(function (g)
        {
            g.el.style.flex = g.size + ' 1 0px';
        });
    };

    P._removeGroup = function (g)
    {
        var i = this._groups.indexOf(g);
        if (i < 0 || this._groups.length < 2) return;
        this._groups.splice(i, 1);
        if (g.el.parentNode) g.el.parentNode.removeChild(g.el);
        g.cc.Dispose();
        this._layoutGroups();
        this._raise('TabGroupDisposed',
        {
            TabGroup: g,
            Index: i
        });
    };

    P._splitDown = function (a, b, sp, e)
    {
        if (e.button !== 0) return;
        e.preventDefault();
        var self = this,
            vert = this._orient === 'Vertical',
            start = vert ? e.clientY : e.clientX;
        this._groups.forEach(function (g)
        {
            var r = g.el.getBoundingClientRect();
            g.size = Math.max(1, vert ? r.height : r.width);
        }); // sizes in px
        var sa = a.size,
            sb = b.size,
            min = 80,
            rtl = this._rtl && !vert;
        sp.classList.add('mdi-sdrag');
        var move = function (ev)
        {
            var d = (vert ? ev.clientY : ev.clientX) - start;
            if (rtl) d = -d;
            d = Math.max(min - sa, Math.min(sb - min, d));
            a.size = sa + d;
            b.size = sb - d;
            self._applySizes();
        };
        var up = function ()
        {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            sp.classList.remove('mdi-sdrag');
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    };

    // ---------------------------------------------------------------- tabs: lookup
    P._allTabs = function ()
    {
        var r = [];
        this._groups.forEach(function (g)
        {
            g.tabs.forEach(function (t)
            {
                r.push(t);
            });
        });
        var self = this;
        countProp(r);
        return decorate(r,
        {
            Add: function (child, text, opts)
            {
                return self._addTab(child, text, opts);
            },
            IndexOf: function (t)
            {
                return r.indexOf(t);
            },
            Contains: function (t)
            {
                return r.indexOf(t) >= 0;
            }
        });
    };
    P.TabFromForm = function (child)
    {
        var all = this._allTabs();
        for (var i = 0; i < all.length; i++)
            if (all[i].Form === child) return all[i];
        return null;
    };
    P.TabFromKey = function (key)
    {
        var all = this._allTabs();
        for (var i = 0; i < all.length; i++)
            if (all[i].key === String(key)) return all[i];
        return null;
    };
    P._tabAt = function (target)
    {
        var el = target && target.closest ? target.closest('.mdi-tab') : null;
        return el ? el.__mdiTab : null;
    };

    // ---------------------------------------------------------------- tabs: add
    P.AddForm = function (child, text, opts)
    {
        return this._addTab(child, text, opts);
    };
    P._addTab = function (child, text, opts)
    {
        if (text !== null && typeof text === 'object')
        {
            opts = text;
            text = undefined;
        }
        var o = pascal(opts);
        if (typeof child === 'string') child = document.querySelector(child);
        if (!child) throw new Error('MdiTabFormManager.AddForm: no child');
        var tab = this.TabFromForm(child);
        if (tab)
        {
            if (o.Activate !== false) this.ActivateTab(tab);
            return tab;
        }
        var key = o.Key != null ? String(o.Key) : '';
        if (key && this.TabFromKey(key)) throw new Error('MdiTabFormManager: a tab with the Key "' + key + '" already exists (use TabFromKey)');

        tab = new MdiTab(this, child);
        var L = this._L(),
            t = text != null ? text : o.Text;
        tab.text = t != null ? String(t) : (tab._kind === 'control' && child.Text ? String(child.Text) : (child.title || L.untitled));
        tab._followChild = t == null && tab._kind === 'control';
        tab.image = o.Image != null ? String(o.Image) : '';
        tab.tooltip = o.ToolTip != null ? String(o.ToolTip) : (o.ToolTipText != null ? String(o.ToolTipText) : '');
        tab.key = key;
        tab.Tag = o.Tag;
        if (o.AllowClose === false) tab.settings.AllowClose = false;

        var g = o.Group instanceof MdiTabGroup ? o.Group : (typeof o.Group === 'number' && this._groups[o.Group]) || this._focusGroup();
        this._prepare(child);
        tab._group = g;
        g.tabs.push(tab);
        this._mount(tab, g);
        this._hook(tab);
        this._raise('InitializeTab',
        {
            Tab: tab
        });
        this._syncVisibility(g);
        this._renderStrip(g);
        if (o.Activate !== false || !this._active) this.ActivateTab(tab);
        return tab;
    };
    P._focusGroup = function ()
    {
        return (this._active && this._active._group) || this._groups[this._groups.length - 1];
    };

    P._prepare = function (child)
    {
        if (typeof this.PrepareChild === 'function')
        {
            this.PrepareChild(child);
            return;
        }
        try
        { // a Form of the framework is shown without its own border / title bar
            if (isCtl(child))
            {
                if ('FormBorderStyle' in child) child.FormBorderStyle = 'None';
                if ('TopLevel' in child) child.TopLevel = false;
            }
        }
        catch (e)
        {
            /* not a form */
        }
    };
    P._mount = function (tab, g)
    {
        var c = tab.Form;
        if (tab._kind === 'control')
        {
            g.cc.Controls.Add(c);
            c.Dock = 'Fill';

            // FIX MDI THEME
            if (window.Theme)
            {

                const themeName =
                    document.documentElement.getAttribute('data-wf-theme');

                if (themeName)
                {
                    Theme.Apply(themeName, c.element);
                }
            }
            Theme.RefreshElement(c.element);
            // Forcer le recalcul des styles
            requestAnimationFrame(() =>
            {

                c.element.offsetHeight;

                c.element.querySelectorAll('*').forEach(el =>
                {
                    el.offsetHeight;
                });

            });
        }
        else
        {
            g.contentEl.appendChild(c);
            c.classList.add('mdi-child');
            // c.className = (c.className ? c.className + ' ' : '') + 'wf wf-ctl wf-panel';
            // c.style.position = 'absolute';
            // c.style.left = c.style.top = c.style.right = c.style.bottom = '0';
        }
    };
    P._hook = function (tab)
    { // the child changes its Text / closes itself
        var self = this,
            c = tab.Form;
        if (tab._kind !== 'control' || typeof c.on !== 'function') return;
        var onText = function ()
        {
            if (tab._followChild)
            {
                tab.text = c.Text;
                tab._refresh();
            }
        };
        var gone = function ()
        {
            self._removeTab(tab, tab._closeReason || 'FormClosed');
        };
        c.on('TextChanged', onText);
        c.on('Disposed', gone);
        c.on('FormClosed', gone);
        tab._hs = [
            ['TextChanged', onText],
            ['Disposed', gone],
            ['FormClosed', gone]
        ];
    };
    P._unhook = function (tab)
    {
        var c = tab.Form;
        if (tab._kind === 'control' && typeof c.off === 'function') tab._hs.forEach(function (h)
        {
            c.off(h[0], h[1]);
        });
        tab._hs = [];
    };
    P._showChild = function (tab, on)
    {
        if (tab._kind === 'control') tab.Form.Visible = on;
        else tab.Form.style.display = on ? '' : 'none';
    };
    P._syncVisibility = function (g)
    {
        var self = this;
        g.tabs.forEach(function (t)
        {
            self._showChild(t, t === g._active && t.visible);
        });
    };

    // ---------------------------------------------------------------- tabs: activation
    P.ActivateTab = function (tab)
    {
        return this._activate(tab, false);
    };
    P._activate = function (tab, force, keepFocus)
    {
        if (!tab || tab._removed || tab._mgr !== this || !tab.visible) return false;
        var g = tab._group,
            prev = this._active,
            same = prev === tab && g._active === tab;
        if (same && !force) return true;
        if (!same)
        {
            var e = {
                Tab: tab,
                PreviousTab: prev,
                Cancel: false
            };
            this._raise('TabActivating', e);
            if (e.Cancel) return false;
        }
        g._active = tab;
        g._mru = g._mru.filter(function (t)
        {
            return t !== tab;
        });
        g._mru.push(tab);
        this._active = tab;
        this._syncVisibility(g);
        this._markActive(g);
        this._updateFocusClass();
        if (!same)
        {
            this._raise('TabActivated',
            {
                Tab: tab,
                PreviousTab: prev
            });
            try
            {
                if (!keepFocus && tab._kind === 'control' && typeof tab.Form.Focus === 'function') tab.Form.Focus();
            }
            catch (x)
            {
                /* ignore */
            }
        }
        return true;
    };
    P._markActive = function (g)
    { // cheap: no re-render of the strip
        g.tabs.forEach(function (t)
        {
            if (!t.el) return;
            var a = g._active === t;
            t.el.classList.toggle('active', a);
            t.el.setAttribute('aria-selected', a ? 'true' : 'false');
        });
        g.xAct.disabled = !g._active || g._active.settings.AllowClose === false;
        if (g._active) this._reveal(g, g._active);
    };
    P._setFocusGroup = function (g)
    {
        if (g._active && this._active !== g._active) this.ActivateTab(g._active);
    };
    P._updateFocusClass = function ()
    {
        var a = this._active;
        this._groups.forEach(function (g)
        {
            g.el.classList.toggle('mdi-gactive', !!a && a._group === g);
        });
    };
    P._visibleTabs = function (g)
    {
        return g.tabs.filter(function (t)
        {
            return t.visible;
        });
    };
    P._cycle = function (dir)
    {
        var g = this._focusGroup();
        if (!g) return false;
        var v = this._visibleTabs(g);
        if (!v.length) return false;
        var i = v.indexOf(g._active);
        return this.ActivateTab(v[(i < 0 ? 0 : (i + dir + v.length) % v.length)]);
    };
    P.ActivateNext = function ()
    {
        return this._cycle(1);
    };
    P.ActivatePrevious = function ()
    {
        return this._cycle(-1);
    };

    P._setTabVisible = function (tab, v)
    {
        if (tab.visible === v || tab._removed) return;
        tab.visible = v;
        var g = tab._group;
        if (!v)
        {
            if (g._active === tab) this._pickNext(g, tab);
            else this._showChild(tab, false);
        }
        else if (!g._active) this.ActivateTab(tab);
        this._syncVisibility(g);
        this._renderStrip(g);
    };

    // ---------------------------------------------------------------- tabs: close / remove
    P.CloseTab = function (tab, reason)
    {
        console.log('P.CloseTab');
        return tab ? this._closeTab(tab, reason || 'ApplicationCode') : false;
    };
    P.CloseAllTabs = function ()
    {
        var all = this._allTabs().slice(),
            ok = true,
            self = this;
        all.forEach(function (t)
        {
            if (!self._closeTab(t, 'CloseAll')) ok = false;
        });
        return ok;
    };
    P.CloseOtherTabs = function (tab)
    {
        console.log('P.CloseOtherTabs');
        var self = this,
            ok = true;
        this._allTabs().slice().forEach(function (t)
        {
            if (t !== tab && !self._closeTab(t, 'CloseOthers')) ok = false;
        });
        return ok;
    };
    P._closeTab = function (tab, reason)
    {
        console.log('P._closeTab:637');
        if (tab._removed || tab._closing)
        {
            console.log('tab._removed || tab._closing');
            return false;
        }
        var e = {
            Tab: tab,
            CloseReason: reason,
            Cancel: false
        };
        this._raise('TabClosing', e);
        if (e.Cancel)
        {
            return false;
        }
        var action = tab.settings.TabCloseAction || this._closeAction;
        if (action === 'Hide')
        {
            this._setTabVisible(tab, false);
            this._raise('TabClosed',
            {
                Tab: tab,
                CloseReason: reason,
                Hidden: true
            });
            return true;
        }
        tab._closing = true;
        tab._closeReason = reason;
        var c = tab.Form;
        console.log('tb.Form: ' + c);
        try
        {
            if (tab._kind === 'control')
            {
                if (typeof c.Close === 'function')
                {
                    c.Close();
                    var done = tab._removed || c.IsDisposed || c._closed || c.Visible === false || c._shown === false;
                    if (!done)
                    {
                        console.log('done:' + done);
                        tab._closing = false;
                        return false;
                    }
                    else
                    {
                        console.log('done:' + done);
                    }
                }
                else
                {
                    if (typeof c.Dispose === 'function') c.Dispose();
                }
            }
            else
            {
                if (c.parentNode) c.parentNode.removeChild(c);
            }
        }
        catch (err)
        {
            tab._closing = false;
            throw err;
        }
        this._removeTab(tab, reason);
        return true;
    };
    P._pickNext = function (g, closing)
    {
        var self = this,
            idx = g.tabs.indexOf(closing),
            next = null;
        for (var i = g._mru.length - 1; i >= 0 && !next; i--)
        {
            var t = g._mru[i];
            if (t !== closing && t.visible && g.tabs.indexOf(t) >= 0) next = t;
        }
        if (!next)
        {
            var v = g.tabs.filter(function (t)
            {
                return t.visible && t !== closing;
            });
            next = v[Math.min(idx, v.length - 1)] || null;
        }
        if (next) this.ActivateTab(next);
        else
        {
            g._active = null;
            if (this._active === closing) this._active = null;
        }
        if (!next && this._active === null)
        { // look in the other groups
            for (var k = 0; k < this._groups.length; k++)
                if (this._groups[k]._active)
                {
                    this.ActivateTab(this._groups[k]._active);
                    break;
                }
        }
    };
    P._removeTab = function (tab, reason)
    {
        if (tab._removed) return;
        tab._removed = true;
        var g = tab._group;
        this._unhook(tab);
        if (g._active === tab) this._pickNext(g, tab); // the neighbour / last used tab takes over first
        var i = g.tabs.indexOf(tab);
        if (i >= 0) g.tabs.splice(i, 1);
        g._mru = g._mru.filter(function (t)
        {
            return t !== tab;
        });
        if (this._active === tab) this._active = null;
        if (tab.el && tab.el.parentNode) tab.el.parentNode.removeChild(tab.el);
        try
        { // still mounted (Hide-like closes): take it out of the tab area
            if (tab._kind === 'control' && !tab.Form.IsDisposed && tab.Form.Parent === g.cc) g.cc.Controls.Remove(tab.Form);
        }
        catch (e)
        {
            /* ignore */
        }
        if (!g.tabs.length && this._groups.length > 1)
        {
            var wasFocus = this._active === null;
            this._removeGroup(g);
            if (wasFocus)
                for (var k = 0; k < this._groups.length && !this._active; k++)
                    if (this._groups[k]._active) this.ActivateTab(this._groups[k]._active);
        }
        else this._renderStrip(g);
        this._updateFocusClass();
        this._raise('TabClosed',
        {
            Tab: tab,
            CloseReason: reason || 'ApplicationCode'
        });
    };

    // ---------------------------------------------------------------- tabs: move between groups
    P._moveToGroup = function (tab, g, index)
    {
        if (!tab || tab._removed || !g || this._groups.indexOf(g) < 0) return false;
        var from = tab._group,
            i = from.tabs.indexOf(tab);
        if (index == null || index < 0 || index > g.tabs.length) index = g.tabs.length;
        if (from === g)
        {
            if (i < index) index--;
            if (i === index) return true;
            g.tabs.splice(i, 1);
            g.tabs.splice(index, 0, tab);
            this._renderStrip(g);
            this._raise('TabMoved',
            {
                Tab: tab,
                TabGroup: g,
                Index: index
            });
            return true;
        }
        var wasActive = from._active === tab;
        from.tabs.splice(i, 1);
        from._mru = from._mru.filter(function (t)
        {
            return t !== tab;
        });
        if (wasActive)
        {
            from._active = null;
            this._pickGroupActive(from);
        }
        tab._group = g;
        g.tabs.splice(index, 0, tab);
        this._mount(tab, g);
        if (tab.el && tab.el.parentNode) tab.el.parentNode.removeChild(tab.el);
        if (!from.tabs.length && this._groups.length > 1) this._removeGroup(from);
        else
        {
            this._syncVisibility(from);
            this._renderStrip(from);
        }
        this._renderStrip(g);
        this._activate(tab, true);
        this._raise('TabMoved',
        {
            Tab: tab,
            TabGroup: g,
            Index: index
        });
        return true;
    };
    P._pickGroupActive = function (g)
    {
        var v = this._visibleTabs(g),
            mru = g._mru.filter(function (t)
            {
                return v.indexOf(t) >= 0;
            });
        g._active = mru.length ? mru[mru.length - 1] : (v[0] || null);
    };
    P._moveToSibling = function (tab, dir)
    {
        var i = this._groups.indexOf(tab._group) + dir;
        return this._groups[i] ? this._moveToGroup(tab, this._groups[i]) : false;
    };
    P._moveToNewGroup = function (tab, orientation)
    {
        if (!tab || tab._removed) return null;
        var from = tab._group;
        if (this._visibleTabs(from).length < 2) return null; // a group needs another tab to stay
        orientation = oneOf(orientation, ['Horizontal', 'Vertical'], 'Horizontal');
        if (orientation !== this._orient)
        {
            this._orient = orientation;
            this._restyle();
        }
        var g = this._newGroup(this._groups.indexOf(from) + 1);
        g.size = from.size = Math.max(0.01, from.size / 2);
        this._applySizes();
        this._raise('TabGroupCreated',
        {
            TabGroup: g
        });
        this._moveToGroup(tab, g);
        return g;
    };
    P.NewHorizontalTabGroup = function (tab)
    {
        return this._moveToNewGroup(tab || this._active, 'Horizontal');
    };
    P.NewVerticalTabGroup = function (tab)
    {
        return this._moveToNewGroup(tab || this._active, 'Vertical');
    };

    // ---------------------------------------------------------------- strip rendering
    P._renderStrip = function (g)
    {
        if (!g || !g.tabsEl) return;
        var self = this,
            L = this._L();
        g.tabsEl.textContent = '';
        g.tabs.forEach(function (t)
        {
            if (!t.visible)
            {
                t.el = null;
                return;
            }
            var el = mk('div', 'mdi-tab' + (g._active === t ? ' active' : ''), g.tabsEl);
            el.__mdiTab = t;
            t.el = el;
            el.setAttribute('role', 'tab');
            el.setAttribute('aria-selected', g._active === t ? 'true' : 'false');
            if (t.tooltip) el.title = t.tooltip;
            if (t.backColor) el.style.background = t.backColor;
            if (t.foreColor) el.style.color = t.foreColor;
            if (t.image)
            {
                var ic = mk('span', 'mdi-ti', el);
                if (/^(https?:|data:image|\/|\.\.?\/)|\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(t.image))
                {
                    var im = mk('img', '', ic);
                    im.src = t.image;
                    im.alt = '';
                    im.draggable = false;
                }
                else ic.textContent = t.image;
            }
            mk('span', 'mdi-tt', el).textContent = t.text;
            var show = self._showClose && self._closeLoc === 'Tab' && t.settings.AllowClose !== false &&
                (t.settings.ShowCloseButton == null ? true : t.settings.ShowCloseButton);
            if (show)
            {
                var x = mk('button', 'mdi-tx', el);
                x.type = 'button';
                x.tabIndex = -1;
                x.textContent = '\u2715';
                x.title = L.close;
                x.setAttribute('data-x', '1');
            }
        });
        g.xAct.disabled = !g._active || g._active.settings.AllowClose === false;
        this._updateOverflow(g);
        if (g._active && g._active.el) this._reveal(g, g._active);
    };
    P._updateOverflow = function (g)
    {
        if (!g.tabsEl) return;
        g.strip.classList.remove('mdi-over');
        var over = g.tabsEl.offsetWidth > g.vp.clientWidth + 1 && g.vp.clientWidth > 0;
        g.strip.classList.toggle('mdi-over', over);
    };
    P._reveal = function (g, tab)
    {
        if (!tab.el || !g.strip.classList.contains('mdi-over')) return;
        try
        {
            tab.el.scrollIntoView(
            {
                block: 'nearest',
                inline: 'nearest'
            });
        }
        catch (e)
        {
            /* old browser */
        }
    };
    P._scrollStrip = function (g, dir)
    {
        var d = dir * 160 * (this._rtl ? -1 : 1);
        if (g.vp.scrollBy) g.vp.scrollBy(
        {
            left: d,
            behavior: 'smooth'
        });
        else g.vp.scrollLeft += d;
    };

    // ---------------------------------------------------------------- strip events
    P._onStripDown = function (g, e)
    {
        var tx = e.target.closest ? e.target.closest('.mdi-tx') : null;
        var t = this._tabAt(e.target);
        if (!t || e.button !== 0) return;
        if (tx) return; // the close button handles its own click below
        this.ActivateTab(t);
        g.strip.focus(
        {
            preventScroll: true
        });
        if (this._allowDrag) this._startDrag(t, e);
    };
    P._onStripAux = function (g, e)
    {
        var t = this._tabAt(e.target);
        if (!t) return;
        if (e.button === 1 && this._midClose && t.settings.AllowClose !== false)
        {
            e.preventDefault();
            this._closeTab(t, 'UserClosing');
        }
    };
    P._onStripMenu = function (g, e)
    {
        var t = this._tabAt(e.target);
        if (!t || !this._ctxMenu) return;
        e.preventDefault();
        this.ActivateTab(t);
        var L = this._L(),
            self = this,
            many = this._visibleTabs(g).length > 1,
            idx = this._groups.indexOf(g);
        var items = [
        {
            Key: 'Close',
            Text: L.close,
            Enabled: t.settings.AllowClose !== false,
            Click: function ()
            {
                self._closeTab(t, 'UserClosing');
            }
        },
        {
            Key: 'CloseOthers',
            Text: L.closeOthers,
            Enabled: this._allTabs().length > 1,
            Click: function ()
            {
                self.CloseOtherTabs(t);
            }
        },
        {
            Key: 'CloseAll',
            Text: L.closeAll,
            Enabled: true,
            Click: function ()
            {
                self.CloseAllTabs();
            }
        },
        {
            Separator: true
        },
        {
            Key: 'NewHorizontal',
            Text: L.newH,
            Enabled: many,
            Click: function ()
            {
                self.NewHorizontalTabGroup(t);
            }
        },
        {
            Key: 'NewVertical',
            Text: L.newV,
            Enabled: many,
            Click: function ()
            {
                self.NewVerticalTabGroup(t);
            }
        },
        {
            Key: 'MoveNext',
            Text: L.moveNext,
            Enabled: idx < this._groups.length - 1,
            Click: function ()
            {
                t.MoveToNextGroup();
            }
        },
        {
            Key: 'MovePrevious',
            Text: L.movePrev,
            Enabled: idx > 0,
            Click: function ()
            {
                t.MoveToPreviousGroup();
            }
        }];
        var ev = {
            Tab: t,
            Items: items,
            Cancel: false
        };
        this._raise('TabContextMenuOpening', ev);
        if (!ev.Cancel && ev.Items.length) this._popup(ev.Items, e.clientX, e.clientY, t);
    };
    P._onStripKey = function (g, e)
    {
        var v = this._visibleTabs(g),
            i = v.indexOf(g._active),
            rtl = this._rtl,
            k = e.key;
        if (!v.length) return;
        if (k === 'ArrowRight' || k === 'ArrowLeft')
        {
            var d = (k === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
            this._activate(v[(i + d + v.length) % v.length], false, true);
            e.preventDefault();
        }
        else if (k === 'Home')
        {
            this._activate(v[0], false, true);
            e.preventDefault();
        }
        else if (k === 'End')
        {
            this._activate(v[v.length - 1], false, true);
            e.preventDefault();
        }
        else if (k === 'Delete' && g._active && g._active.settings.AllowClose !== false)
        {
            this._closeTab(g._active, 'UserClosing');
            e.preventDefault();
        }
    };
    P._onKey = function (e)
    {
        if (e.ctrlKey && e.key === 'Tab')
        {
            e.preventDefault();
            this._cycle(e.shiftKey ? -1 : 1);
        }
        else if (e.ctrlKey && e.key === 'F4')
        {
            var t = this._active;
            if (t && t.settings.AllowClose !== false)
            {
                e.preventDefault();
                this._closeTab(t, 'UserClosing');
            }
        }
    };

    // close button: a click (not a drag) on the x
    P._bindClose = function ()
    {
        var self = this;
        this.element.addEventListener('click', function (e)
        {
            var x = e.target.closest ? e.target.closest('.mdi-tx') : null;
            if (!x) return;
            var t = self._tabAt(x);
            if (t && t.settings.AllowClose !== false) self._closeTab(t, 'UserClosing');
        });
    };

    // ---------------------------------------------------------------- drag & drop of the tabs
    P._startDrag = function (tab, e)
    {
        var self = this,
            sx = e.clientX,
            sy = e.clientY,
            started = false,
            ghost = null,
            mark = null,
            target = null;
        var move = function (ev)
        {
            if (!started)
            {
                if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
                started = true;
                document.documentElement.classList.add('mdi-dragging');
                var r = tab.el.getBoundingClientRect();
                ghost = tab.el.cloneNode(true);
                ghost.className = 'mdi-tab active mdi-ghost';
                ghost.style.width = r.width + 'px';
                ghost.style.height = r.height + 'px';
                document.body.appendChild(ghost);
                mark = mk('div', 'mdi-mark', document.body);
                ghost._dx = sx - r.left;
                ghost._dy = sy - r.top;
            }
            ghost.style.left = (ev.clientX - ghost._dx) + 'px';
            ghost.style.top = (ev.clientY - ghost._dy) + 'px';
            target = self._dropTarget(ev.clientX, ev.clientY);
            if (target) self._autoScroll(target, ev.clientX);
            if (target)
            {
                mark.style.display = '';
                mark.style.left = (target.x - 1) + 'px';
                mark.style.top = target.top + 'px';
                mark.style.height = target.height + 'px';
            }
            else mark.style.display = 'none';
        };
        var end = function (ev, cancel)
        {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('keydown', key, true);
            if (!started) return;
            document.documentElement.classList.remove('mdi-dragging');
            if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
            if (mark && mark.parentNode) mark.parentNode.removeChild(mark);
            if (!cancel && target) self._moveToGroup(tab, target.group, target.index);
        };
        var up = function (ev)
        {
            end(ev, false);
        };
        var key = function (ev)
        {
            if (ev.key === 'Escape') end(ev, true);
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('keydown', key, true);
    };
    P._dropTarget = function (x, y)
    {
        for (var gi = 0; gi < this._groups.length; gi++)
        {
            var g = this._groups[gi],
                r = g.strip.getBoundingClientRect();
            if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
            var vp = g.vp.getBoundingClientRect(),
                rtl = this._rtl,
                els = [].slice.call(g.tabsEl.children);
            var beyondEnd = rtl ? x <= vp.left : x >= vp.right,
                beyondStart = rtl ? x >= vp.right : x <= vp.left; // over the scroll / list buttons
            var idx = g.tabs.length,
                mx = null;
            if (beyondEnd) mx = rtl ? vp.left : vp.right;
            else if (beyondStart && els.length)
            {
                idx = g.tabs.indexOf(els[0].__mdiTab);
                mx = rtl ? vp.right : vp.left;
            }
            else
            {
                for (var i = 0; i < els.length; i++)
                {
                    var b = els[i].getBoundingClientRect(),
                        mid = b.left + b.width / 2;
                    if (rtl ? x > mid : x < mid)
                    {
                        idx = g.tabs.indexOf(els[i].__mdiTab);
                        mx = rtl ? b.right : b.left;
                        break;
                    }
                }
                if (mx == null)
                {
                    var last = els[els.length - 1],
                        lb = last && last.getBoundingClientRect();
                    mx = lb ? (rtl ? lb.left : lb.right) : (rtl ? vp.right - 4 : vp.left + 4);
                }
            }
            mx = Math.max(vp.left, Math.min(vp.right, mx));
            return {
                group: g,
                index: idx,
                x: mx,
                top: r.top,
                height: r.height,
                vp: vp
            };
        }
        return null;
    };
    P._autoScroll = function (t, x)
    { // dragging near the edge of a scrolled strip scrolls it
        if (!t.group.strip.classList.contains('mdi-over')) return;
        var edge = 36,
            step = 18;
        if (x < t.vp.left + edge) t.group.vp.scrollLeft -= step;
        else if (x > t.vp.right - edge) t.group.vp.scrollLeft += step;
    };

    // ---------------------------------------------------------------- popup menus (tab context menu, tab list)
    P._popup = function (items, x, y, tab)
    {
        this._closeMenu();
        var self = this,
            m = mk('div', 'mdi-menu', document.body);
        m.dir = this._rtl ? 'rtl' : 'ltr';
        items.forEach(function (it)
        {
            if (it.Separator)
            {
                mk('div', 'mdi-sep', m);
                return;
            }
            var d = mk('div', 'mdi-mi' + (it.Enabled === false ? ' dis' : ''), m);
            mk('span', 'ck', d).textContent = it.Checked ? '\u2713' : '';
            mk('span', '', d).textContent = it.Text;
            d.addEventListener('click', function ()
            {
                self._closeMenu();
                if (typeof it.Click === 'function') it.Click(tab || null);
            });
        });
        var w = m.offsetWidth,
            h = m.offsetHeight;
        m.style.left = Math.max(0, Math.min(x, window.innerWidth - w - 2)) + 'px';
        m.style.top = Math.max(0, Math.min(y, window.innerHeight - h - 2)) + 'px';
        var close = function (e)
        {
            if (e && e.type === 'pointerdown' && m.contains(e.target)) return;
            if (e && e.type === 'keydown' && e.key !== 'Escape') return;
            self._closeMenu();
        };
        this._menu = {
            el: m,
            close: close
        };
        setTimeout(function ()
        {
            if (self._menu && self._menu.el === m)
            {
                document.addEventListener('pointerdown', close, true);
                document.addEventListener('keydown', close, true);
                window.addEventListener('blur', close);
                window.addEventListener('resize', close);
            }
        }, 0);
    };
    P._closeMenu = function ()
    {
        var mn = this._menu;
        if (!mn) return;
        this._menu = null;
        document.removeEventListener('pointerdown', mn.close, true);
        document.removeEventListener('keydown', mn.close, true);
        window.removeEventListener('blur', mn.close);
        window.removeEventListener('resize', mn.close);
        if (mn.el.parentNode) mn.el.parentNode.removeChild(mn.el);
    };
    P._showTabList = function (g)
    {
        var self = this,
            r = g.list.getBoundingClientRect();
        var items = this._visibleTabs(g).map(function (t)
        {
            return {
                Text: t.text,
                Checked: g._active === t,
                Enabled: true,
                Click: function ()
                {
                    self.ActivateTab(t);
                    self._reveal(g, t);
                }
            };
        });
        if (items.length) this._popup(items, this._rtl ? r.right - 210 : r.left, r.bottom);
    };

    // ---------------------------------------------------------------- life cycle
    P.Dispose = function ()
    {
        if (this._disposed) return;
        this._closeMenu();
        this._allTabs().slice().forEach(function (t)
        {
            try
            {
                if (t._kind === 'control' && typeof t.Form.Dispose === 'function') t.Form.Dispose();
            }
            catch (e)
            {
                /* ignore */
            }
        });
        Control.prototype.Dispose.call(this);
    };

    MdiTabFormManager.MdiTab = MdiTab;
    MdiTabFormManager.MdiTabGroup = MdiTabGroup;
    root.MdiTabFormManager = MdiTabFormManager;
    root.MdiTab = root.MdiTab || MdiTab;
    if (typeof module !== 'undefined' && module.exports) module.exports = MdiTabFormManager;
})(typeof window !== 'undefined' ? window : this);