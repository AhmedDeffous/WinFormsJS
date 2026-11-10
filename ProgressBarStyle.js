/*!
 * ProgressBarStyle.js - WinForms ProgressBarStyle enumeration equivalent for WinFormJS.
 * Specifies the style of a ProgressBar control.
 *
 *   var style = ProgressBarStyle.Marquee;
 */
(function (root) {
    'use strict';

    var ProgressBarStyle = {
        // Standard continuous block progress indicator (default)
        Blocks: 0,

        // Continuous smooth progress indicator
        Continuous: 1,

        // Scrolling marquee style for continuous indeterminate activity
        Marquee: 2
    };

    if (typeof Object.freeze === 'function') {
        Object.freeze(ProgressBarStyle);
    }

    root.ProgressBarStyle = ProgressBarStyle;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ProgressBarStyle;
    }
})(typeof window !== 'undefined' ? window : this);