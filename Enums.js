/*!
 * Enums.js - Comprehensive Centralized WinForms-style Enumerations for JS Framework
 */

(function (root)
{
    'use strict';
    var DateTimePickerFormat = Object.freeze({
        Long: 'Long',
        Short: 'Short',
        Time: 'Time',
        Custom: 'Custom'
    });
    var TickStyle = Object.freeze({
        None: 'None',
        TopLeft: 'TopLeft',
        BottomRight: 'BottomRight',
        Both: 'Both'
    });
    const Orientation = Object.freeze(
        {
            Vertical: 'Vertical',
            Horizontal: 'Horizontal'
        });

    const MessageBoxIcon = Object.freeze({
        None: 'None',
        Hand: 'Hand',
        Error: 'Error',
        Stop: 'Stop',
        Question: 'Question',
        Exclamation: 'Exclamation',
        Warning: 'Warning',
        Asterisk: 'Asterisk',
        Information: 'Information'
    });

    const MessageBoxButtons = Object.freeze({
        AbortRetryIgnore: 'AbortRetryIgnore',
        OK: 'OK',
        OKCancel: 'OKCancel',
        RetryCancel: 'RetryCancel',
        YesNo: 'YesNo',
        YesNoCancel: 'YesNoCancel'
    });

    const ToolStripTextDirection = Object.freeze(
        {
            Vertical: 'Vertical',
            Horizontal: 'Horizontal'
        });

    const CharacterCasing = Object.freeze({
        Normal: 0,
        Upper: 1,
        Lower: 2
    });

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

    const DockStyle = Object.freeze(
        {
            None: 'None',
            Top: 'Top',
            Bottom: 'Bottom',
            Left: 'Left',
            Right: 'Right',
            Fill: 'Fill'
        });

    const AnchorStyles = Object.freeze(
        {
            None: 0,
            Top: 1,
            Bottom: 2,
            Left: 4,
            Right: 8
        });

    const ComboBoxStyle = Object.freeze(
        {
            Simple: 'Simple',
            DropDown: 'DropDown',
            DropDownList: 'DropDownList'
        });

    const PictureBoxSizeMode = Object.freeze(
        {
            Normal: 'Normal',
            StretchImage: 'StretchImage',
            AutoSize: 'AutoSize',
            CenterImage: 'CenterImage',
            Zoom: 'Zoom'
        });

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

    const ColorDepth = Object.freeze(
        {
            Depth4Bit: 4,
            Depth8Bit: 8,
            Depth16Bit: 16,
            Depth24Bit: 24,
            Depth32Bit: 32
        });

    const HorizontalAlignment = Object.freeze({
        Left: 'Left',
        Right: 'Right',
        Center: 'Center'
    });

    const VerticalAlignment = Object.freeze({
        Top: 'Top',
        Bottom: 'Bottom',
        Center: 'Center',
        Stretch: 'Stretch'
    });

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

    const SelectionMode = Object.freeze(
        {
            None: 'None',
            One: 'One',
            MultiSimple: 'MultiSimple',
            MultiExtended: 'MultiExtended'
        });

    const ScrollBars = Object.freeze(
        {
            None: 'None',
            Horizontal: 'Horizontal',
            Vertical: 'Vertical',
            Both: 'Both'
        });

    const AutoScaleMode = Object.freeze({
        None: 0,
        Font: 1,
        Dpi: 2,
        Inherit: 3
    });

    const BorderStyle = Object.freeze({
        None: 0,
        FixedSingle: 1,
        Fixed3D: 2
    });

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

    const FormStartPosition = Object.freeze(
        {
            Manual: 'Manual',
            CenterScreen: 'CenterScreen',
            WindowsDefaultLocation: 'WindowsDefaultLocation',
            WindowsDefaultBounds: 'WindowsDefaultBounds',
            CenterParent: 'CenterParent'
        });

    const FormWindowState = Object.freeze(
        {
            Normal: 'Normal',
            Minimized: 'Minimized',
            Maximized: 'Maximized'
        });

    const AutoSizeMode = Object.freeze(
        {
            GrowAndShrink: 'GrowAndShrink',
            GrowOnly: 'GrowOnly'
        });

    const ToolStripGripStyle = Object.freeze(
        {
            Hidden: 'Hidden',
            Visible: 'Visible'
        });

    const StatusBarPanelAutoSize = Object.freeze(
        {
            None: 'None',
            Spring: 'Spring',
            Contents: 'Contents'
        });

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

    root.DateTimePickerFormat = DateTimePickerFormat;
    root.TickStyle = TickStyle;
    root.OriOrientation = Orientation;
    root.MessageBoxButtons = MessageBoxButtons;
    root.MessageBoxIcon = MessageBoxIcon;
    root.ToolStripTextDirection = ToolStripTextDirection;
    root.CharacterCasing = CharacterCasing;
    root.DialogResult = DialogResult;
    root.DockStyle = DockStyle;
    root.AnchorStyles = AnchorStyles;
    root.ComboBoxStyle = ComboBoxStyle;
    root.PictureBoxSizeMode = PictureBoxSizeMode;
    root.FlatStyle = FlatStyle;
    root.ContentAlignment = ContentAlignment;
    root.HorizontalAlignment = HorizontalAlignment;
    root.VerticalAlignment = VerticalAlignment;
    root.SelectionMode = SelectionMode;
    root.ScrollBars = ScrollBars;
    root.AutoScaleMode = AutoScaleMode;
    root.BorderStyle = BorderStyle;
    root.FormBorderStyle = FormBorderStyle;
    root.FormStartPosition = FormStartPosition;
    root.FormWindowState = FormWindowState;
    root.AutoSizeMode = AutoSizeMode;
    root.ToolStripGripStyle = ToolStripGripStyle;
    root.StatusBarPanelAutoSize = StatusBarPanelAutoSize; // Export global
    root.Themes = Themes;
    root.ColorDepth = ColorDepth;
    root.FontStyle = FontStyle;

    if (typeof module !== 'undefined' && module.exports)
    {
        module.exports = {
            DateTimePickerFormat,
            TickStyle,
            OriOrientation,
            MessageBoxButtons,
            MessageBoxIcon,
            ToolStripTextDirection,
            CharacterCasing,
            DialogResult,
            DockStyle,
            AnchorStyles,
            ComboBoxStyle,
            PictureBoxSizeMode,
            FlatStyle,
            ContentAlignment,
            HorizontalAlignment,
            VerticalAlignment,
            SelectionMode,
            ScrollBars,
            AutoScaleMode,
            BorderStyle,
            FormBorderStyle,
            FormStartPosition,
            FormWindowState,
            AutoSizeMode,
            ToolStripGripStyle,
            StatusBarPanelAutoSize, 
            Themes,
            FontStyle,
            ColorDepth
        };
    }

})(typeof window !== 'undefined' ? window : this);