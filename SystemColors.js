/*!
 * SystemColors.js - WinForms SystemColors equivalent for WinFormJS.
 * Provides standard system color constants and CSS variable mappings.
 *
 *   var color = SystemColors.Window;
 *   myControl.BackColor = SystemColors.Control;
 */
(function (root) {
    'use strict';

    var SystemColors = {
        // Active window / caption colors
        ActiveBorder: 'var(--wf-sys-active-border, #adb2b5)',
        ActiveCaption: 'var(--wf-sys-active-caption, #0078d7)',
        ActiveCaptionText: 'var(--wf-sys-active-caption-text, #ffffff)',
        AppWorkspace: 'var(--wf-sys-app-workspace, #6b6b6b)',

        // Control elements (Buttons, Panels, Containers)
        Control: 'var(--wf-sys-control, #f0f0f0)',
        ControlDark: 'var(--wf-sys-control-dark, #a0a0a0)',
        ControlDarkDark: 'var(--wf-sys-control-dark-dark, #696969)',
        ControlLight: 'var(--wf-sys-control-light, #e1e1e1)',
        ControlLightLight: 'var(--wf-sys-control-light-light, #ffffff)',
        ControlText: 'var(--wf-sys-control-text, #000000)',

        // Desktop and Backgrounds
        Desktop: 'var(--wf-sys-desktop, #008080)',
        Info: 'var(--wf-sys-info, #ffffe1)',
        InfoText: 'var(--wf-sys-info-text, #000000)',

        // Menus and Highlights
        Menu: 'var(--wf-sys-menu, #f0f0f0)',
        MenuBar: 'var(--wf-sys-menu-bar, #f0f0f0)',
        MenuText: 'var(--wf-sys-menu-text, #000000)',
        Highlight: 'var(--wf-sys-highlight, #0078d7)',
        HighlightText: 'var(--wf-sys-highlight-text, #ffffff)',
        HotTrack: 'var(--wf-sys-hot-track, #0066cc)',

        // Windows and Text
        Window: 'var(--wf-sys-window, #ffffff)',
        WindowFrame: 'var(--wf-sys-window-frame, #767676)',
        WindowText: 'var(--wf-sys-window-text, #000000)',

        // Disabled and Gray text
        GrayText: 'var(--wf-sys-gray-text, #6d6d6d)'
    };

    // Make it read-only / immutable like a true Enum / Static class structure
    if (typeof Object.freeze === 'function') {
        Object.freeze(SystemColors);
    }

    root.SystemColors = SystemColors;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SystemColors;
    }
})(typeof window !== 'undefined' ? window : this);