/*!
 * Padding.js - WinForms Padding structure equivalent.
 * Supports:
 *   new Padding(val)                  -> All sides = val
 *   new Padding(horizontal, vertical) -> Left/Right = horizontal, Top/Bottom = vertical
 *   new Padding(left, top, right, bottom) -> Individual sides
 *   new Padding({ Left, Top, Right, Bottom }) -> Object config
 */
(function (root) {
    'use strict';

    function Padding(left, top, right, bottom) {
        if (left !== undefined && typeof left === 'object' && left !== null) {
            this.Left = +left.Left || +left.left || 0;
            this.Top = +left.Top || +left.top || 0;
            this.Right = +left.Right || +left.right || 0;
            this.Bottom = +left.Bottom || +left.bottom || 0;
        } else if (left !== undefined && top !== undefined && right === undefined && bottom === undefined) {
            // Overload: new Padding(horizontal, vertical)
            var h = +left || 0;
            var v = +top || 0;
            this.Left = h;
            this.Right = h;
            this.Top = v;
            this.Bottom = v;
        } else if (left !== undefined && top === undefined && right === undefined && bottom === undefined) {
            // Overload: new Padding(all)
            var val = +left || 0;
            this.Left = val;
            this.Top = val;
            this.Right = val;
            this.Bottom = val;
        } else {
            // Overload: new Padding(left, top, right, bottom)
            this.Left = +left || 0;
            this.Top = +top || 0;
            this.Right = +right || 0;
            this.Bottom = +bottom || 0;
        }
    }

    Padding.prototype = {
        get All() {
            return (this.Left === this.Top && this.Top === this.Right && this.Right === this.Bottom) ? this.Left : -1;
        },
        set All(v) {
            var val = +v || 0;
            this.Left = val;
            this.Top = val;
            this.Right = val;
            this.Bottom = val;
        },
        get Horizontal() {
            return this.Left + this.Right;
        },
        get Vertical() {
            return this.Top + this.Bottom;
        },
        ToString: function () {
            return "{Left=" + this.Left + ", Top=" + this.Top + ", Right=" + this.Right + ", Bottom=" + this.Bottom + "}";
        },
        Equals: function (obj) {
            return obj instanceof Padding &&
                obj.Left === this.Left &&
                obj.Top === this.Top &&
                obj.Right === this.Right &&
                obj.Bottom === this.Bottom;
        }
    };

    Object.defineProperty(Padding, 'Empty', {
        get: function () { return new Padding(0); }
    });

    root.Padding = Padding;
    if (typeof module !== 'undefined' && module.exports) module.exports = Padding;
})(typeof window !== 'undefined' ? window : this);