/*!
 * TextImageRelation.js - WinForms TextImageRelation enumeration equivalent for WinFormJS.
 * Specifies the position of image relative to text on a ToolStrip item.
 *
 *   var relation = TextImageRelation.ImageBeforeText;
 */
(function (root) {
    'use strict';

    var TextImageRelation = {
        // The text and image are overlaid on each other.
        Overlay: 0,

        // The image is to the horizontal right of the text.
        TextBeforeImage: 1,

        // The image is to the horizontal left of the text.
        ImageBeforeText: 2,

        // The image is above the text.
        ImageAboveText: 4,

        // The image is below the text.
        TextAboveImage: 8
    };

    if (typeof Object.freeze === 'function') {
        Object.freeze(TextImageRelation);
    }

    root.TextImageRelation = TextImageRelation;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TextImageRelation;
    }
})(typeof window !== 'undefined' ? window : this);