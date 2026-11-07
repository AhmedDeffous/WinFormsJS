
/*!
 * enums.js - Centralized WinForms-style Enumerations for JS Framework
 */

(function (root) {
    'use strict';

    // 1. Orientation
    const OriOrientation = Object.freeze({
        Vertical: 'Vertical',
        Horizontal: 'Horizontal' // Correction de la valeur 'dark' par 'Horizontal'
    });

    // 2. DialogResult (Standard WinForms)
    const DialogResult = Object.freeze({
        None: 'None',
        OK: 'OK',
        Cancel: 'Cancel',
        Abort: 'Abort',
        Retry: 'Retry',
        Ignore: 'Ignore',
        Yes: 'Yes',
        No: 'No'
    });
    //3 . Les  de Dock
    const Docks = Object.freeze({
        Fill: 'Fill',
        Left: 'Left',
        Right: 'Right',
        Top: 'Top',
        Bottom: 'Bottom'
    });

    // 4. Les Themes
    const Themes = Object.freeze({
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
    root.OriOrientation = OriOrientation;
    root.DialogResult = DialogResult;
    root.Themes = Themes;
    root.Docks = Docks;

    // Exportation module (CommonJS / Node si utilisé)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            OriOrientation: OriOrientation,
            DialogResult: DialogResult,
            Themes: Themes,
            Docks: Docks
        };
    }

})(typeof window !== 'undefined' ? window : this);


