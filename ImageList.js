/*!
 * ImageList.js - WinForms ImageList (a non visual list of images). Needs Control.js.
 *
 *   var il = new ImageList({ ImageSize: { Width: 16, Height: 16 } });
 *   il.Images.Add('folder', 'img/folder.png');       // (key, image) like WinForms
 *   il.Images.Add('📄');                             // image only: URL, data: URI, canvas, <img>, Blob or a character / emoji
 *   tree.ImageList = il;  node.ImageKey = 'folder';  node.ImageIndex = 1;
 *   listView.ImageList = il.Images;                   // ExListView accepts the Images array (item.imageIndex)
 *   pictureBox.Image = il.Images[0];                  // Images[i] is the image source (string)
 *
 * Images: Add(image) | Add(key, image) | Add(image, key), AddRange([...]), Remove(image), RemoveAt(i), RemoveByKey(key),
 *         Clear(), Contains(image), ContainsKey(key), IndexOfKey(key), SetKeyName(i, key), Keys, Count, Empty, [i]
 * Members: ImageSize {Width, Height} (16 x 16), GetSource(indexOrKey), Tag, Dispose()
 * Events : Changed        ImageList.ToHtml(source, width, height) draws an image or a character as HTML.
 */
(function (root) {
  'use strict';
  var Control = root.Control;
  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;

  function toSource(img) {
    if (img == null) return '';
    if (typeof img === 'string') return img;
    if (typeof Blob !== 'undefined' && img instanceof Blob) return URL.createObjectURL(img);
    if (typeof img.toDataURL === 'function') return img.toDataURL();       // <canvas>
    if (img.src) return img.src;                                           // <img>
    return String(img);
  }

  function ImageList(opts) {
    var self = this, list = this.Images = [];
    this._keys = [];
    this._size = { Width: 16, Height: 16 };
    this.Tag = null;
    Object.defineProperty(list, 'Count', { get: function () { return list.length; } });
    Object.defineProperty(list, 'Empty', { get: function () { return list.length === 0; } });
    Object.defineProperty(list, 'Keys', { get: function () { return self._keys.slice(); } });

    var changed = function () { self._raise('Changed'); };
    // Add(image) | Add(key, image) when both are strings or the image is an object | Add(image, key) when the image is an object
    list.Add = function (a, b) {
      var key = '', img = a;
      if (arguments.length > 1) {
        if (typeof a === 'string') { key = a; img = b; }                   // WinForms order: (key, image)
        else { key = b == null ? '' : String(b); img = a; }
      }
      list.push(toSource(img));
      self._keys.push(key);
      changed();
      return list.length - 1;
    };
    list.AddRange = function (arr) {
      arr.forEach(function (x) { list.push(toSource(x)); self._keys.push(''); });
      changed();
    };
    list.RemoveAt = function (i) {
      if (i < 0 || i >= list.length) return;
      list.splice(i, 1); self._keys.splice(i, 1);
      changed();
    };
    list.Remove = function (img) { list.RemoveAt(list.indexOf(toSource(img))); };
    list.RemoveByKey = function (key) { list.RemoveAt(list.IndexOfKey(key)); };
    list.Clear = function () { list.length = 0; self._keys.length = 0; changed(); };
    list.Contains = function (img) { return list.indexOf(toSource(img)) >= 0; };
    list.ContainsKey = function (key) { return list.IndexOfKey(key) >= 0; };
    list.IndexOfKey = function (key) {
      if (key == null || key === '') return -1;
      for (var i = 0; i < self._keys.length; i++) if (self._keys[i].toLowerCase() === String(key).toLowerCase()) return i;
      return -1;
    };
    list.SetKeyName = function (i, key) { if (i >= 0 && i < list.length) { self._keys[i] = String(key); changed(); } };

    if (opts) {
      for (var k in opts) {
        if (!Object.prototype.hasOwnProperty.call(opts, k)) continue;
        if (typeof opts[k] === 'function') this.on(k, opts[k]); else this[k] = opts[k];
      }
    }
  }
  Control.Events(ImageList.prototype);
  var P = ImageList.prototype;

  Object.defineProperties(P, {
    ImageSize: {
      get: function () { return this._size; },
      set: function (v) { this._size = { Width: +v.Width || 16, Height: +v.Height || 16 }; this._raise('Changed'); }
    }
  });

  // source of an image by index or by key ('' when it does not exist)
  P.GetSource = function (k) {
    var i = typeof k === 'number' ? k : this.Images.IndexOfKey(k);
    return i >= 0 && i < this.Images.length ? this.Images[i] : '';
  };
  P.Dispose = function () { this.Images.Clear(); this._ev = null; };

  // HTML for an image source: <img> for URLs / data URIs, otherwise the text itself (character, emoji)
  ImageList.ToHtml = function (src, w, h) {
    if (!src) return '';
    var st = 'width:' + (w || 16) + 'px;height:' + (h || w || 16) + 'px';
    return IMG_RE.test(src)
      ? '<img src="' + Control.Esc(src) + '" alt="" style="' + st + ';object-fit:contain">'
      : '<span style="display:inline-block;text-align:center;line-height:' + (h || w || 16) + 'px;font-size:' + Math.round((h || w || 16) * 0.8) + 'px;' + st + '">' + Control.Esc(src) + '</span>';
  };
  ImageList.IsImageSource = function (s) { return IMG_RE.test(s || ''); };

  root.ImageList = ImageList;
  if (typeof module !== 'undefined' && module.exports) module.exports = ImageList;
})(typeof window !== 'undefined' ? window : this);
