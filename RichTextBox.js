/*!
 * RichTextBox.js - WinForms RichTextBox component. Needs Control.js and Theme.js.
 *
 *   var rtb = new RichTextBox({ Width: 300, Height: 150, Text: "Texte initial..." });
 *   rtb.on('textChanged', function() { console.log(rtb.Text); });
 *   form.Controls.Add(rtb);
 */
(function (root) {
    'use strict';
    var Control = root.Control;

    Control.InjectCss([
        '.wf-richtextbox{position:relative;background:var(--wf-field, #fff);border:1px solid var(--wf-border, #7a7a7a);border-radius:2px;box-sizing:border-box;font:12px "Segoe UI", Tahoma, sans-serif;color:var(--wf-text, #000);overflow:auto;padding:4px;outline:none;white-space:pre-wrap;word-break:break-word}',
        '.wf-richtextbox:focus{border-color:var(--wf-accent, #0078d7)}',
        '.wf-richtextbox.wf-disabled{background:var(--wf-surface, #f0f0f0);border-color:var(--wf-border-disabled, #bfbfbf);color:var(--wf-text-off, #a0a0a0);cursor:default}'
    ].join(''));

    function RichTextBox(opts) {
        Control.call(this, 'div', 'wf-richtextbox');
        this._width = 200;
        this._height = 96;
        this._readOnly = false;
        this.Tag = null;
        this.Name = '';

        // Configuration de l'élément en mode éditable pour imiter le RichTextBox
        this.element.contentEditable = 'true';
        this.element.setAttribute('spellcheck', 'false');

        var self = this;
        this.element.addEventListener('input', function (e) {
            self._raise('textChanged', e);
        });

        if (opts && opts.Theme) this.Theme = opts.Theme;
        this._applyRect();
        this._applyOptions(opts);
    }

    var P = Control.Extend(RichTextBox);

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
            get: function () {
                return this.element.innerText || '';
            },
            set: function (v) {
                this.element.innerText = v == null ? '' : String(v);
                this._raise('textChanged', {});
            }
        },
        Rtf: {
            get: function () {
                // Retourne le contenu HTML interne pour simuler le flux RTF dans l'écosystème Web
                return this.element.innerHTML || '';
            },
            set: function (v) {
                this.element.innerHTML = v == null ? '' : String(v);
                this._raise('textChanged', {});
            }
        },
        ReadOnly: {
            get: function () {
                return this._readOnly;
            },
            set: function (v) {
                this._readOnly = !!v;
                this.element.contentEditable = this._readOnly ? 'false' : 'true';
            }
        }
    });

    root.RichTextBox = RichTextBox;
    if (typeof module !== 'undefined' && module.exports) module.exports = RichTextBox;
})(typeof window !== 'undefined' ? window : this);