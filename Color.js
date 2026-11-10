/*!
 * Color.js - WinForms Color structure and static colors equivalent for WinFormJS.
 * Defines standard web/system colors matching C# System.Drawing.Color.
 *
 *   var redColor = Color.Red;
 *   var customColor = Color.FromArgb(255, 0, 0);
 */
(function (root) {
    'use strict';

    // Helper to create a color object representation
    function createColor(name, r, g, b, a) {
        return {
            Name: name,
            R: r,
            G: g,
            B: b,
            A: a !== undefined ? a : 255,
            IsEmpty: r === 0 && g === 0 && b === 0 && (a !== undefined ? a : 255) === 0,
            ToString: function () {
                return 'Color [' + (name || ('sRGB (' + r + ', ' + g + ', ' + b + ')')) + ']';
            },
            ToArgb: function () {
                return ((this.A & 0xff) << 24) | ((this.R & 0xff) << 16) | ((this.G & 0xff) << 8) | (this.B & 0xff);
            },
            // CSS representation for rendering inside WinFormJS controls
            ToCss: function () {
                if (this.A < 255) {
                    return 'rgba(' + this.R + ', ' + this.G + ', ' + this.B + ', ' + (this.A / 255) + ')';
                }
                return 'rgb(' + this.R + ', ' + this.G + ', ' + this.B + ')';
            }
        };
    }

    var Color = {
        // Transparent / Empty
        Transparent: createColor('Transparent', 0, 0, 0, 0),
        Empty: createColor('Empty', 0, 0, 0, 0),

        // Base & Standard Colors
        Red: createColor('Red', 255, 0, 0),
        Blue: createColor('Blue', 0, 0, 255),
        Green: createColor('Green', 0, 128, 0),
        Black: createColor('Black', 0, 0, 0),
        White: createColor('White', 255, 255, 255),
        Yellow: createColor('Yellow', 255, 255, 0),
        Cyan: createColor('Cyan', 0, 255, 255),
        Magenta: createColor('Magenta', 255, 0, 255),
        Gray: createColor('Gray', 128, 128, 128),
        DarkGray: createColor('DarkGray', 169, 169, 169),
        LightGray: createColor('LightGray', 211, 211, 211),
        Orange: createColor('Orange', 255, 165, 0),
        Purple: createColor('Purple', 128, 0, 128),
        Pink: createColor('Pink', 255, 192, 203),
        Brown: createColor('Brown', 165, 42, 42),
        Lime: createColor('Lime', 0, 255, 0),
        Navy: createColor('Navy', 0, 0, 128),
        Teal: createColor('Teal', 0, 128, 128),
        Maroon: createColor('Maroon', 128, 0, 0),
        Olive: createColor('Olive', 128, 128, 0),
        Silver: createColor('Silver', 192, 192, 192),
        Gold: createColor('Gold', 255, 215, 0),
        Chocolate: createColor('Chocolate', 210, 105, 30),
        Coral: createColor('Coral', 255, 127, 80),
        Crimson: createColor('Crimson', 220, 20, 60),
        Indigo: createColor('Indigo', 75, 0, 130),
        Ivory: createColor('Ivory', 255, 255, 240),
        Khaki: createColor('Khaki', 240, 230, 140),
        Lavender: createColor('Lavender', 230, 230, 250),
        Salmon: createColor('Salmon', 250, 128, 114),
        SkyBlue: createColor('SkyBlue', 135, 206, 235),
        Violet: createColor('Violet', 238, 130, 238),
        Wheat: createColor('Wheat', 245, 222, 179),

        // System Colors (commonly used in UI interfaces)
        Control: createColor('Control', 240, 240, 240),
        ControlText: createColor('ControlText', 0, 0, 0),
        ControlDark: createColor('ControlDark', 160, 160, 160),
        ControlLight: createColor('ControlLight', 227, 227, 227),
        Window: createColor('Window', 255, 255, 255),
        WindowText: createColor('WindowText', 0, 0, 0),
        Highlight: createColor('Highlight', 0, 120, 215),
        HighlightText: createColor('HighlightText', 255, 255, 255),
        ButtonFace: createColor('ButtonFace', 240, 240, 240),
        Desktop: createColor('Desktop', 0, 128, 128),

        // Static factory methods matching C# API
        FromArgb: function (r, g, b, a) {
            if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number' && typeof a === 'number') {
                return createColor('', r, g, b, a);
            }
            if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number') {
                return createColor('', r, g, b, 255);
            }
            if (typeof r === 'number' && g === undefined) {
                // ARGB packed integer overload
                var argb = r;
                var aVal = (argb >> 24) & 0xff;
                var rVal = (argb >> 16) & 0xff;
                var gVal = (argb >> 8) & 0xff;
                var bVal = argb & 0xff;
                return createColor('', rVal, gVal, bVal, aVal);
            }
            return createColor('', 0, 0, 0, 255);
        },

        FromKnownColor: function (colorName) {
            return Color[colorName] || Color.Black;
        }
    };

    if (typeof Object.freeze === 'function') {
        Object.freeze(Color);
    }

    root.Color = Color;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Color;
    }
})(typeof window !== 'undefined' ? window : this);