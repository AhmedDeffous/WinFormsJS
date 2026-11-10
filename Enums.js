/*!
 * Enums.js - Comprehensive Centralized WinForms-style Enumerations for JS Framework
 */

(function (root)
{
    'use strict';

    // 1. Orientation
    const Orientation = Object.freeze(
    {
        Vertical: 'Vertical',
        Horizontal: 'Horizontal'
    });

    // 2. DialogResult
    const DialogResult = Object.freeze(
    {
        None: 'None',
        OK: 'OK',
        Cancel: 'Cancel',
        Abort: 'Abort',
        Retry: 'Retry',
        Ignore: 'Ignore',
        Yes: 'Yes',
        No: 'No'
    });

    // 3. DockStyle
    const DockStyle = Object.freeze(
    {
        None: 'None',
        Top: 'Top',
        Bottom: 'Bottom',
        Left: 'Left',
        Right: 'Right',
        Fill: 'Fill'
    });

    // 4. AnchorStyles (Bits ou valeurs combinées)
    const AnchorStyles = Object.freeze(
    {
        None: 0,
        Top: 1,
        Bottom: 2,
        Left: 4,
        Right: 8
    });

    // 5. ComboBoxStyle
    const ComboBoxStyle = Object.freeze(
    {
        Simple: 'Simple',
        DropDown: 'DropDown',
        DropDownList: 'DropDownList'
    });

    // 6. PictureBoxSizeMode
    const PictureBoxSizeMode = Object.freeze(
    {
        Normal: 'Normal',
        StretchImage: 'StretchImage',
        AutoSize: 'AutoSize',
        CenterImage: 'CenterImage',
        Zoom: 'Zoom'
    });

    // 7. FlatStyle
    const FlatStyle = Object.freeze(
    {
        Flat: 'Flat',
        Popup: 'Popup',
        Standard: 'Standard',
        System: 'System'
    });
    const FontStyle = Object.freeze(
    {
        Regular: 0,
        Bold: 1,
        Italic: 2,
        Underline: 4,
        Strikeout: 8
    });

    // 8. ContentAlignment (Alignement du texte / des images)
    const ContentAlignment = Object.freeze(
    {
        TopLeft: 'TopLeft',
        TopCenter: 'TopCenter',
        TopRight: 'TopRight',
        MiddleLeft: 'MiddleLeft',
        MiddleCenter: 'MiddleCenter',
        MiddleRight: 'MiddleRight',
        BottomLeft: 'BottomLeft',
        BottomCenter: 'BottomCenter',
        BottomRight: 'BottomRight'
    });

    // 9. SelectionMode (Pour ListBox / ListView)
    const SelectionMode = Object.freeze(
    {
        None: 'None',
        One: 'One',
        MultiSimple: 'MultiSimple',
        MultiExtended: 'MultiExtended'
    });

    // 10. ScrollBars
    const ScrollBars = Object.freeze(
    {
        None: 'None',
        Horizontal: 'Horizontal',
        Vertical: 'Vertical',
        Both: 'Both'
    });

    // 11. FormBorderStyle
    const FormBorderStyle = Object.freeze(
    {
        None: 'None',
        FixedSingle: 'FixedSingle',
        Fixed3D: 'Fixed3D',
        FixedDialog: 'FixedDialog',
        Sizable: 'Sizable',
        FixedToolWindow: 'FixedToolWindow',
        SizableToolWindow: 'SizableToolWindow'
    });

    // 12. FormStartPosition
    const FormStartPosition = Object.freeze(
    {
        Manual: 'Manual',
        CenterScreen: 'CenterScreen',
        WindowsDefaultLocation: 'WindowsDefaultLocation',
        WindowsDefaultBounds: 'WindowsDefaultBounds',
        CenterParent: 'CenterParent'
    });

    // 13. FormWindowState
    const FormWindowState = Object.freeze(
    {
        Normal: 'Normal',
        Minimized: 'Minimized',
        Maximized: 'Maximized'
    });

    // 14. AutoSizeMode
    const AutoSizeMode = Object.freeze(
    {
        GrowAndShrink: 'GrowAndShrink',
        GrowOnly: 'GrowOnly'
    });

    // 15. ToolStripGripStyle
    const ToolStripGripStyle = Object.freeze(
    {
        Hidden: 'Hidden',
        Visible: 'Visible'
    });

    // 16. StatusBarPanelAutoSize (Ajouté ici)
    const StatusBarPanelAutoSize = Object.freeze(
    {
        None: 'None',
        Spring: 'Spring',
        Contents: 'Contents'
    });

    // 17. Themes
    const Themes = Object.freeze(
    {
        Light: 'light',
        Dark: 'dark',
        Blue: 'Blue',
        GreenNature: 'GreenNature',
        BeinSports: 'BeinSports',
        Ooredoo: 'Ooredoo',
        Caterpillar: 'Caterpillar',
        Ubuntu: 'Ubuntu',
        PepsiCola: 'PepsiCola',
        Mobilis: 'Mobilis',
        CocaCola: 'CocaCola',
        Orange: 'Orange'
    });

    // Exportation globale (window / root)
    root.OriOrientation = Orientation;
    root.DialogResult = DialogResult;
    root.DockStyle = DockStyle;
    root.AnchorStyles = AnchorStyles;
    root.ComboBoxStyle = ComboBoxStyle;
    root.PictureBoxSizeMode = PictureBoxSizeMode;
    root.FlatStyle = FlatStyle;
    root.ContentAlignment = ContentAlignment;
    root.SelectionMode = SelectionMode;
    root.ScrollBars = ScrollBars;
    root.FormBorderStyle = FormBorderStyle;
    root.FormStartPosition = FormStartPosition;
    root.FormWindowState = FormWindowState;
    root.AutoSizeMode = AutoSizeMode;
    root.ToolStripGripStyle = ToolStripGripStyle;
    root.StatusBarPanelAutoSize = StatusBarPanelAutoSize; // Export global
    root.Themes = Themes;

    // Exportation module (CommonJS / Node si utilisé)
    if (typeof module !== 'undefined' && module.exports)
    {
        module.exports = {
            OriOrientation,
            DialogResult,
            DockStyle,
            AnchorStyles,
            ComboBoxStyle,
            PictureBoxSizeMode,
            FlatStyle,
            ContentAlignment,
            SelectionMode,
            ScrollBars,
            FormBorderStyle,
            FormStartPosition,
            FormWindowState,
            AutoSizeMode,
            ToolStripGripStyle,
            StatusBarPanelAutoSize, // Export CommonJS
            Themes
        };
    }

})(typeof window !== 'undefined' ? window : this);