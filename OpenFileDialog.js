/*!
 * OpenFileDialog.js - WinForms OpenFileDialog component. Needs Control.js.
 *
 *   var ofd = new OpenFileDialog({ Title: 'Ouvrir un fichier', Filter: 'Images (*.png;*.jpg)|*.png;*.jpg|Tous les fichiers (*.*)|*.*' });
 *   ofd.ShowDialog(function (result) {
 *       if (result === DialogResult.OK) {
 *           var file = ofd.FileName; // or ofd.FileBytes, ofd.FileObject
 *           console.log("Fichier sélectionné :", ofd.SafeFileName);
 *       }
 *   });
 *
 * Properties: Title, FileName, SafeFileName, Filter, FilterIndex, InitialDirectory, MultiSelect, Tag
 * Methods: ShowDialog([callback | owner]), Dispose()
 * Events (sender, e): FileSelected (provides direct upload / file content access)
 */
(function (root) {
    'use strict';
    var Control = root.Control;
    if (!Control) throw new Error('OpenFileDialog.js needs Control.js to be loaded first');

    var DialogResult = { OK: 1, Cancel: 0 };

    function OpenFileDialog(opts) {
        this._title = 'Ouvrir';
        this._fileName = '';
        this._safeFileName = '';
        this._filter = 'Tous les fichiers (*.*)|*.*';
        this._filterIndex = 1;
        this._multiselect = false;
        this._tag = null;
        this._fileObject = null;
        this._fileBytes = null;
        this._files = [];

        // Create hidden file input element for uploading files via browser capabilities
        this._input = document.createElement('input');
        this._input.type = 'file';
        this._input.style.display = 'none';

        var self = this;
        this._input.addEventListener('change', function (e) {
            var files = e.target.files;
            if (!files || files.length === 0) {
                if (typeof self._callback === 'function') {
                    self._callback(DialogResult.Cancel);
                }
                self._raise('FileSelected', { Result: DialogResult.Cancel });
                return;
            }

            self._files = [];
            for (var i = 0; i < files.length; i++) {
                self._files.push(files[i]);
            }

            self._fileObject = files[0];
            self._safeFileName = files[0].name;
            self._fileName = files[0].name; // Virtual path representation for web security

            // Read file content as ArrayBuffer / Bytes if needed
            var reader = new FileReader();
            reader.onload = function (evt) {
                self._fileBytes = evt.target.result;
                if (typeof self._callback === 'function') {
                    self._callback(DialogResult.OK);
                }
                self._raise('FileSelected', { Result: DialogResult.OK, File: self._fileObject, Files: self._files });
            };
            reader.readAsArrayBuffer(files[0]);
        });

        document.body.appendChild(this._input);

        if (opts) {
            for (var k in opts) {
                if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
                if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
            }
        }
    }

    if (Control.Events) {
        Control.Events(OpenFileDialog.prototype);
    }
    var P = OpenFileDialog.prototype;

    // Convert WinForms style filter (e.g. "Text files (*.txt)|*.txt|All files (*.*)|*.*") to HTML accept attribute
    P._updateAcceptFilter = function () {
        if (!this._filter) {
            this._input.removeAttribute('accept');
            return;
        }
        var parts = this._filter.split('|');
        var exts = [];
        for (var i = 1; i < parts.length; i += 2) {
            var pattern = parts[i];
            if (pattern) {
                var tokens = pattern.split(';');
                for (var j = 0; j < tokens.length; j++) {
                    var t = tokens[j].trim();
                    if (t && t !== '*.*' && t !== '*') {
                        exts.push(t.replace('*', ''));
                    }
                }
            }
        }
        if (exts.length > 0) {
            this._input.setAttribute('accept', exts.join(','));
        } else {
            this._input.removeAttribute('accept');
        }
    };

    P.ShowDialog = function (callback) {
        this._callback = typeof callback === 'function' ? callback : null;
        this._input.multiple = !!this._multiselect;
        this._updateAcceptFilter();
        this._input.value = ''; // Reset to allow selecting the same file again
        this._input.click();
    };

    P.Dispose = function () {
        if (this._input && this._input.parentNode) {
            this._input.parentNode.removeChild(this._input);
        }
    };

    Object.defineProperties(P, {
        Title: { get: function () { return this._title; }, set: function (v) { this._title = v == null ? '' : String(v); } },
        FileName: { get: function () { return this._fileName; }, set: function (v) { this._fileName = v == null ? '' : String(v); } },
        SafeFileName: { get: function () { return this._safeFileName; } },
        FileNames: { get: function () { return this._files.map(function (f) { return f.name; }); } },
        FileObject: { get: function () { return this._fileObject; } },
        FileBytes: { get: function () { return this._fileBytes; } },
        Files: { get: function () { return this._files; } },
        Filter: {
            get: function () { return this._filter; },
            set: function (v) { this._filter = v == null ? '' : String(v); }
        },
        FilterIndex: { get: function () { return this._filterIndex; }, set: function (v) { this._filterIndex = Math.max(1, +v || 1); } },
        MultiSelect: { get: function () { return this._multiselect; }, set: function (v) { this._multiselect = !!v; } },
        Tag: { get: function () { return this._tag; }, set: function (v) { this._tag = v; } }
    });

    root.OpenFileDialog = OpenFileDialog;
    root.DialogResult = DialogResult;
    if (typeof module !== 'undefined' && module.exports) module.exports = OpenFileDialog;
})(typeof window !== 'undefined' ? window : this);