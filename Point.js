/*!
 * Point.js - WinForms Point structure equivalent.
 * Usage:
 *   var pt = new Point(10, 20);
 *   var ptObj = new Point({ X: 10, Y: 20 });
 *   var x = pt.X;
 */
(function (root) {
    'use strict';

    function Point(x, y) {
        if (x && typeof x === 'object') {
            this.X = +(x.X !== undefined ? x.X : (x.x !== undefined ? x.x : 0)) || 0;
            this.Y = +(x.Y !== undefined ? x.Y : (x.y !== undefined ? x.y : 0)) || 0;
        } else if (Array.isArray(x) && x.length >= 2) {
            this.X = +x[0] || 0;
            this.Y = +x[1] || 0;
        } else {
            this.X = +x || 0;
            this.Y = +y || 0;
        }
    }

    Point.prototype = {
        get IsEmpty() {
            return this.X === 0 && this.Y === 0;
        },
        Offset: function (dx, dy) {
            if (dx instanceof Point) {
                this.X += dx.X;
                this.Y += dx.Y;
            } else {
                this.X += +dx || 0;
                this.Y += +dy || 0;
            }
        },
        ToString: function () {
            return "{X=" + this.X + ", Y=" + this.Y + "}";
        },
        Equals: function (obj) {
            return obj instanceof Point && obj.X === this.X && obj.Y === this.Y;
        }
    };

    Object.defineProperty(Point, 'Empty', {
        get: function () { return new Point(0, 0); }
    });

    root.Point = Point;
    if (typeof module !== 'undefined' && module.exports) module.exports = Point;
})(typeof window !== 'undefined' ? window : this);