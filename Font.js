/**
 * @file Font.js
 * @description Représente une police de caractères avec sa famille, sa taille et ses styles (Gras, Italique, etc.), 
 * simulant le comportement de System.Drawing.Font en C#.
 * 
 * @example
 * // Exemple d'utilisation :
 * let monPolice = new Font("Arial", 14, FontStyle.Bold | FontStyle.Italic);
 * console.log(monPolice); 
 * // Résultat attendu : { Family: 'Arial', Size: 14, Bold: true, Italic: true, Underline: false, Strikeout: false }
 */

(function (root)
{
    'use strict';

    // S'assure que FontStyle est disponible (depuis enums.js ou l'objet global)
    const FontStyle = root.FontStyle ||
    {
        Regular: 0,
        Bold: 1,
        Italic: 2,
        Underline: 4,
        Strikeout: 8
    };

    class Font
    {
        constructor(family, size, style = FontStyle.Regular)
        {
            this.Family = family;
            this.Size = size;
            this.Bold = (style & FontStyle.Bold) !== 0;
            this.Italic = (style & FontStyle.Italic) !== 0;
            this.Underline = (style & FontStyle.Underline) !== 0;
            this.Strikeout = (style & FontStyle.Strikeout) !== 0;
        }

        // Méthode optionnelle pour convertir en style CSS exploitable par le DOM
        toCSS()
        {
            let weight = this.Bold ? "bold" : "normal";
            let style = this.Italic ? "italic" : "normal";
            return `${style} ${weight} ${this.Size}pt "${this.Family}"`.trim();
        }
    }

    // Exportation globale pour le navigateur ou l'environnement modulaire
    root.Font = Font;

})(typeof window !== 'undefined' ? window : global);