/*!
 * Form.js - WinForms Form: a window with a title bar, drag, resize, modal dialogs. Needs Control.js.
 *
 *   var f = new Form({ Text: 'Clients', ClientSize: { Width: 640, Height: 400 }, StartPosition: 'CenterScreen' });
 *   f.MainMenuStrip = ms; f.Controls.Add(ms);                 // MenuStrip docked on top
 *   f.Controls.Add(panel);                                    // controls use Dock / Anchor inside the client area
 *   f.on('Load', ...); f.on('FormClosing', function (s, e) { e.Cancel = !confirm('Fermer ?'); });
 *   f.Show();                                                 // or: var r = await f.ShowDialog();  ('OK', 'Cancel' ...)
 *   f.Close();
 *
 * Embedded form (like TopLevel = false in WinForms): panel.Controls.Add(form) with FormBorderStyle = 'None'
 * and Dock = 'Fill' shows the form inside a panel / tab page instead of floating over the page.
 *
 * Properties: Text, Icon (image URL or a character / emoji), ShowIcon, FormBorderStyle ('Sizable' | 'FixedSingle' |
 *   'FixedDialog' | 'FixedToolWindow' | 'SizableToolWindow' | 'None'), ControlBox, MinimizeBox, MaximizeBox,
 *   WindowState ('Normal' | 'Minimized' | 'Maximized'), StartPosition ('WindowsDefaultLocation' | 'CenterScreen' |
 *   'CenterParent' | 'Manual'), TopMost, Opacity, TopLevel, ClientSize {Width,Height}, Width / Height (outer size),
 *   MinimumSize {Width,Height}, MainMenuStrip, AcceptButton / CancelButton (any object with PerformClick()),
 *   DialogResult (setting it closes a modal form), Owner, Modal
 * Methods: Show([owner]), ShowDialog([owner]) -> Promise of the DialogResult, Hide(), Close(), Activate(),
 *   CenterToScreen(), CenterToParent()
 * Events: Load, Shown, FormClosing (e.Cancel, e.CloseReason), FormClosed, Activated, Resize
 */
/*!
 * Form.js - WinForms Form avec support de IsMdiContainer et conteneur racine.
 */
