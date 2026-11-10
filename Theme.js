/*!
 * Theme.js - themes (Light, Dark, Blue, GreenNature) for ExListView, SplitContainer and all the WinForms-like controls
 * (Control, Panel, GroupBox, Label, TextBox, ComboBox, TabControl, Form, MenuStrip, ContextMenuStrip, TreeView,
 * TrackBar, PictureBox ...). No dependency, load it before or after the controls.
 *
 * Every control draws itself with CSS variables (--wf-surface, --wf-field, --wf-text, --wf-accent ...) whose default
 * value is the Light look, so nothing changes until you apply a theme.
 *
 *   Theme.Apply('Dark');                         // the whole page  (names are not case sensitive; 'Darck' also works)
 *   Theme.Apply('Blue', form.Element);           // one control / one form / one list only (its children follow)
 *   form.Theme = 'GreenNature';  lv.Theme = 'Dark';  split.Theme = 'Light';     // same thing as a property
 *   new Form({ Theme: 'Dark' });  new ExListView('#host', { theme: 'Dark' });  new SplitContainer('#host', { theme: 'Dark' });   // at creation
 *   Theme.Current;  Theme.Names;  Theme.Next();  Theme.Reset(element);
 *   Theme.Persist = true;  Theme.Load();         // remember the choice in localStorage
 *   Theme.On(function (name, element) { ... });  // changed
 *
 * Your own theme (only the variables you give change, the rest comes from Light):
 *   Theme.Register('Orange', { accent: '#e8590c', 'hover': '#ffe8cc', 'hover-border': '#fd7e14' });
 *   Theme.Register('Midnight', { surface: '#10131a', field: '#0b0e14', text: '#d0d7e2' }, 'dark');   // 'dark' = dark scrollbars
 *
 * Follow the operating system (dark / light):
 *   Theme.Auto();                                 // 'Light' by day, 'Dark' at night (prefers-color-scheme), live
 *   Theme.Auto({ light: 'GreenNature', dark: 'Dark' });   Theme.Auto(false);   // other pair / stop
 *
 * Share a theme:
 *   var json = Theme.Export('Orange');            // JSON text, only the variables that differ from Light
 *   Theme.Import(json);                           // registers it (returns its name, false if invalid)
 *   Theme.ToCode('Orange');                       // "Theme.Register('Orange', {...}, 'light');" to paste in your code
 *   Theme.Scheme('Dark');                         // 'dark' | 'light'
 *
 * Page background: body { background: var(--wf-page, #dfe6ee); color: var(--wf-text, #000); }
 * Variables: Theme.Variables (names without the --wf- prefix).
 */
