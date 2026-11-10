/*!
 * StatusBarPanelBorderStyle.js - WinForms StatusBarPanelBorderStyle enumeration equivalent for WinFormJS.
 * Specifies the border style for a panel on a StatusBar control.
 *
 *   var borderStyle = StatusBarPanelBorderStyle.Sunken;
 */
(function (root) {
    'use strict';

    var StatusBarPanelBorderStyle = {
        // The panel has no border.
        None: 1,

        // The panel has a sunken border.
        Sunken: 2,

        // The panel has a raised border.
        Raised: 3
    };

    // Make it read-only / immutable like a true Enum structure
    if (typeof Object.freeze === 'function') {
        Object.freeze(StatusBarPanelBorderStyle);
    }

    root.StatusBarPanelBorderStyle = StatusBarPanelBorderStyle;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StatusBarPanelBorderStyle;
    }
})(typeof window !== 'undefined' ? window : this);