(function (root)
{
    'use strict';
    var Control = root.Control;
    if (!Control) throw new Error('Form.js needs Control.js to be loaded first');
    var TITLE_H = 30,
        TOOL_H = 22;
    var zTop = 1000,
        cascade = 0;

    Control.InjectCss([
        '.wf-form{display:flex;flex-direction:column;background:var(var(--wf-surface),var(--wf-surface,#f0f0f0));color:var(--form-fg,var(--wf-text,#000));border:1px solid var(--form-bc,var(--wf-window-border,#888));',
        'box-shadow:0 4px 18px var(--form-shadow,var(--wf-shadow,rgba(0,0,0,.35)))}',
        '.wf-ctl.wf-form.top{position:fixed}',
        '.wf-ctl.wf-form.mdi-container{position:relative;width:100%;height:100%;overflow:hidden;border:0;box-shadow:none}',
        '.wf-form.nob,.wf-form.max{border:0;box-shadow:none}',
        '.wf-f-t{flex:none;display:flex;align-items:center;height:' + TITLE_H + 'px;background:var(--form-t-bg,var(--wf-title,#ffffff));color:var(--form-t-fg,var(--wf-text,#000));user-select:none;cursor:default}',
        '.wf-f-i{flex:none;display:flex;align-items:center;justify-content:center;width:16px;height:16px;margin:0 6px 0 8px;font-size:14px}',
        '.wf-f-i img{width:16px;height:16px}',
        '.wf-f-x{flex:1;min-width:0;padding-inline-start:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.wf-f-b{display:flex;flex:none;height:100%}',
        '.wf-f-b button{width:46px;height:100%;border:0;background:transparent;font:inherit;font-size:13px;color:inherit;cursor:default}',
        '.wf-f-b button:hover{background:var(--wf-hover,#e5e5e5)}',
        '.wf-f-b button.cl:hover{background:var(--wf-close,#e81123);color:#fff}',
        '.wf-f-c{position:relative;flex:1;min-height:0;overflow:hidden}',
        '.wf-f-r{position:absolute;z-index:3}',
        '.wf-f-r.e{top:0;bottom:0;right:-3px;width:6px;cursor:ew-resize}',
        '.wf-f-r.s{left:0;right:0;bottom:-3px;height:6px;cursor:ns-resize}',
        '.wf-f-r.se{right:-4px;bottom:-4px;width:12px;height:12px;cursor:nwse-resize}',
        '.wf-modal{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.25)}'
    ]);

    function mk(tag, cls)
    {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        return e;
    }

    function Form(opts)
    {
        Control.call(this, 'div', 'wf-form top');
        this._width = 300;
        this._height = 300;
        this._fbs = 'Sizable';
        this._cb = true;
        this._minBox = true;
        this._maxBox = true;
        this._showIcon = true;
        this._state = 'Normal';
        this._startPos = 'WindowsDefaultLocation';
        this._topMost = false;
        this._topLevel = true;
        this._modal = false;
        this._dr = 'None';
        this._owner = null;
        this._menu = null;
        this._isMdiContainer = false; // Support MDI Container
        this._minSize = {
            Width: 120,
            Height: 60
        };
        this._placed = false;
        this._shown = false;
        this._loaded = false;
        this._overlay = null;
        this._resolve = null;
        this._restore = null;
        this.AcceptButton = null;
        this.CancelButton = null;

        var self = this,
            el = this.element;
        this._titleEl = mk('div', 'wf-f-t');
        this._icon = mk('span', 'wf-f-i');
        this._title = mk('span', 'wf-f-x');
        this._btnBox = mk('div', 'wf-f-b');
        this._btns = {
            min: mk('button'),
            max: mk('button'),
            close: mk('button', 'cl')
        };
        this._btns.min.textContent = '\u2013';
        this._btns.max.textContent = '\u25A1';
        this._btns.close.textContent = '\u2715';
        this._btnBox.appendChild(this._btns.min);
        this._btnBox.appendChild(this._btns.max);
        this._btnBox.appendChild(this._btns.close);
        this._titleEl.appendChild(this._icon);
        this._titleEl.appendChild(this._title);
        this._titleEl.appendChild(this._btnBox);
        this._client = mk('div', 'wf-f-c');
        el.appendChild(this._titleEl);
        el.appendChild(this._client);
        this._host = this._client;
        this._rz = ['e', 's', 'se'].map(function (k)
        {
            var r = mk('div', 'wf-f-r ' + k);
            r.setAttribute('data-k', k);
            el.appendChild(r);
            return r;
        });

        if (typeof this._chrome === 'function') this._chrome();
        if (typeof this._bindWindow === 'function') this._bindWindow();

        this._applyRect();
        this._applyOptions(opts);
    }
    var P = Control.Extend(Form);

    if (Control.ColorParts)
    {
        Control.ColorParts(Form,
        {
            BackColor: '--form-bg',
            ForeColor: '--form-fg',
            BorderColor: '--form-bc'
        });
    }

    // ---------------------------------------------------------------- geometry
    P._titleH = function ()
    {
        return this._fbs === 'None' ? 0 : /Tool/.test(this._fbs) ? TOOL_H : TITLE_H;
    };
    P._borderW = function ()
    {
        return this._fbs === 'None' || this._state === 'Maximized' ? 0 : 2;
    };

    P._applyRect = function ()
    {
        var s = this.element.style;
        if (this._isMdiContainer)
        {
            s.left = '0px';
            s.top = '0px';
            s.width = '100%';
            s.height = '100%';
            return;
        }
        if (this._topLevel !== false && this._state === 'Maximized')
        {
            s.left = '0px';
            s.top = '0px';
            s.width = '100vw';
            s.height = '100vh';
            return;
        }
        s.left = this._left + 'px';
        s.top = this._top + 'px';
        s.width = this._width + 'px';
        s.height = (this._state === 'Minimized' ? this._titleH() + this._borderW() : this._height) + 'px';
    };

    P._chrome = function ()
    {
        var none = this._fbs === 'None',
            tool = /Tool/.test(this._fbs),
            sizable = /^Sizable/.test(this._fbs);
        this.element.classList.toggle('nob', none);
        this.element.classList.toggle('max', this._state === 'Maximized' || this._isMdiContainer);
        this._titleEl.style.display = (none || this._isMdiContainer) ? 'none' : ''; // Masquer la barre de titre si c'est le conteneur racine MDI
        this._titleEl.style.height = this._titleH() + 'px';
        this._btnBox.style.display = this._cb ? '' : 'none';
        this._icon.style.display = this._cb && this._showIcon && this._icon.innerHTML ? '' : 'none';
        this._btns.min.style.display = this._minBox && !tool ? '' : 'none';
        this._btns.max.style.display = this._maxBox && !tool ? '' : 'none';
        this._btns.max.textContent = this._state === 'Maximized' ? '\u2750' : '\u25A1';
        var canResize = sizable && this._state === 'Normal' && this._topLevel !== false && !this._isMdiContainer;
        this._rz.forEach(function (r)
        {
            r.style.display = canResize ? '' : 'none';
        });
    };

    P._bindWindow = function ()
    {
        var self = this,
            el = this.element,
            tb = this._titleEl;

        el.addEventListener('mousedown', function ()
        {
            self.Activate();
        }, true);

        this._btns.close.addEventListener('click', function ()
        {
            self._close('UserClosing');
        });
        this._btns.min.addEventListener('click', function ()
        {
            self.WindowState = self._state === 'Minimized' ? 'Normal' : 'Minimized';
        });
        this._btns.max.addEventListener('click', function ()
        {
            self.WindowState = self._state === 'Maximized' ? 'Normal' : 'Maximized';
        });
        tb.addEventListener('dblclick', function (e)
        {
            if (self._maxBox && !/Tool/.test(self._fbs) && !(self._btnBox.contains && self._btnBox.contains(e.target)))
            {
                self.WindowState = self._state === 'Maximized' ? 'Normal' : 'Maximized';
            }
        });

        var drag = null;
        tb.addEventListener('pointerdown', function (e)
        {
            if (e.button !== 0 || self._topLevel === false || self._state !== 'Normal' || self._isMdiContainer) return;
            if (self._btnBox.contains && self._btnBox.contains(e.target)) return;
            drag = {
                x: e.clientX,
                y: e.clientY,
                l: self._left,
                t: self._top
            };
            if (tb.setPointerCapture) tb.setPointerCapture(e.pointerId);
        });
        tb.addEventListener('pointermove', function (e)
        {
            if (!drag) return;
            var vw = window.innerWidth,
                vh = window.innerHeight;
            self._left = Math.max(80 - self._width, Math.min(vw - 80, drag.l + e.clientX - drag.x));
            self._top = Math.max(0, Math.min(vh - TITLE_H, drag.t + e.clientY - drag.y));
            self._applyRect();
        });
        var endDrag = function ()
        {
            drag = null;
        };
        tb.addEventListener('pointerup', endDrag);
        tb.addEventListener('pointercancel', endDrag);

        this._rz.forEach(function (h)
        {
            var k = h.getAttribute('data-k'),
                st = null;
            h.addEventListener('pointerdown', function (e)
            {
                if (e.button !== 0 || self._isMdiContainer) return;
                e.preventDefault();
                st = {
                    x: e.clientX,
                    y: e.clientY,
                    w: self._width,
                    h: self._height
                };
                if (h.setPointerCapture) h.setPointerCapture(e.pointerId);
            });
            h.addEventListener('pointermove', function (e)
            {
                if (!st) return;
                if (k !== 's') self._width = Math.max(self._minSize.Width, st.w + e.clientX - st.x);
                if (k !== 'e') self._height = Math.max(self._minSize.Height, st.h + e.clientY - st.y);
                self._applyRect();
            });
            var end = function ()
            {
                st = null;
            };
            h.addEventListener('pointerup', end);
            h.addEventListener('pointercancel', end);
        });

        el.addEventListener('keydown', function (e)
        {
            var t = e.target,
                tag = t && t.tagName;
            var btn = e.key === 'Enter' && tag !== 'TEXTAREA' ? self.AcceptButton : e.key === 'Escape' ? self.CancelButton : null;
            if (!btn) return;
            e.preventDefault();
            if (btn.PerformClick) btn.PerformClick();
            else if (btn._raise) btn._raise('Click');
        });
    };

    P._onParented = function ()
    {
        this.TopLevel = false;
    };

    // ---------------------------------------------------------------- show / close
    P.Activate = function ()
    {
        this.element.style.zIndex = (this._topMost ? 50000 : 0) + (++zTop);
        this._raise('Activated');
    };

    P._place = function ()
    {
        if (this._placed || this._isMdiContainer) return;
        this._placed = true;
        var vw = window.innerWidth,
            vh = window.innerHeight,
            w = this._width,
            h = this._height,
            l = this._left,
            t = this._top,
            sp = this._startPos;
        if (sp === 'CenterParent' && this._owner && this._owner.element)
        {
            var r = this._owner.element.getBoundingClientRect();
            l = r.left + (r.width - w) / 2;
            t = r.top + (r.height - h) / 2;
        }
        else if (sp === 'CenterScreen' || sp === 'CenterParent')
        {
            l = (vw - w) / 2;
            t = (vh - h) / 2;
        }
        else if (sp !== 'Manual')
        {
            l = 40 + (cascade % 10) * 30;
            t = 40 + (cascade % 10) * 30;
            cascade++;
        }
        this._left = Math.max(0, Math.round(l));
        this._top = Math.max(0, Math.round(t));
        this._applyRect();
    };

    P.Show = function (owner)
    {
        if (this._topLevel === false)
        {
            this.Visible = true;
            this._shown = true;
            return;
        }
        if (this._shown)
        {
            this.Visible = true;
            this.Activate();
            return;
        }
        this._owner = owner || this._owner;
        this._dr = 'None';

        if (root.Theme && typeof root.Theme.Inherit === 'function')
        {
            root.Theme.Inherit(owner && owner.element ? owner.element : document.documentElement, this.element);
        }

        if (!this._loaded)
        {
            this._loaded = true;
            this._raise('Load');
        }
        this._place();

        // Si la form est un IsMdiContainer, on l'injecte dans le conteneur racine de l'application (ex: Control.Root)
        if (this._isMdiContainer && root.Control && root.Control._rootElement)
        {
            root.Control._rootElement.appendChild(this.element);
        }
        else
        {
            document.body.appendChild(this.element);
        }

        this.Visible = true;
        this._shown = true;
        this.Activate();
        this._ensureObserver();
        this._raise('Shown');
    };

    P.ShowDialog = function (owner)
    {
        var self = this;
        if (this._topLevel === false) throw new Error('ShowDialog needs a top level form');
        this._modal = true;
        this._overlay = mk('div', 'wf-modal');
        this._overlay.style.zIndex = (++zTop) + (this._topMost ? 50000 : 0);
        document.body.appendChild(this._overlay);
        var p = new Promise(function (res)
        {
            self._resolve = res;
        });
        this.Show(owner);
        return p;
    };

    P._close = function (reason)
    {
        if (!this._shown) return true;
        var e = this._raise('FormClosing',
        {
            Cancel: false,
            CloseReason: reason || 'None'
        });
        if (e.Cancel)
        {
            this._dr = 'None';
            return false;
        }
        this._shown = false;
        if (this._topLevel !== false)
        {
            if (this.element.parentNode) this.element.parentNode.removeChild(this.element);
        }
        else this.Visible = false;
        if (this._overlay)
        {
            if (this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay);
            this._overlay = null;
        }
        var res = this._dr === 'None' ? 'Cancel' : this._dr,
            resolve = this._resolve;
        this._modal = false;
        this._resolve = null;
        this._raise('FormClosed',
        {
            CloseReason: reason || 'None'
        });
        if (resolve) resolve(res);
        return true;
    };
    P.Close = function ()
    {
        return this._close('None');
    };

    P.Dispose = function ()
    {
        this._shown = false;
        if (this._overlay && this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay);
        this._modal = false;
        Control.prototype.Dispose.call(this);
    };

    P.CenterToScreen = function ()
    {
        if (this._isMdiContainer) return;
        this._left = Math.max(0, Math.round((window.innerWidth - this._width) / 2));
        this._top = Math.max(0, Math.round((window.innerHeight - this._height) / 2));
        this._placed = true;
        this._applyRect();
    };
    P.CenterToParent = function ()
    {
        var o = this._owner && this._owner.element;
        if (!o || this._isMdiContainer)
        {
            this.CenterToScreen();
            return;
        }
        var r = o.getBoundingClientRect();
        this._left = Math.max(0, Math.round(r.left + (r.width - this._width) / 2));
        this._top = Math.max(0, Math.round(r.top + (r.height - this._height) / 2));
        this._placed = true;
        this._applyRect();
    };

    // ---------------------------------------------------------------- properties
    Object.defineProperties(P,
    {
        Text:
        {
            get: function ()
            {
                return this._text;
            },
            set: function (v)
            {
                v = v == null ? '' : String(v);
                this._text = v;
                this._title.textContent = v;
                this._raise('TextChanged');
            }
        },
        Icon:
        {
            get: function ()
            {
                return this._iconSrc || null;
            },
            set: function (v)
            {
                this._iconSrc = v || null;
                this._icon.innerHTML = !v ? '' : /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp)$/i.test(v) ?
                    '<img src="' + Control.Esc(v) + '" alt="">' : Control.Esc(v);
                this._chrome();
            }
        },
        ShowIcon:
        {
            get: function ()
            {
                return this._showIcon;
            },
            set: function (v)
            {
                this._showIcon = !!v;
                this._chrome();
            }
        },
        FormBorderStyle:
        {
            get: function ()
            {
                return this._fbs;
            },
            set: function (v)
            {
                var s = String(v);
                this._fbs = /none/i.test(s) ? 'None' : /sizabletool/i.test(s) ? 'SizableToolWindow' : /fixedtool/i.test(s) ? 'FixedToolWindow' :
                    /dialog/i.test(s) ? 'FixedDialog' : /3d/i.test(s) ? 'Fixed3D' : /single/i.test(s) ? 'FixedSingle' : 'Sizable';
                this._chrome();
                this._applyRect();
            }
        },
        ControlBox:
        {
            get: function ()
            {
                return this._cb;
            },
            set: function (v)
            {
                this._cb = !!v;
                this._chrome();
            }
        },
        MinimizeBox:
        {
            get: function ()
            {
                return this._minBox;
            },
            set: function (v)
            {
                this._minBox = !!v;
                this._chrome();
            }
        },
        MaximizeBox:
        {
            get: function ()
            {
                return this._maxBox;
            },
            set: function (v)
            {
                this._maxBox = !!v;
                this._chrome();
            }
        },

        // Propriété IsMdiContainer ajoutée
        IsMdiContainer:
        {
            get: function ()
            {
                return this._isMdiContainer;
            },
            set: function (v)
            {
                this._isMdiContainer = !!v;
                this.element.classList.toggle('mdi-container', this._isMdiContainer);
                this.element.classList.toggle('top', !this._isMdiContainer);
                if (this._isMdiContainer)
                {
                    this._fbs = 'None';
                }
                this._chrome();
                this._applyRect();
            }
        },

        WindowState:
        {
            get: function ()
            {
                return this._state;
            },
            set: function (v)
            {
                var s = /max/i.test(v) ? 'Maximized' : /min/i.test(v) ? 'Minimized' : 'Normal';
                if (s === this._state) return;
                this._state = s;
                this._chrome();
                this._applyRect();
            }
        },
        StartPosition:
        {
            get: function ()
            {
                return this._startPos;
            },
            set: function (v)
            {
                var s = String(v);
                this._startPos = /manual/i.test(s) ? 'Manual' : /parent/i.test(s) ? 'CenterParent' : /center/i.test(s) ? 'CenterScreen' : 'WindowsDefaultLocation';
            }
        },
        TopMost:
        {
            get: function ()
            {
                return this._topMost;
            },
            set: function (v)
            {
                this._topMost = !!v;
                if (this._shown) this.Activate();
            }
        },
        Opacity:
        {
            get: function ()
            {
                return this.element.style.opacity === '' ? 1 : +this.element.style.opacity;
            },
            set: function (v)
            {
                this.element.style.opacity = Math.max(0, Math.min(1, +v));
            }
        },
        TopLevel:
        {
            get: function ()
            {
                return this._topLevel;
            },
            set: function (v)
            {
                this._topLevel = !!v;
                this.element.classList.toggle('top', this._topLevel && !this._isMdiContainer);
                this._chrome();
                this._applyRect();
            }
        },
        ClientSize:
        {
            get: function ()
            {
                var c = this._client;
                return {
                    Width: c.clientWidth || this._width - this._borderW(),
                    Height: c.clientHeight || this._height - this._titleH() - this._borderW()
                };
            },
            set: function (v)
            {
                if (this._isMdiContainer) return; // Rempli tout l'espace si MDI container
                this._width = (+v.Width || 0) + this._borderW();
                this._height = (+v.Height || 0) + this._titleH() + this._borderW();
                this._relayout();
            }
        },
        MinimumSize:
        {
            get: function ()
            {
                return this._minSize;
            },
            set: function (v)
            {
                this._minSize = {
                    Width: +v.Width || 0,
                    Height: +v.Height || 0
                };
            }
        },
        MainMenuStrip:
        {
            get: function ()
            {
                return this._menu;
            },
            set: function (v)
            {
                this._menu = v;
                if (v && !this.Controls.Contains(v)) this.Controls.Add(v);
            }
        },
        DialogResult:
        {
            get: function ()
            {
                return this._dr;
            },
            set: function (v)
            {
                this._dr = v || 'None';
                if (this._modal && this._dr !== 'None') this._close('None');
            }
        },
        Owner:
        {
            get: function ()
            {
                return this._owner;
            },
            set: function (v)
            {
                this._owner = v;
            }
        },
        Modal:
        {
            get: function ()
            {
                return this._modal;
            }
        }
    });

    root.Form = Form;
    if (typeof module !== 'undefined' && module.exports) module.exports = Form;
})(typeof window !== 'undefined' ? window : this);