(function (root) {
  'use strict';

  var LIGHT = {
    'page': '#dfe6ee', 'surface': '#f0f0f0', 'field': '#ffffff', 'popup': '#f2f2f2', 'title': '#ffffff',
    'text': '#000000', 'text-dim': '#6d6d6d', 'text-off': '#a0a0a0', 'accent-text': '#ffffff',
    'border': '#7a7a7a', 'border-strong': '#646464', 'border-soft': '#d9d9d9', 'border-faint': '#e5e5e5',
    'frame': '#828790', 'window-border': '#888888', 'exp': '#919191', 'button': '#e5e5e5', 'button-border': '#adadad',
    'popup-border': '#cccccc', 'grid': '#f0f0f0', 'status-border': '#d0d0d0', 'border-disabled': '#bfbfbf',
    'border-hover': '#171717', 'border3d-dark': '#a0a0a0', 'border3d-light': '#ffffff',
    'bar-top': '#fafbfd', 'bar-bottom': '#e6ebf3', 'bar-border': '#c5ccd6',
    'group-line': '#8a9bd1', 'group-text': '#1e3287', 'line': '#808080',
    'hover': '#e5f1fb', 'hover-2': '#d9ebf9', 'hover-border': '#7eb4ea',
    'press': '#cce4f7', 'press-2': '#bcdcf4', 'press-border': '#569de5',
    'accent': '#0078d7', 'sel-off': '#d9d9d9', 'sel-soft': '#cce8ff', 'menu-hl': '#91c9f7',
    'sep': '#d7d7d7', 'grip': '#c8c8c8', 'thumb': '#d6d6d6', 'thumb-off': '#e6e6e6', 'track': '#e7eaea',
    'tick': '#757575', 'tick-off': '#bbbbbb', 'close': '#e81123', 'star-on': '#ffc107', 'star-off': '#c8c8c8',
    'link': '#0066cc', 'row-alt': '#f3f6fb', 'funnel': '#0066cc', 'shadow': 'rgba(0,0,0,.25)'
  };

  var DARK = {
    'page': '#1b1b1c', 'surface': '#2d2d30', 'field': '#1e1e1e', 'popup': '#252526', 'title': '#252526',
    'text': '#e8e8e8', 'text-dim': '#a6a6a6', 'text-off': '#7a7a7a', 'accent-text': '#ffffff',
    'border': '#6b6b6b', 'border-strong': '#8a8a8a', 'border-soft': '#3f3f46', 'border-faint': '#3a3a3e',
    'frame': '#555559', 'window-border': '#555559', 'exp': '#8a8a8a', 'button': '#3e3e42', 'button-border': '#5a5a5e',
    'popup-border': '#454545', 'grid': '#2b2b2f', 'status-border': '#3a3a3e', 'border-disabled': '#4a4a4e',
    'border-hover': '#9a9a9a', 'border3d-dark': '#161616', 'border3d-light': '#5a5a5e',
    'bar-top': '#3c3c3f', 'bar-bottom': '#2d2d30', 'bar-border': '#3f3f46',
    'group-line': '#4a5a8a', 'group-text': '#8fb4ff', 'line': '#6b6b6b',
    'hover': '#3e3e42', 'hover-2': '#46464a', 'hover-border': '#5a8fd1',
    'press': '#094771', 'press-2': '#0b5a93', 'press-border': '#1f8ad2',
    'accent': '#0a74c9', 'sel-off': '#3f3f46', 'sel-soft': '#26435f', 'menu-hl': '#094771',
    'sep': '#454545', 'grip': '#5a5a5e', 'thumb': '#6b6b6b', 'thumb-off': '#3a3a3e', 'track': '#3a3a3e',
    'tick': '#9a9a9a', 'tick-off': '#555555', 'close': '#e81123', 'star-on': '#ffc107', 'star-off': '#555559',
    'link': '#75beff', 'row-alt': '#252528', 'funnel': '#4fc1ff', 'shadow': 'rgba(0,0,0,.6)'
  };

  var BLUE = {
    'page': '#bfd3ee', 'surface': '#dbe7f6', 'field': '#ffffff', 'popup': '#eef4fb', 'title': '#cfe0f5',
    'text': '#15294a', 'text-dim': '#4d6485', 'text-off': '#8196b3', 'accent-text': '#ffffff',
    'border': '#6a89a9', 'border-strong': '#4c6a8c', 'border-soft': '#a9c1e0', 'border-faint': '#c4d6ec',
    'frame': '#6d8fb5', 'window-border': '#4a6fa5', 'exp': '#6d8fb5', 'button': '#c7daf0', 'button-border': '#8db2e3',
    'popup-border': '#86a8d1', 'grid': '#e7eff9', 'status-border': '#9fb8d9', 'border-disabled': '#a9bdd6',
    'border-hover': '#1b4f8a', 'border3d-dark': '#6d8fb5', 'border3d-light': '#f4f9ff',
    'bar-top': '#eaf2fc', 'bar-bottom': '#bcd2ee', 'bar-border': '#8db2e3',
    'group-line': '#6d8fb5', 'group-text': '#1f4e8c', 'line': '#6d8fb5',
    'hover': '#cfe3f9', 'hover-2': '#bcd7f5', 'hover-border': '#5b9bd5',
    'press': '#a9cdf1', 'press-2': '#8fbbea', 'press-border': '#2f78c4',
    'accent': '#1f6fc5', 'sel-off': '#b7cde9', 'sel-soft': '#c5dcf7', 'menu-hl': '#a9cdf1',
    'sep': '#a9c1e0', 'grip': '#8db2e3', 'thumb': '#aac4e6', 'thumb-off': '#d3e0f1', 'track': '#c9daf0',
    'tick': '#4d6485', 'tick-off': '#9fb4d0', 'close': '#e81123', 'star-on': '#ffb300', 'star-off': '#a9bad2',
    'link': '#0a58b8', 'row-alt': '#edf4fc', 'funnel': '#0a58b8', 'shadow': 'rgba(10,40,90,.35)'
  };

  var GREEN = {
    'page': '#cfe0c8', 'surface': '#e6efe1', 'field': '#fbfdf9', 'popup': '#eef5ea', 'title': '#d5e6cd',
    'text': '#1f3321', 'text-dim': '#55705a', 'text-off': '#8aa08f', 'accent-text': '#ffffff',
    'border': '#6b8b64', 'border-strong': '#4e6e4a', 'border-soft': '#b6cdaf', 'border-faint': '#cddfc7',
    'frame': '#6f9068', 'window-border': '#4f7a4a', 'exp': '#6f9068', 'button': '#cfe3c7', 'button-border': '#90b088',
    'popup-border': '#8fb088', 'grid': '#e9f1e5', 'status-border': '#a9c3a2', 'border-disabled': '#b2c6ac',
    'border-hover': '#2f5a2c', 'border3d-dark': '#7f9d78', 'border3d-light': '#f7fcf4',
    'bar-top': '#f1f8ee', 'bar-bottom': '#cfe3c7', 'bar-border': '#96b78e',
    'group-line': '#6f9068', 'group-text': '#2f6b34', 'line': '#6f9068',
    'hover': '#d6e9cf', 'hover-2': '#c5dfbc', 'hover-border': '#6fae66',
    'press': '#b9d9ae', 'press-2': '#a5cf98', 'press-border': '#3f8f3a',
    'accent': '#33803a', 'sel-off': '#c3d8bc', 'sel-soft': '#cde8c4', 'menu-hl': '#b9d9ae',
    'sep': '#b6cdaf', 'grip': '#90b088', 'thumb': '#b3cfab', 'thumb-off': '#d5e4d0', 'track': '#cfe0c8',
    'tick': '#55705a', 'tick-off': '#a8bca3', 'close': '#d32f2f', 'star-on': '#f5b301', 'star-off': '#b5c7b0',
    'link': '#2e7d32', 'row-alt': '#eff6eb', 'funnel': '#2e7d32', 'shadow': 'rgba(30,60,30,.35)'
  };

  var BEIN_SPORTS = {
    'page': '#160a26', 'surface': '#1f1030', 'field': '#12081f', 'popup': '#1b0a2a', 'title': '#2b1845',
    'text': '#ffffff', 'text-dim': '#a39bb5', 'text-off': '#6c627d', 'accent-text': '#000000',
    'border': '#4a154b', 'border-strong': '#631d65', 'border-soft': '#362157', 'border-faint': '#2b1845',
    'frame': '#4a154b', 'window-border': '#362157', 'exp': '#4a154b', 'button': '#2b1845', 'button-border': '#572259',
    'popup-border': '#572259', 'grid': '#221235', 'status-border': '#4a154b', 'border-disabled': '#322342',
    'border-hover': '#00f2fe', 'border3d-dark': '#1b0a2a', 'border3d-light': '#5e3275',
    'bar-top': '#2b1845', 'bar-bottom': '#1f1030', 'bar-border': '#4a154b',
    'group-line': '#4a154b', 'group-text': '#00f2fe', 'line': '#4a154b',
    'hover': '#362157', 'hover-2': '#422868', 'hover-border': '#00f2fe',
    'press': '#4d307a', 'press-2': '#5e3a94', 'press-border': '#00c6ff',
    'accent': '#00f2fe', 'sel-off': '#29173d', 'sel-soft': '#1a3548', 'menu-hl': '#00f2fe',
    'sep': '#362157', 'grip': '#572259', 'thumb': '#422868', 'thumb-off': '#2b1845', 'track': '#160a26',
    'tick': '#00f2fe', 'tick-off': '#6c627d', 'close': '#ff4d4d', 'star-on': '#00f2fe', 'star-off': '#362157',
    'link': '#00f2fe', 'row-alt': '#190c2b', 'funnel': '#00f2fe', 'shadow': 'rgba(0,0,0,0.65)'
  };

  var OOREDOO = {
    'page': '#f4f4f4', 'surface': '#ffffff', 'field': '#ffffff', 'popup': '#ffffff', 'title': '#e60000',
    'text': '#1a1a1a', 'text-dim': '#555555', 'text-off': '#888888', 'accent-text': '#ffffff',
    'border': '#dcdcdc', 'border-strong': '#b5b5b5', 'border-soft': '#eaeaea', 'border-faint': '#f0f0f0',
    'frame': '#e60000', 'window-border': '#cc0000', 'exp': '#e60000', 'button': '#ffffff', 'button-border': '#cccccc',
    'popup-border': '#dcdcdc', 'grid': '#f0f0f0', 'status-border': '#dcdcdc', 'border-disabled': '#e0e0e0',
    'border-hover': '#e60000', 'border3d-dark': '#b5b5b5', 'border3d-light': '#ffffff',
    'bar-top': '#fafafa', 'bar-bottom': '#f0f0f0', 'bar-border': '#dcdcdc',
    'group-line': '#e60000', 'group-text': '#e60000', 'line': '#dcdcdc',
    'hover': '#ffe6e6', 'hover-2': '#ffcccc', 'hover-border': '#e60000',
    'press': '#ffb3b3', 'press-2': '#ff9999', 'press-border': '#cc0000',
    'accent': '#e60000', 'sel-off': '#f5f5f5', 'sel-soft': '#ffe6e6', 'menu-hl': '#ffe6e6',
    'sep': '#dcdcdc', 'grip': '#cccccc', 'thumb': '#ff9999', 'thumb-off': '#e0e0e0', 'track': '#f4f4f4',
    'tick': '#e60000', 'tick-off': '#cccccc', 'close': '#e60000', 'star-on': '#ffcc00', 'star-off': '#dcdcdc',
    'link': '#cc0000', 'row-alt': '#fafafa', 'funnel': '#e60000', 'shadow': 'rgba(230,0,0,0.2)'
  };
  var CATERPILLAR = {
    'page': '#1f1f1f', 'surface': '#2b2b2b', 'field': '#141414', 'popup': '#242424', 'title': '#ffcc00',
    'text': '#f0f0f0', 'text-dim': '#aaaaaa', 'text-off': '#666666', 'accent-text': '#141414',
    'border': '#444444', 'border-strong': '#ffcc00', 'border-soft': '#333333', 'border-faint': '#222222',
    'frame': '#ffcc00', 'window-border': '#ffb700', 'exp': '#ffcc00', 'button': '#333333', 'button-border': '#555555',
    'popup-border': '#ffcc00', 'grid': '#222222', 'status-border': '#444444', 'border-disabled': '#2a2a2a',
    'border-hover': '#ffcc00', 'border3d-dark': '#111111', 'border3d-light': '#555555',
    'bar-top': '#333333', 'bar-bottom': '#242424', 'bar-border': '#ffcc00',
    'group-line': '#ffcc00', 'group-text': '#ffcc00', 'line': '#444444',
    'hover': '#3a3a3a', 'hover-2': '#444444', 'hover-border': '#ffcc00',
    'press': '#ffcc00', 'press-2': '#e6b800', 'press-border': '#ffffff',
    'accent': '#ffcc00', 'sel-off': '#2d2d1f', 'sel-soft': '#3d3d1f', 'menu-hl': '#ffcc00',
    'sep': '#444444', 'grip': '#ffcc00', 'thumb': '#555555', 'thumb-off': '#333333', 'track': '#1f1f1f',
    'tick': '#ffcc00', 'tick-off': '#666666', 'close': '#ff4d4d', 'star-on': '#ffcc00', 'star-off': '#444444',
    'link': '#ffcc00', 'row-alt': '#252525', 'funnel': '#ffcc00', 'shadow': 'rgba(0,0,0,0.7)'
  };
  var UBUNTU = {
    'page': '#2c001e', 'surface': '#300a24', 'field': '#1e0014', 'popup': '#300a24', 'title': '#5e2750',
    'text': '#ffffff', 'text-dim': '#aea79f', 'text-off': '#77767b', 'accent-text': '#ffffff',
    'border': '#5e2750', 'border-strong': '#e95420', 'border-soft': '#431735', 'border-faint': '#38122c',
    'frame': '#77216f', 'window-border': '#5e2750', 'exp': '#77216f', 'button': '#3d1d33', 'button-border': '#5e2750',
    'popup-border': '#77216f', 'grid': '#38122c', 'status-border': '#5e2750', 'border-disabled': '#280c21',
    'border-hover': '#e95420', 'border3d-dark': '#1e0014', 'border3d-light': '#77216f',
    'bar-top': '#3d1d33', 'bar-bottom': '#300a24', 'bar-border': '#5e2750',
    'group-line': '#77216f', 'group-text': '#e95420', 'line': '#5e2750',
    'hover': '#4e2042', 'hover-2': '#5c274e', 'hover-border': '#e95420',
    'press': '#e95420', 'press-2': '#c74413', 'press-border': '#ffffff',
    'accent': '#e95420', 'sel-off': '#451637', 'sel-soft': '#531d43', 'menu-hl': '#e95420',
    'sep': '#431735', 'grip': '#5e2750', 'thumb': '#77216f', 'thumb-off': '#431735', 'track': '#2c001e',
    'tick': '#e95420', 'tick-off': '#77767b', 'close': '#c7162b', 'star-on': '#e95420', 'star-off': '#431735',
    'link': '#e95420', 'row-alt': '#26051c', 'funnel': '#e95420', 'shadow': 'rgba(0,0,0,0.65)'
  };

  var PEPSI_COLA = {
    'page': '#0b1d3a', 'surface': '#10274c', 'field': '#061326', 'popup': '#10274c', 'title': '#004b93',
    'text': '#ffffff', 'text-dim': '#a6bcd0', 'text-off': '#6b8298', 'accent-text': '#ffffff',
    'border': '#004b93', 'border-strong': '#e31837', 'border-soft': '#19396e', 'border-faint': '#0d2242',
    'frame': '#004b93', 'window-border': '#e31837', 'exp': '#004b93', 'button': '#19396e', 'button-border': '#004b93',
    'popup-border': '#e31837', 'grid': '#0d2242', 'status-border': '#004b93', 'border-disabled': '#122644',
    'border-hover': '#e31837', 'border3d-dark': '#061326', 'border3d-light': '#25589e',
    'bar-top': '#19396e', 'bar-bottom': '#10274c', 'bar-border': '#004b93',
    'group-line': '#e31837', 'group-text': '#ffffff', 'line': '#004b93',
    'hover': '#1e4480', 'hover-2': '#26549c', 'hover-border': '#e31837',
    'press': '#e31837', 'press-2': '#c2122d', 'press-border': '#ffffff',
    'accent': '#e31837', 'sel-off': '#14315c', 'sel-soft': '#1c3d70', 'menu-hl': '#e31837',
    'sep': '#19396e', 'grip': '#004b93', 'thumb': '#25589e', 'thumb-off': '#19396e', 'track': '#0b1d3a',
    'tick': '#e31837', 'tick-off': '#6b8298', 'close': '#e31837', 'star-on': '#ffcc00', 'star-off': '#19396e',
    'link': '#0099ff', 'row-alt': '#0e203f', 'funnel': '#e31837', 'shadow': 'rgba(0,0,0,0.7)'
  };
  // Palette Mobilis - Version Dark Mode avec une forte dominante de verts et pistache
  var MOBILIS_PALETTE = {
    // Fonds & Surfaces sombres (dominante vert-de-gris / noir profond)
    'page': '#0a1410',
    'surface': '#102219',
    'field': '#07120c',
    'popup': '#102219',
    'title': '#00e676',

    // Textes
    'text': '#e0f2f1',
    'text-dim': '#a7cbc5',
    'text-off': '#638c82',
    'accent-text': '#0a1410',

    // Bordures & Cadres verts
    'border': '#00c853',
    'border-strong': '#00e676',
    'border-soft': '#1b4d3e',
    'border-faint': '#123328',
    'frame': '#00c853',
    'window-border': '#00e676',
    'exp': '#00c853',
    'button': '#163829',
    'button-border': '#00c853',
    'popup-border': '#00e676',
    'grid': '#123328',
    'status-border': '#00c853',
    'border-disabled': '#254a3a',
    'border-hover': '#00e676',
    'border3d-dark': '#0b261b',
    'border3d-light': '#00e676',

    // Barres de titre et de navigation
    'bar-top': '#143828',
    'bar-bottom': '#0f291d',
    'bar-border': '#00c853',

    // Groupes & Lignes
    'group-line': '#00c853',
    'group-text': '#9ffb93',
    'line': '#00c853',

    // États (Hover / Press)
    'hover': '#1b4d3e',
    'hover-2': '#236652',
    'hover-border': '#00e676',
    'press': '#00e676',
    'press-2': '#00c853',
    'press-border': '#0a1410',

    // Accents & Éléments interactifs
    'accent': '#00c853',
    'sel-off': '#123328',
    'sel-soft': '#1b4d3e',
    'menu-hl': '#00e676',
    'sep': '#1b4d3e',
    'grip': '#00c853',
    'thumb': '#00e676',
    'thumb-off': '#1b4d3e',
    'track': '#0a1410',
    'tick': '#00e676',
    'tick-off': '#638c82',
    'close': '#ff5252',
    'star-on': '#ffea00',
    'star-off': '#1b4d3e',
    'link': '#9ffb93',
    'row-alt': '#0d1c14',
    'funnel': '#00c853',
    'shadow': 'rgba(0, 230, 118, 0.25)',

    // En-tête de liste ExListView en Vert Pistache (#9ffb93)
    'header-bg': '#9ffb93',
    'header-fore': '#062114' // Texte sombre contrasté pour une lisibilité parfaite sur fond pistache
  };
  var ORANGE_PALETTE = {
    // Fonds & Surfaces sombres (Noir charbon / Gris foncé typique d'Orange)
    'page': '#0e0e0e',
    'surface': '#181818',
    'field': '#111111',
    'popup': '#181818',
    'title': '#ff6600',

    // Textes
    'text': '#ffffff',
    'text-dim': '#b3b3b3',
    'text-off': '#777777',
    'accent-text': '#ffffff',

    // Bordures & Cadres orange
    'border': '#ff6600',
    'border-strong': '#ff7722',
    'border-soft': '#4d2600',
    'border-faint': '#261300',
    'frame': '#ff6600',
    'window-border': '#ff7722',
    'exp': '#ff6600',
    'button': '#2a1400',
    'button-border': '#ff6600',
    'popup-border': '#ff7722',
    'grid': '#261300',
    'status-border': '#ff6600',
    'border-disabled': '#333333',
    'border-hover': '#ff7722',
    'border3d-dark': '#331a00',
    'border3d-light': '#ff9944',

    // Barres de titre et de navigation
    'bar-top': '#261300',
    'bar-bottom': '#181818',
    'bar-border': '#ff6600',

    // Groupes & Lignes
    'group-line': '#ff6600',
    'group-text': '#ff9944',
    'line': '#ff6600',

    // États (Hover / Press)
    'hover': '#4d2600',
    'hover-2': '#663300',
    'hover-border': '#ff7722',
    'press': '#ff6600',
    'press-2': '#cc5200',
    'press-border': '#ffffff',

    // Accents & Éléments interactifs
    'accent': '#ff6600',
    'sel-off': '#261300',
    'sel-soft': '#4d2600',
    'menu-hl': '#ff6600',
    'sep': '#4d2600',
    'grip': '#ff6600',
    'thumb': '#ff9944',
    'thumb-off': '#4d2600',
    'track': '#0e0e0e',
    'tick': '#ff6600',
    'tick-off': '#777777',
    'close': '#ff3333',
    'star-on': '#ffcc00',
    'star-off': '#4d2600',
    'link': '#ff9944',
    'row-alt': '#141414',
    'funnel': '#ff6600',
    'shadow': 'rgba(255, 102, 0, 0.25)',

    // En-tête de liste ExListView (ton assorti ou pistache/orange selon votre choix)
    'header-bg': '#ff6600',
    'header-fore': '#ffffff'
  };
  var COCA_COLA_PALETTE = {
    'page': '#121212', 'surface': '#1e1e1e', 'field': '#161616', 'popup': '#1e1e1e', 'title': '#ff0000',
    'text': '#ffffff', 'text-dim': '#cccccc', 'text-off': '#888888', 'accent-text': '#ffffff',
    'border': '#ff0000', 'border-strong': '#cc0000', 'border-soft': '#3d0000', 'border-faint': '#260000',
    'frame': '#ff0000', 'window-border': '#cc0000', 'exp': '#ff0000', 'button': '#2c0000', 'button-border': '#ff0000',
    'popup-border': '#cc0000', 'grid': '#260000', 'status-border': '#ff0000', 'border-disabled': '#444444',
    'border-hover': '#cc0000', 'border3d-dark': '#800000', 'border3d-light': '#ff4d4d',
    'bar-top': '#cc0000', 'bar-bottom': '#990000', 'bar-border': '#800000',
    'group-line': '#ff0000', 'group-text': '#ff0000', 'line': '#ff0000',
    'hover': '#3d0000', 'hover-2': '#5c0000', 'hover-border': '#cc0000',
    'press': '#cc0000', 'press-2': '#990000', 'press-border': '#ffffff',
    'accent': '#ff0000', 'sel-off': '#260000', 'sel-soft': '#3d0000', 'menu-hl': '#ff0000',
    'sep': '#3d0000', 'grip': '#ff0000', 'thumb': '#ff4d4d', 'thumb-off': '#3d0000', 'track': '#121212',
    'tick': '#ff0000', 'tick-off': '#888888', 'close': '#ff0000', 'star-on': '#ffcc00', 'star-off': '#3d0000',
    'link': '#ff4d4d', 'row-alt': '#171717', 'funnel': '#ff0000', 'shadow': 'rgba(255, 0, 0, 0.25)',
    'header-bg': '#ff0000', 'header-fore': '#ffffff'
  };
  var KEY = 'wf-theme';
  var themes = {}, order = [], current = 'Light', persist = false, handlers = [];

  function define(name, vars, scheme) {
    themes[name] = { vars: Object.assign({}, LIGHT, vars || {}), scheme: scheme === 'dark' ? 'dark' : 'light' };
    if (order.indexOf(name) < 0) order.push(name);
  }
  define('Light', LIGHT, 'light');
  define('Dark', DARK, 'dark');
  define('Blue', BLUE, 'light');
  define('GreenNature', GREEN, 'light');
  define('BeinSports', BEIN_SPORTS, 'light');
  define('Ooredoo', OOREDOO, 'light');
  define('Caterpillar', CATERPILLAR, 'light');
  define('Ubuntu', UBUNTU, 'light');
  define('PepsiCola', PEPSI_COLA, 'Light');
  define('Mobilis', MOBILIS_PALETTE, 'Dark');
  define('CocaCola', COCA_COLA_PALETTE, 'Dark');
  define('Orange', ORANGE_PALETTE, 'Light')
  var ALIASES = { darck: 'Dark', night: 'Dark', black: 'Dark', green: 'GreenNature', nature: 'GreenNature', default: 'Light', white: 'Light' };

  // 'dark', 'DARK', 'Darck', 'green nature' ... -> 'Dark', 'GreenNature' (null when unknown)
  function canon(name) {
    if (name == null) return null;
    var k = String(name).toLowerCase().replace(/[\s_\-]+/g, '');
    for (var n in themes) if (n.toLowerCase() === k) return n;
    return ALIASES[k] && themes[ALIASES[k]] ? ALIASES[k] : null;
  }

  function save(n) { try { root.localStorage.setItem(KEY, n); } catch (e) { /* ignore */ } }

  // Apply(name)            -> the whole page (<html>)
  // Apply(name, element)   -> only that element and what is inside it
  function apply(name, el) {
    var n = canon(name);
    if (!n) return false;
    var t = themes[n], doc = root.document;
    var global = !el || el === doc.documentElement;
    el = el || doc.documentElement;
    var st = el.style;
    for (var k in t.vars) st.setProperty('--wf-' + k, t.vars[k]);
    st.colorScheme = t.scheme;                              // native scrollbars, check boxes, inputs follow
    el.setAttribute('data-wf-theme', n);
    if (global) { current = n; if (persist) save(n); }
    handlers.slice().forEach(function (f) { f(n, el); });
    return n;
  }

  // removes the theme of an element (it follows its parent again)
  function reset(el) {
    el = el || root.document.documentElement;
    for (var k in LIGHT) el.style.removeProperty('--wf-' + k);
    el.style.colorScheme = '';
    el.removeAttribute('data-wf-theme');
    if (el === root.document.documentElement) current = 'Light';
  }

  // popups are added to <body>: they copy the theme of the control that opened them
  function inherit(from, to) {
    if (!from || !to) return false;

    for (var e = from; e; e = e.parentNode) {
      var a = e.getAttribute && e.getAttribute('data-wf-theme');

      if (a) {
        apply(a, to);
        return true;
      }
    }

    return false;
  }
  // ---- follow prefers-color-scheme
  var mq = null, mqFn = null;
  function auto(map) {
    if (mq && mqFn) { if (mq.removeEventListener) mq.removeEventListener('change', mqFn); else if (mq.removeListener) mq.removeListener(mqFn); }
    mq = mqFn = null;
    if (map === false) return false;
    if (typeof root.matchMedia !== 'function') return false;
    var m = Object.assign({ light: 'Light', dark: 'Dark' }, map || {});
    mq = root.matchMedia('(prefers-color-scheme: dark)');
    mqFn = function () { return apply(mq.matches ? m.dark : m.light); };
    if (mq.addEventListener) mq.addEventListener('change', mqFn); else if (mq.addListener) mq.addListener(mqFn);
    return mqFn() || false;
  }

  // ---- export / import
  function diffVars(n) {
    var t = themes[n], d = {};
    for (var k in t.vars) if (t.vars[k] !== LIGHT[k]) d[k] = t.vars[k];
    return d;
  }
  function exportTheme(name) {
    var n = canon(name == null ? current : name);
    return n ? JSON.stringify({ name: n, scheme: themes[n].scheme, vars: diffVars(n) }, null, 2) : null;
  }
  function importTheme(data) {
    try {
      var o = typeof data === 'string' ? JSON.parse(data) : data, vars = {};
      if (!o || typeof o.name !== 'string' || !o.name.trim() || o.name.length > 40) return false;
      for (var k in (o.vars || {})) if (Object.prototype.hasOwnProperty.call(LIGHT, k) && typeof o.vars[k] === 'string') vars[k] = o.vars[k];
      define(o.name.trim(), vars, o.scheme);
      return o.name.trim();
    } catch (e) { return false; }
  }
  function toCode(name) {
    var n = canon(name == null ? current : name);
    return n ? "Theme.Register('" + n.replace(/'/g, "\\'") + "', " + JSON.stringify(diffVars(n)) + ", '" + themes[n].scheme + "');" : null;
  }

  var Theme = {
    Auto: auto,
    Export: exportTheme,
    Import: importTheme,
    ToCode: toCode,
    Scheme: function (name) { var n = canon(name); return n ? themes[n].scheme : null; },
    Apply: apply,
    Reset: reset,
    Inherit: inherit,
    Register: function (name, vars, scheme) { define(String(name), vars, scheme); return String(name); },
    Get: function (name) { var n = canon(name); return n ? Object.assign({}, themes[n].vars) : null; },
    Next: function (el) {
      var cur = canon((el && el.getAttribute && el.getAttribute('data-wf-theme')) || current);
      return apply(order[(order.indexOf(cur) + 1) % order.length], el);
    },
    Load: function () {                                     // applies the theme saved by Persist
      try { var n = root.localStorage.getItem(KEY); if (n && canon(n)) return apply(n); } catch (e) { /* ignore */ }
      return false;
    },
    On: function (fn) { handlers.push(fn); return Theme; },
    Off: function (fn) { handlers = handlers.filter(function (f) { return f !== fn; }); return Theme; }
  };
  Object.defineProperties(Theme, {
    Names: { get: function () { return order.slice(); } },
    Current: { get: function () { return current; } },
    Variables: { get: function () { return Object.keys(LIGHT); } },
    Persist: { get: function () { return persist; }, set: function (v) { persist = !!v; if (persist) save(current); } }
  });

  root.Theme = Theme;
  Theme.RefreshElement = function (root) {

    if (!root) return;

    const themeName =
      document.documentElement.getAttribute('data-wf-theme');

    if (!themeName) return;

    Theme.Apply(themeName, root);

    root.querySelectorAll('*').forEach(el => {
      Theme.Apply(themeName, el);
    });
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Theme;
})(typeof window !== 'undefined' ? window : this);
