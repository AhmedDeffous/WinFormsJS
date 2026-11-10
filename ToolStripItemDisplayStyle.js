/*!
 * ToolStripItemDisplayStyle.js - WinForms ToolStripItemDisplayStyle enumeration equivalent for WinFormJS.
 * Specifies whether the text and/or image is displayed on a ToolStrip item.
 *
 *   var style = ToolStripItemDisplayStyle.ImageAndText;
 */
(function (root) {
    'use strict';

    var ToolStripItemDisplayStyle = {
        // Neither the image nor the text is displayed.
        None: 0,

        // Only the image is displayed.
        Image: 1,

        // Only the text is displayed.
        Text: 2,

        // Both the image and the text are displayed.
        ImageAndText: 3
    };

    // Make it read-only / immutable like a true Enum structure
    if (typeof Object.freeze === 'function') {
        Object.freeze(ToolStripItemDisplayStyle);
    }

    root.ToolStripItemDisplayStyle = ToolStripItemDisplayStyle;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ToolStripItemDisplayStyle;
    }
})(typeof window !== 'undefined' ? window : this);