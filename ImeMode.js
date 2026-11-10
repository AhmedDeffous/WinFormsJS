/*!
 * ImeMode.js - WinForms ImeMode enumeration equivalent for WinFormJS.
 * Specifies the Input Method Editor (IME) mode for a control.
 *
 *   var mode = ImeMode.NoControl;
 */
(function (root) {
    'use strict';

    var ImeMode = {
        // Inherits the IME mode from the parent control
        Inherit: -1,

        // No IME is active (default)
        NoControl: 0,

        // The IME is on
        On: 1,

        // The IME is off
        Off: 2,

        // The IME is disabled
        Disable: 3,

        // Alpha-numeric single-byte characters
        AlphaNumeric: 4,

        // Alpha-numeric double-byte characters
        Alpha: 5,

        // Katakana double-byte characters
        Katakana: 6,

        // Katakana single-byte characters
        KatakanaHalf: 7,

        // Hiragana double-byte characters
        Hiragana: 8,

        // Hangul single-byte characters
        HangulFull: 9,

        // Hangul double-byte characters
        Hangul: 10,

        // Chinese simplified double-byte characters
        SimplifiedChinese: 11,

        // Chinese traditional double-byte characters
        TraditionalChinese: 12,

        // The IME is on, but characters are entered in English
        OnHalf: 13,

        // The IME is off, but characters are entered in English
        OffHalf: 14
    };

    // Make it read-only / immutable like a true Enum structure
    if (typeof Object.freeze === 'function') {
        Object.freeze(ImeMode);
    }

    root.ImeMode = ImeMode;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ImeMode;
    }
})(typeof window !== 'undefined' ? window : this);