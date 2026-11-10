/*!
 * Cursors.js - WinForms Cursors enumeration/static class equivalent for WinFormJS.
 * Defines standard mouse cursor styles matching C# System.Windows.Forms.Cursors.
 *
 *   var cursor = Cursors.Hand;
 */
(function (root) {
    'use strict';

    var Cursors = {
        AppStarting: 'progress',
        Arrow: 'default',
        Cross: 'crosshair',
        Default: 'default',
        Hand: 'pointer',
        Help: 'help',
        HSplit: 'row-resize',
        IBeam: 'text',
        No: 'not-allowed',
        NoMove2D: 'no-drop',
        NoMoveHoriz: 'col-resize',
        NoMoveVert: 'row-resize',
        PanEast: 'e-resize',
        PanNE: 'ne-resize',
        PanNorth: 'n-resize',
        PanNW: 'nw-resize',
        PanSE: 'se-resize',
        PanSouth: 's-resize',
        PanSW: 'sw-resize',
        PanWest: 'w-resize',
        SizeAll: 'move',
        SizeNESW: 'nesw-resize',
        SizeNS: 'ns-resize',
        SizeNWSE: 'nwse-resize',
        SizeWE: 'ew-resize',
        UpArrow: 'n-resize',
        VSplit: 'col-resize',
        WaitCursor: 'wait'
    };

    // Make it read-only / immutable like a true Enum structure
    if (typeof Object.freeze === 'function') {
        Object.freeze(Cursors);
    }

    root.Cursors = Cursors;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Cursors;
    }
})(typeof window !== 'undefined' ? window : this);