/*!
 * Framework.js - Master Loader for WinFormJS Framework (Synchronous Loader)
 * Détecte automatiquement le chemin de base du dossier WinformJS.
 */

(function ()
{
    'use strict';

    // Récupère automatiquement le chemin exact du dossier où se trouve Framework.js
    var scripts = document.getElementsByTagName('script');
    var currentScript = scripts[scripts.length - 1];
    var basePath = '';

    if (currentScript && currentScript.src)
    {
        var src = currentScript.src;
        // Extrait tout ce qui se trouve avant le nom du fichier (ex: "http://.../WinformJS/" ou "../WinformJS/")
        basePath = src.substring(0, src.lastIndexOf('/') + 1);
    }
    else
    {
        // Fallback de sécurité si le script est chargé d'une autre manière
        basePath = './';
    }
    basePath = '../WinformJS/';
    // Liste de vos fichiers dans l'ordre strict des dépendances
    var frameworkFiles = [
        'Enums.js',
        'Cursors.js',
        'Color.js',
        'SystemColors.js',
        'ImeMode.js',
        'StatusBarPanelBorderStyle.js',
        'Resources.js',
        'Point.js',
        'Size.js',
        'Padding.js',
        'Control.js',
        'Timer.js',
        'ImageList.js',
        'Label.js',
        'Button.js',
        'TextBox.js',
        'ComboBox.js',
        'DateTimePicker.js',
        'TrackBar.js',
        'ProgressBarStyle.js',
        'ProgressBar.js',
        'PictureBox.js',
        'Panel.js',
        'GroupBox.js',
        'TabControl.js',
        'TreeView.js',
        'ExListView.js',
        'MenuStrip.js',
        'ToolStrip.js',
        'StatusStrip.js',
        'ContextMenuStrip.js',
        'SplitContainer.js',
        'ToolStripContainer.js',
        'Form.js',
        'UserControl.js',
        'Theme.js',
        'StatusBar.js',
        'TextImageRelation.js',
        'ToolStripItemDisplayStyle.js',
        'ToolStripDropDownButton.js',
        'OpenFileDialog.js',
        'LinkLabel.js',
        'ToolTip.js',
        'MdiTabFormManager.js',
        'DataTable.js',
        'Font.js'
    ];

    // Injection synchrone via document.write en utilisant le même chemin de base
    frameworkFiles.forEach(function (file)
    {
        document.write('<script src="' + basePath + file + '"></script>');
    });

    console.log("WinFormJS Framework chargé depuis : " + basePath);

})();