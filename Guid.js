/*!
 * Guid.js - WinForms / .NET Guid implementation for JavaScript.
 *
 *   var newId = Guid.NewGuid();
 *   console.log(newId.ToString()); // e.g. "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *   
 *   var parsed = Guid.Parse("f47ac10b-58cc-4372-a567-0e02b2c3d479");
 */
(function (root) {
    'use strict';

    function Guid(value) {
        if (value && typeof value === 'string') {
            if (!Guid.IsValid(value)) {
                throw new Error("Invalid Guid format.");
            }
            this._value = value.toLowerCase();
        } else {
            this._value = Guid.NewGuid().ToString();
        }
    }

    // Méthode statique équivalente à Guid.NewGuid() .NET
    Guid.NewGuid = function () {
        var uuid;
        // Utilisation de l'API cryptographique native sécurisée du navigateur si disponible
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            var buf = new Uint8Array(16);
            window.crypto.getRandomValues(buf);
            // Ajustements selon la spécification UUID v4 (RFC 4122)
            buf[6] = (buf[6] & 0x0f) | 0x40; // Version 4
            buf[8] = (buf[8] & 0x3f) | 0x80; // Variant RFC 4122

            var hexChars = [];
            for (var i = 0; i < 256; i++) {
                hexChars[i] = (i < 16 ? '0' : '') + i.toString(16);
            }

            uuid =
                hexChars[buf[0]] + hexChars[buf[1]] + hexChars[buf[2]] + hexChars[buf[3]] + '-' +
                hexChars[buf[4]] + hexChars[buf[5]] + '-' +
                hexChars[buf[6]] + hexChars[buf[7]] + '-' +
                hexChars[buf[8]] + hexChars[buf[9]] + '-' +
                hexChars[buf[10]] + hexChars[buf[11]] + hexChars[buf[12]] + hexChars[buf[13]] + hexChars[buf[14]] + hexChars[buf[15]];
        } else {
            // Fallback mathématique si crypto non disponible
            uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        return new Guid(uuid);
    };

    // Constante Guid vide (Guid.Empty)
    Guid.Empty = "00000000-0000-0000-0000-000000000000";

    // Méthode statique Parse
    Guid.Parse = function (input) {
        if (!input) throw new Error("ArgumentNull_String");
        return new Guid(String(input));
    };

    // Méthode statique TryParse
    Guid.TryParse = function (input, resultHolder) {
        try {
            if (Guid.IsValid(input)) {
                if (resultHolder && typeof resultHolder === 'object') {
                    resultHolder.value = new Guid(input);
                }
                return true;
            }
        } catch (e) { }
        return false;
    };

    // Validation du format d'un Guid
    Guid.IsValid = function (input) {
        if (typeof input !== 'string') return false;
        var guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return guidRegex.test(input);
    };

    var P = Guid.prototype;

    P.ToString = function () {
        return this._value;
    };

    P.valueOf = function () {
        return this._value;
    };

    P.toJSON = function () {
        return this._value;
    };

    // Surcharge de toString native pour compatibilité transparente avec string
    P.toString = function () {
        return this._value;
    };

    root.Guid = Guid;
    if (typeof module !== 'undefined' && module.exports) module.exports = Guid;
})(typeof window !== 'undefined' ? window : this);