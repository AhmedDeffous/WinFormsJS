/*!
 * Size.js - WinForms Size structure equivalent.
 * Usage:
 *   var sz = new Size(100, 50);
 *   var szObj = new Size({ Width: 100, Height: 50 });
 *   var w = sz.Width;
 */
(function (root) {
    'use strict';

    function Size(width, height) {
        if (width && typeof width === 'object') {
            this.Width = Math.max(0, +(width.Width !== undefined ? width.Width : width.width) || 0);
            this.Height = Math.max(0, +(width.Height !== undefined ? width.Height : width.height) || 0);
        } else if (Array.isArray(width) && width.length >= 2) {
            this.Width = Math.max(0, +width[0] || 0);
            this.Height = Math.max(0, +width[1] || 0);
        } else {
            this.Width = Math.max(0, +width || 0);
            this.Height = Math.max(0, +height || 0);
        }
    }

    Size.prototype = {
        get IsEmpty() {
            return this.Width === 0 && this.Height === 0;
        },
        ToString: function () {
            return "{Width=" + this.Width + ", Height=" + this.Height + "}";
        },
        Equals: function (obj) {
            return obj instanceof Size && obj.Width === this.Width && obj.Height === this.Height;
        }
    };

    // Static Empty size
    Object.defineProperty(Size, 'Empty', {
        get: function () { return new Size(0, 0); }
    });

    root.Size = Size;
    if (typeof module !== 'undefined' && module.exports) module.exports = Size;
})(typeof window !== 'undefined' ? window : this);