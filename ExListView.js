/*!
 * ExListView.js - web port of the ExtraSeller ExListView (WinForms ListView, Details view)
 * No dependency. CSS is injected automatically.
 *
 *   var lv = new ExListView('#host', {
 *     Columns: [{ text: 'Code', width: 90 }, { text: 'Prix', width: 100, align: 'right' }],
 *     Items:   [['A001', '1 200,50 DA'], ...],     // or { cells: [...], group, backColor, foreColor, tag }
 *     rtl: false, checkBoxes: false, gridLines: false, multiSelect: true
 *   });
 *
 * Header: left click = sort (asc/desc), right click = filter popup, drag the edge = resize.
 *
 * Filters  : getFilter(col) / getFilterOperator(col) / setFilter(col, text) / setFilter(col, op, text)
 *            clearFilters() / hasActiveFilters / totalItemCount / count / on('filtersChanged', fn)
 * Operators: ExListView.FilterOperator = Contains, NotContains, Equal, NotEqual,
 *            Greater, Less, GreaterOrEqual, LessOrEqual
 * Items    : setItems(list) / addItems(list) (respects active filters) / clear()
 * Select   : selectedItems / selectedIndices / selectAll() / clearSelection() / ensureVisible(i)
 * Export   : exportCsv(fileName) / exportHtml(fileName) / toCsv() / toHtml()   (rows currently shown)
 * Menu     : right click on the rows = Select all / Select none / Export CSV / Export HTML (allowContextMenu: false to disable)
 * Custom   : lv.AddContextMenu('Supprimer', function (selectedItems) { ... })   // pass the function, not supprimer()
 *            lv.Activate('Supprimer') / lv.Deactivate('Supprimer') / lv.IsActive('Supprimer')
 *            lv.RemoveContextMenu(text) / lv.ClearContextMenu() / lv.AddContextMenuSeparator()
 *            Built-in keys for Activate/Deactivate: selAll, selNone, expCsv, expHtml
 *            Event 'contextMenuOpening' fires just before the menu is shown (update Activate/Deactivate there)
 *            removeItems(list) removes rows from the list
 * Copy     : copyRow(item) / copySelection() (Ctrl+C) / copyColumn(col); column option noCopy:true hides it from the submenu;
 *            event 'copied'. Built-in menu keys: copy, copySel, copyCol
 * ToolStrip: search box + button (ShowToolStrip, searchOnType), lv.search(text) / clearSearch() / searchText,
 *            lv.AddToolButton(text, fn) / AddToolSeparator()
 * Rating   : column { text: '\u00C9valuation', rating: true } (or lv.AddRatingColumn()) shows 0..5 yellow stars;
 *            right click > Evaluer (1..5 stars / none), lv.rate(n), lv.getRating(item), event 'ratingChanged'
 * Cells    : CellPadding (6 | '4 8' | '4 8 4 8' | {top,right,bottom,left}), LineHeight, WrapMode 'NoWrap' (one line, ...) |
 *            'Wrap' (wraps, fixed RowHeight) | 'Content' (row height fits the text); per column: { wrap: 'Content' }
 *            (a cell text may contain \n); refresh() re-measures after editing item.cells
 * Icons    : item { cells, icon: 'img/a.png' | '📁' } or { imageIndex: 1 } with ImageList = [...], IconSize (16)
 * Views    : lv.View = 'Details' | 'Card' (also option view:, showViewButton:true adds a toolbar toggle). Card options:
 *            cardWidth (min width, 240), cardHeight ('auto' | px), cardGap (10), cardIconSize (32),
 *            cardTitleColumn (default first non-rating column), cardColumns ([indexes] shown in the card); event 'viewChanged'
 * CheckBoxes: lv.CheckBoxes = true|false (checkbox in front of each row), lv.CheckedItems, item.checked,
 *            checkAll() / uncheckAll() (rows shown), Space toggles the focused row, event 'itemChecked'
 * Theme    : lv.Theme = 'Light' | 'Dark' | 'Blue' | 'GreenNature', or the option theme: 'Dark' (needs Theme.js; Theme.Apply('Dark') themes the whole page).
 * Colors   : every part has a color property (and an option with the same name, first letter in lower case) that
 *            replaces the theme color; '' gives the theme back, lv.ResetColors() clears them all:
 *            BackColor / ForeColor (Items), HeaderBackColor / HeaderForeColor (column headers),
 *            ToolBarBackColor / ToolBarForeColor, StatusBarBackColor / StatusBarForeColor,
 *            ContextMenuBackColor / ContextMenuForeColor / ContextMenuHighlightColor (menu and filter pop-up),
 *            SelectionBackColor / SelectionForeColor / InactiveSelectionBackColor, HoverBackColor, AlternateBackColor,
 *            GridLineColor, CardBackColor, FilterIndicatorColor. Giving only a BackColor picks a readable text color.
 * Visible  : lv.ToolStripVisible = true|false, lv.StatusStripVisible = true|false (initial: ShowToolStrip / ShowStatusStrip)
 * StatusStrip: Items count + selected count (ShowStatusStrip), lv.setStatusText(text); lv.setRtl(bool)
 * Items     : lv.Items.Add(x) / AddRange([...]) / Insert(i, x) / Remove(item) / RemoveAt(i) / Clear() / Count / IndexOf / Contains,
 *            x = ListViewItem | ['a', 'b'] | { cells: [...], backColor, foreColor, checked, group, tag } | 'text';
 *            item.SubItems.Add / AddRange / Insert / Remove / RemoveAt / Clear / Count, item.SubItems[i].Text (may contain a little HTML:
 *            'Total <b>500 DA</b>', sanitized) / Font ({ Family:'Arial', Size:12, Bold:true, Italic:false, Underline:false, Strikeout:false },
 *            a CSS-like string 'bold 12px Arial' or '{Family:"Arial",Bold:true}') / ForeColor / BackColor / Tag / Name;
 *            item.Text / Checked / Selected / BackColor / ForeColor / Group / Tag / Font / Index / ListView / Clone() / Remove();
 *            lv.BeginUpdate() / EndUpdate() (one single refresh after many changes). item.cells stays the plain-text view of the sub items
 *            (filter / sort / search / copy / CSV use it); editing item.cells[i] directly + refresh() still works.
 * ColumnHeader: var ch = new ColumnHeader({ Text: 'Nom', Width: 120, Align: 'right' })   // ou new ColumnHeader('Nom', 120, 'right')
 *            lv.Columns.Add(ch) / Add('Nom', 120, 'right') / AddRange([...]) / Insert(i, ch) / Remove(ch) / RemoveAt(i) / Clear()
 *            lv.Columns.Count, lv.Columns[i], IndexOf(ch), Contains(ch); ch.Index (lecture seule), ch.ListView, ch.Text / Width / Align
 *            (TextAlign) / Tag / Name / NoCopy / Rating / Wrap, ch.Clone(); options Columns / Items (columns / items acceptés aussi)
 * Pagination: options pagination:true, pageSize:25, pageIndex:0, pageSizes:[10,25,50,100] ([] = pas de sélecteur);
 *            lv.Pagination / PageSize / PageIndex / PageCount / PageSizes / pageItems, setPage(i) / nextPage() / prevPage() /
 *            firstPage() / lastPage(); count = lignes filtrées (toutes pages); exports = toutes les lignes filtrées;
 *            selectAll() / checkAll() = page affichée; PageDown/PageUp au bord de la page = page suivante/précédente
 * Events   : pageChanged, filtersChanged, selectedIndexChanged, itemActivate, itemChecked, columnClick, columnWidthChanged
 */
  
(function (root) {
  'use strict';

  var OPS = {
    Contains: 'Contains', NotContains: 'NotContains', Equal: 'Equal', NotEqual: 'NotEqual',
    Greater: 'Greater', Less: 'Less', GreaterOrEqual: 'GreaterOrEqual', LessOrEqual: 'LessOrEqual'
  };

  var CSS = [
    '.exlv{position:relative;box-sizing:border-box;width:100%;height:100%;min-height:150px;border:1px solid var(--wf-frame,#828790);background:var(--exlv-bg,var(--wf-field,#fff));color:var(--exlv-fg,var(--exlv-fg-auto,var(--wf-text,#000)));',
    'font:12px "Segoe UI",Tahoma,Arial,sans-serif;outline:none;overflow:hidden;display:flex;flex-direction:column;--exlv-funnel:var(--wf-funnel,#0066cc);--exlv-alt:var(--wf-row-alt,#f3f6fb)}',
    '.exlv-main{position:relative;flex:1 1 auto;min-height:0}',
    '.exlv *{box-sizing:border-box}',
    '.exlv-scroll{position:absolute;inset:0;overflow:auto}',
    '.exlv-head{position:sticky;top:0;z-index:3;display:flex;background:var(--exlv-hdr-bg,var(--wf-title,#fff));color:var(--exlv-hdr-fg,var(--exlv-hdr-fg-auto,var(--wf-text,#000)));border-bottom:1px solid var(--wf-border-faint,#e5e5e5)}',
    '.exlv-h{position:relative;flex:none;height:100%;padding-block:0;padding-inline:var(--exlv-pl,6px) var(--exlv-pr,6px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
    'border-inline-end:1px solid var(--wf-border-faint,#e5e5e5);user-select:none;cursor:default}',
    '.exlv-h:hover{background:var(--wf-hover-2,#d9ebf9)}.exlv-h:active{background:var(--wf-press-2,#bcdcf4)}',
    '.exlv-sort{position:absolute;top:1px;left:50%;margin-left:-4px;width:0;height:0;pointer-events:none;',
    'border-left:4px solid transparent;border-right:4px solid transparent}',
    '.exlv-sort.asc{border-bottom:4px solid var(--wf-text-dim,#6d6d6d)}.exlv-sort.desc{border-top:4px solid var(--wf-text-dim,#6d6d6d)}',
    '.exlv-fn{position:absolute;top:50%;margin-top:-5px;fill:var(--exlv-funnel);pointer-events:none}',
    '.exlv-rs{position:absolute;top:0;bottom:0;inset-inline-end:-3px;width:7px;cursor:col-resize;z-index:2}',
    '.exlv-body{position:relative}',
    '.exlv-row{position:absolute;inset-inline-start:0;display:flex;white-space:nowrap}',
    '.exlv-cell{flex:none;display:flex;align-Items:center;overflow:hidden;padding-block:var(--exlv-pt,0px) var(--exlv-pb,0px);',
    'padding-inline:var(--exlv-pl,6px) var(--exlv-pr,6px)}',
    '.exlv-cell.top{align-Items:flex-start;padding-block:max(var(--exlv-pt,0px),3px) max(var(--exlv-pb,0px),3px)}',
    '.exlv-ct{flex:1 1 auto;min-width:0;line-height:var(--exlv-lh,16px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.exlv-ct.w{white-space:pre-line;overflow-wrap:anywhere;text-overflow:clip}',
    '.exlv-ic{flex:none;display:inline-flex;align-Items:center;justify-content:center;width:var(--exlv-is,16px);',
    'height:var(--exlv-is,16px);margin-inline-end:6px;overflow:hidden}',
    '.exlv-ic img{width:100%;height:100%;object-fit:contain}',
    '.exlv-ic.g{font-size:calc(var(--exlv-is,16px) - 3px);line-height:1}',
    '.exlv-meas{position:absolute;left:0;top:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none}',
    '.exlv.grid .exlv-cell{border-inline-end:1px solid var(--exlv-grid,var(--wf-grid,#f0f0f0));border-bottom:1px solid var(--exlv-grid,var(--wf-grid,#f0f0f0))}',
    '.exlv-row.alt{background:var(--exlv-alt)}',
    '.exlv-row:hover:not(.sel){background:var(--exlv-hover-bg,var(--wf-hover,#e5f3fb))}',
    '.exlv-row.sel{background:var(--exlv-sel-off-bg,var(--wf-sel-off,#d9d9d9))}',
    '.exlv:focus .exlv-row.sel{background:var(--exlv-sel-bg,var(--wf-accent,#0078d7));color:var(--exlv-sel-fg,var(--exlv-sel-fg-auto,var(--wf-accent-text,#fff)))}',
    '.exlv-card{display:block;white-space:normal;overflow:hidden;padding:8px 10px;background:var(--exlv-card-bg,var(--exlv-bg,var(--wf-field,#fff)));border:1px solid var(--wf-border-soft,#d9d9d9);',
    'border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.08)}',
    '.exlv-card:hover:not(.sel){background:var(--exlv-hover-bg,var(--wf-hover,#e5f3fb));border-color:var(--wf-hover-border,#7eb4ea)}',
    '.exlv-card.sel{background:var(--wf-sel-soft,#cce8ff);border-color:var(--wf-accent,#0078d7);color:var(--wf-text,#000)}',
    '.exlv:focus .exlv-card.sel{background:var(--wf-sel-soft,#cce8ff);color:var(--wf-text,#000)}',
    '.exlv-card-h{display:flex;align-Items:center;gap:8px;margin-bottom:4px}',
    '.exlv-card-h .exlv-ic{width:var(--exlv-cis,32px);height:var(--exlv-cis,32px);margin:0}',
    '.exlv-card-h .exlv-ic.g{font-size:calc(var(--exlv-cis,32px) - 6px)}',
    '.exlv-card-t{flex:1;min-width:0;font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.exlv-card-f{display:flex;gap:6px;line-height:18px;white-space:nowrap}',
    '.exlv-card-f .k{flex:none;color:var(--wf-text-dim,#6d6d6d)}',
    '.exlv-card-f .k:after{content:":"}',
    '.exlv-card-f .v{min-width:0;overflow:hidden;text-overflow:ellipsis}',
    '.exlv.cards .exlv-scroll{scrollbar-gutter:stable;overflow-x:hidden}',
    '.exlv-ts{flex:none;display:flex;align-Items:center;gap:2px;height:27px;padding:1px 4px;',
    'background:var(--exlv-tb-bg,linear-gradient(var(--wf-bar-top,#fafbfd),var(--wf-bar-bottom,#e6ebf3)));color:var(--exlv-tb-fg,var(--exlv-tb-fg-auto,var(--wf-text,#000)));border-bottom:1px solid var(--wf-bar-border,#c5ccd6)}',
    '.exlv-tl{display:flex;align-Items:center;gap:2px}',
    '.exlv-spring{flex:1}',
    '.exlv-tb{display:inline-flex;align-Items:center;gap:4px;height:22px;padding:0 6px;font:inherit;color:var(--exlv-tb-fg,var(--exlv-tb-fg-auto,var(--wf-text,#000)));',
    'background:transparent;border:1px solid transparent;border-radius:2px;cursor:default}',
    '.exlv-tb:hover:not(:disabled){background:var(--wf-hover,#e5f1fb);border-color:var(--wf-hover-border,#7eb4ea)}',
    '.exlv-tb:active:not(:disabled){background:var(--wf-press,#cce4f7);border-color:var(--wf-press-border,#569de5)}',
    '.exlv-tb:disabled{color:var(--wf-text-off,#a0a0a0)}',
    '.exlv-tt{width:180px;height:21px;margin:0 2px;padding:1px 4px;font:inherit;color:var(--wf-text,#000);background:var(--wf-field,#fff);border:1px solid var(--wf-border,#7a7a7a);outline:none}',
    '.exlv-tt:focus{border-color:var(--wf-accent,#0078d7)}',
    '.exlv-tsep{width:1px;height:18px;margin:0 4px;background:var(--wf-sep,#c2c9d3)}',
    '.exlv-ss{flex:none;display:flex;align-Items:center;height:22px;padding:0 2px;background:var(--exlv-sb-bg,var(--wf-surface,#f0f0f0));color:var(--exlv-sb-fg,var(--exlv-sb-fg-auto,var(--wf-text,#000)));border-top:1px solid var(--wf-status-border,#d0d0d0)}',
    '.exlv-ssl{padding:0 8px;white-space:nowrap}',
    '.exlv-sss{width:1px;height:14px;background:var(--wf-grip,#c8c8c8)}',
    '.exlv-grip{flex:none;margin-inline-start:4px}',
    '.exlv[dir=rtl] .exlv-grip{transform:scaleX(-1)}',
    '.exlv-pg{flex:none;display:flex;align-Items:center;gap:2px;white-space:nowrap}',
    '.exlv-pg-z{display:inline-flex;align-Items:center}',
    '.exlv-pg-t{padding:0 6px;white-space:nowrap}',
    '.exlv-pg-s{height:18px;margin:0 2px;font:inherit;color:var(--wf-text,#000);background:var(--wf-field,#fff);border:1px solid var(--wf-border,#7a7a7a)}',
    '.exlv-pg .exlv-tb{height:18px;padding:0 4px}',
    '.exlv-pg-b{min-width:22px;justify-content:center}',
    '.exlv[dir=rtl] .exlv-pg-b{transform:scaleX(-1)}',
    '.exlv-grp{color:var(--wf-group-text,#1e3287);font-size:13px;border-bottom:1px solid var(--wf-group-line,#8a9bd1);cursor:default}',
    '.exlv-tw{display:inline-block;width:16px;font-size:9px;text-align:center}',
    '.exlv-cb{margin:0;margin-inline-end:6px;vertical-align:middle;accent-color:var(--wf-accent,#0078d7)}',
    '.exlv-star{color:var(--wf-star-off,#c8c8c8);font-size:14px;letter-spacing:1px}',
    '.exlv-star.on{color:var(--wf-star-on,#ffc107)}',
    '.exlv-pop{position:fixed;z-index:99999;width:268px;padding:8px;display:flex;flex-direction:column;gap:6px;',
    'background:var(--exlv-cm-bg,var(--wf-surface,#f0f0f0));border:1px solid var(--wf-window-border,#888);box-shadow:0 2px 10px var(--wf-shadow,rgba(0,0,0,.3));font:12px "Segoe UI",Tahoma,Arial,sans-serif;color:var(--exlv-cm-fg,var(--exlv-cm-fg-auto,var(--wf-text,#000)))}',
    '.exlv-pop b{font-weight:600}',
    '.exlv-pop select,.exlv-pop input{box-sizing:border-box;width:100%;font:inherit;padding:3px 4px}',
    '.exlv-pop .hint{color:var(--wf-text-dim,#6d6d6d)}',
    '.exlv-pop .btns{display:flex;gap:6px;margin-top:4px}',
    '.exlv-pop button{font:inherit;padding:3px 10px;border:1px solid var(--wf-button-border,#adadad);background:var(--wf-button,#e1e1e1);cursor:pointer}',
    '.exlv-pop button:hover{background:var(--wf-hover,#e5f1fb);border-color:var(--wf-accent,#0078d7)}',
    '.exlv-menu{position:fixed;z-index:99999;min-width:200px;padding:2px;background:var(--exlv-cm-bg,var(--wf-popup,#f2f2f2));border:1px solid var(--wf-popup-border,#ccc);',
    'box-shadow:2px 2px 4px var(--wf-shadow,rgba(0,0,0,.25));font:12px "Segoe UI",Tahoma,Arial,sans-serif;color:var(--exlv-cm-fg,var(--exlv-cm-fg-auto,var(--wf-text,#000)))}',
    '.exlv-mi{padding:4px 24px;white-space:nowrap;cursor:default;user-select:none}',
    '.exlv-mi:hover{background:var(--exlv-cm-hl,var(--wf-menu-hl,#91c9f7))}',
    '.exlv-mi.dis{color:var(--wf-text-off,#a0a0a0);pointer-events:none}',
    '.exlv-ms{height:1px;margin:3px 2px;background:var(--wf-sep,#d7d7d7)}',
    '.exlv-mi.has-sub{position:relative;padding-inline-end:30px}',
    '.exlv-arrow{position:absolute;inset-inline-end:10px;top:0;font-size:8px;line-height:24px}',
    '.exlv-menu.exlv-sub{display:none;position:absolute;top:-3px;inset-inline-start:100%;max-height:60vh;overflow:auto}',
    '.exlv-menu.exlv-sub.flip{inset-inline-start:auto;inset-inline-end:100%}',
    '.exlv.Items-custom{--exlv-alt:rgba(127,127,127,.1)}',
    '.exlv.Items-custom .exlv-row:hover:not(.sel){background:var(--exlv-hover-bg,rgba(127,127,127,.18))}',
    '.exlv.hdr-custom .exlv-h:hover{background:rgba(127,127,127,.22)}',
    '.exlv.hdr-custom .exlv-h:active{background:rgba(127,127,127,.38)}',
    '.exlv.tb-custom .exlv-tb:hover:not(:disabled){background:rgba(127,127,127,.25);border-color:rgba(127,127,127,.5)}',
    '.exlv-menu.cm-custom .exlv-mi:hover{background:rgba(127,127,127,.3)}',
    '.exlv-mi.has-sub:hover>.exlv-sub{display:block}'
  ].join('');

  var LABELS = {
    ltr: {
      Contains: 'Contient', NotContains: 'Ne contient pas', Equal: '=   \u00C9gal \u00E0', NotEqual: '<>   Diff\u00E9rent de',
      Greater: '>   Sup\u00E9rieur \u00E0', Less: '<   Inf\u00E9rieur \u00E0',
      GreaterOrEqual: '>=   Sup\u00E9rieur ou \u00E9gal \u00E0', LessOrEqual: '<=   Inf\u00E9rieur ou \u00E9gal \u00E0',
      clear: 'Effacer', all: 'Tout effacer', close: 'Fermer', title: 'Filtre : ', ex: 'Ex. : ',
      selAll: 'Tout s\u00E9lectionner', selNone: 'Ne rien s\u00E9lectionner',
      expCsv: 'Exporter vers CSV', expHtml: 'Exporter vers HTML',
      copy: 'Copier', copySel: 'Copier la s\u00E9lection', copyCol: 'Copier la valeur de la colonne',
      rate: '\u00C9valuer', rateNone: 'Aucune \u00E9valuation', ratingTitle: '\u00C9valuation',
      viewCards: 'Cartes', viewDetails: 'D\u00E9tails',
      search: 'Rechercher', Items: '\u00C9l\u00E9ments : ', selected: 'S\u00E9lectionn\u00E9s : ',
      pgFirst: 'Premi\u00E8re page', pgPrev: 'Page pr\u00E9c\u00E9dente', pgNext: 'Page suivante', pgLast: 'Derni\u00E8re page',
      pgInfo: 'Page {0} / {1}', pgSize: 'Lignes par page : ', pgRange: '{0}\u2013{1} sur {2}'
    },
    rtl: {
      Contains: '\u064A\u062D\u062A\u0648\u064A', NotContains: '\u0644\u0627 \u064A\u062D\u062A\u0648\u064A',
      Equal: '=  \u064A\u0633\u0627\u0648\u064A', NotEqual: '<>  \u064A\u062E\u062A\u0644\u0641 \u0639\u0646',
      Greater: '>  \u0623\u0643\u0628\u0631 \u0645\u0646', Less: '<  \u0623\u0635\u063A\u0631 \u0645\u0646',
      GreaterOrEqual: '>=  \u0623\u0643\u0628\u0631 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A',
      LessOrEqual: '<=  \u0623\u0635\u063A\u0631 \u0623\u0648 \u064A\u0633\u0627\u0648\u064A',
      clear: '\u0645\u0633\u062D', all: '\u0645\u0633\u062D \u0627\u0644\u0643\u0644', close: '\u0625\u063A\u0644\u0627\u0642',
      title: '\u062A\u0635\u0641\u064A\u0629 : ', ex: '\u0645\u062B\u0627\u0644 : ',
      selAll: '\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0643\u0644', selNone: '\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062D\u062F\u064A\u062F',
      expCsv: '\u062A\u0635\u062F\u064A\u0631 \u0625\u0644\u0649 CSV', expHtml: '\u062A\u0635\u062F\u064A\u0631 \u0625\u0644\u0649 HTML',
      copy: '\u0646\u0633\u062E', copySel: '\u0646\u0633\u062E \u0627\u0644\u062A\u062D\u062F\u064A\u062F',
      copyCol: '\u0646\u0633\u062E \u0642\u064A\u0645\u0629 \u0627\u0644\u0639\u0645\u0648\u062F',
      rate: '\u062A\u0642\u064A\u064A\u0645', rateNone: '\u0628\u062F\u0648\u0646 \u062A\u0642\u064A\u064A\u0645', ratingTitle: '\u0627\u0644\u062A\u0642\u064A\u064A\u0645',
      viewCards: '\u0628\u0637\u0627\u0642\u0627\u062A', viewDetails: '\u062A\u0641\u0627\u0635\u064A\u0644',
      search: '\u0628\u062D\u062B', Items: '\u0627\u0644\u0639\u0646\u0627\u0635\u0631 : ', selected: '\u0627\u0644\u0645\u062D\u062F\u062F : ',
      pgFirst: '\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0623\u0648\u0644\u0649', pgPrev: '\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629',
      pgNext: '\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629', pgLast: '\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0623\u062E\u064A\u0631\u0629',
      pgInfo: '\u0635\u0641\u062D\u0629 {0} / {1}', pgSize: '\u0627\u0644\u0635\u0641\u0648\u0641 \u0641\u064A \u0627\u0644\u0635\u0641\u062D\u0629 : ', pgRange: '{0}\u2013{1} \u0645\u0646 {2}'
    }
  };

  // ================================================================= ColumnHeader (WinForms) ---------------------------------------------
  // The internal fields (text, width, align, tag, noCopy, rating, wrap) are the ones the list view reads; the PascalCase
  // properties (Text, Width, Align ...) are the public API and refresh the list view they belong to.
  var HALIGN = { Left: 'left', Right: 'right', Center: 'center' };          // HorizontalAlignment
  function normAlign(v, d) {
    if (typeof v === 'number') return ['left', 'right', 'center'][v] || d;
    v = String(v == null ? '' : v).toLowerCase();
    return v === 'left' || v === 'right' || v === 'center' ? v : d;
  }

  function ColumnHeader(a, b, c) {
    if (!(this instanceof ColumnHeader)) return new ColumnHeader(a, b, c);
    var o = a !== null && typeof a === 'object' ? a : { text: a, width: b, align: c };
    var g = function () {                                     // first defined option among the given spellings
      for (var i = 0; i < arguments.length; i++) if (o[arguments[i]] !== undefined) return o[arguments[i]];
    };
    var t = g('Text', 'text');
    this.text = t == null ? '' : String(t);
    this.width = Math.max(0, Math.round(+g('Width', 'width')) || 100);
    this.rating = !!g('Rating', 'rating');
    this.align = normAlign(g('Align', 'TextAlign', 'align', 'textAlign'), this.rating ? 'center' : 'left');
    this.tag = g('Tag', 'tag');
    this.name = g('Name', 'name') || '';
    this.noCopy = !!g('NoCopy', 'noCopy');
    var w = g('Wrap', 'wrap');
    this.wrap = w ? normWrap(w) : null;
    var ix = +g('Index', 'index');
    this._idx = ix >= 0 ? Math.floor(ix) : -1;                // position used by Columns.Add when the header is not yet in a list
    this._owner = null;
  }
  ColumnHeader.prototype._changed = function (widthOnly) {
    var lv = this._owner;
    if (!lv) return;
    if (widthOnly) lv._layout(); else lv._rebuild(false);
  };
  ColumnHeader.prototype.Clone = function () {
    var c = new ColumnHeader({ Text: this.text, Width: this.width, Align: this.align, Tag: this.tag, Name: this.name,
      NoCopy: this.noCopy, Rating: this.rating });
    c.wrap = this.wrap;
    return c;
  };
  ColumnHeader.prototype.toString = function () { return 'ColumnHeader: Text: ' + this.text; };
  var alignProp = {
    get: function () { return this.align; },
    set: function (v) { this.align = normAlign(v, this.align); this._changed(); }
  };
  var indexProp = { get: function () { return this._owner ? this._owner.Columns.indexOf(this) : -1; } };    // read-only, like WinForms
  Object.defineProperties(ColumnHeader.prototype, {
    Text: { get: function () { return this.text; }, set: function (v) { this.text = v == null ? '' : String(v); this._changed(); } },
    Width: {
      get: function () { return this.width; },
      set: function (v) { v = Math.round(+v); if (isNaN(v)) return; this.width = Math.max(0, v); this._changed(true); }
    },
    Align: alignProp,
    TextAlign: alignProp,
    Index: indexProp,
    index: indexProp,                                          // lower-case alias (the previous version stored a plain `index` field)
    ListView: { get: function () { return this._owner; } },
    Tag: { get: function () { return this.tag; }, set: function (v) { this.tag = v; } },
    Name: { get: function () { return this.name; }, set: function (v) { this.name = v == null ? '' : String(v); } },
    NoCopy: { get: function () { return this.noCopy; }, set: function (v) { this.noCopy = !!v; } },
    Rating: { get: function () { return this.rating; }, set: function (v) { this.rating = !!v; this._changed(); } },
    Wrap: { get: function () { return this.wrap; }, set: function (v) { this.wrap = v ? normWrap(v) : null; this._changed(); } }
  });

  var cssDone = false;
  function injectCss() {
    if (cssDone) return;
    cssDone = true;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function lc(s) { return String(s).toLocaleLowerCase(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // 0..5 -> five stars, the first n in yellow
  function starsHtml(v) {
    var n = Math.max(0, Math.min(5, Math.round(parseFloat(v) || 0))), h = '';
    for (var i = 1; i <= 5; i++) h += '<span class="exlv-star' + (i <= n ? ' on' : '') + '">\u2605</span>';
    return h;
  }

  var IMG_RE = /^(https?:|data:|blob:|\/|\.{1,2}\/)|\.(png|jpe?g|gif|svg|ico|webp|bmp)(\?.*)?$/i;
  // item icon: image URL / data URI, or a character / emoji
  function iconHtml(src) {
    if (!src) return '';
    return IMG_RE.test(src) ? '<span class="exlv-ic"><img src="' + esc(src) + '" alt=""></span>' : '<span class="exlv-ic g">' + esc(src) + '</span>';
  }
  function normWrap(v) {
    v = String(v == null ? '' : v);
    return /content|auto/i.test(v) ? 'Content' : /^wrap|^true$/i.test(v) ? 'Wrap' : 'NoWrap';
  }
  // 6 | '4 8' | '4 8 4 8' (CSS order: top right bottom left) | { top, right, bottom, left }  -> px; 'left' = start side
  function parsePad(v) {
    if (v == null) return { t: 0, r: 6, b: 0, l: 6 };
    if (typeof v === 'number') return { t: v, r: v, b: v, l: v };
    if (typeof v === 'object' && !Array.isArray(v)) return { t: +v.top || 0, r: +v.right || 0, b: +v.bottom || 0, l: +v.left || 0 };
    var a = (Array.isArray(v) ? v : String(v).trim().split(/[\s,]+/)).map(function (x) { return parseFloat(x) || 0; });
    if (a.length === 1) a = [a[0], a[0], a[0], a[0]];
    else if (a.length === 2) a = [a[0], a[1], a[0], a[1]];
    else if (a.length === 3) a = [a[0], a[1], a[2], a[1]];
    return { t: a[0], r: a[1], b: a[2], l: a[3] };
  }

  // ---------------------------------------------------------------- number / date parsing
  function normDigits(s) {
    return s.replace(/[\u0660-\u0669]/g, function (c) { return c.charCodeAt(0) - 0x0660; })
            .replace(/[\u06F0-\u06F9]/g, function (c) { return c.charCodeAt(0) - 0x06F0; });
  }

  // "1 200,50", "1,200.50", "1 200,50 DA", "-5", Arabic-Indic digits... -> number or null
  function parseNumber(text) {
    if (text == null) return null;
    var t = String(text).trim();
    if (!t || /[\/:]/.test(t)) return null;
    t = normDigits(t).replace(/\u066B/g, '.').replace(/\u066C/g, '');
    var parts = t.split(/[\s\u00A0\u202F]+/).filter(Boolean);
    if (!parts.length) return null;
    var first = 0, last = parts.length - 1;
    if (parts.length > 1 && !/\d/.test(parts[last])) last--;
    if (last > first && !/\d/.test(parts[first])) first++;

    var s = '';
    for (var p = first; p <= last; p++) {
      for (var i = 0; i < parts[p].length; i++) {
        var c = parts[p].charAt(i);
        if (/\d/.test(c) || c === ',' || c === '.') s += c;
        else if (c === '-' && s === '') s += '-';
        else if (c === '+' && s === '') continue;
        else if (/[$\u20AC\u00A3\u00A5]/.test(c)) continue;
        else return null;
      }
    }
    var lcI = s.lastIndexOf(','), ldI = s.lastIndexOf('.'), idx = Math.max(lcI, ldI), dec = '';
    if (idx >= 0) {
      if (lcI >= 0 && ldI >= 0) dec = s.charAt(idx);
      else if (s.split(s.charAt(idx)).length - 1 === 1) dec = s.charAt(idx);
    }
    var clean = '';
    for (var k = 0; k < s.length; k++) {
      var ch = s.charAt(k);
      if (ch === dec) clean += '.';
      else if (ch !== ',' && ch !== '.') clean += ch;
    }
    return /^-?\d+(\.\d+)?$/.test(clean) ? parseFloat(clean) : null;
  }

  // dd/MM/yyyy, dd-MM-yyyy, dd.MM.yyyy, yyyy-MM-dd (+ optional time) -> midnight timestamp or null
  function parseDate(text) {
    if (text == null) return null;
    var t = normDigits(String(text)).trim();
    var m = t.match(/^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})(?:[ T]+\d{1,2}:\d{2}(?::\d{2})?)?$/);
    if (!m) return null;
    var y, mo = +m[2], d;
    if (m[1].length === 4) { y = +m[1]; d = +m[3]; }
    else { d = +m[1]; y = +m[3]; if (m[3].length <= 2) y += y < 50 ? 2000 : 1900; }
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt.getTime();
  }

  function cmpOp(op, c) {
    switch (op) {
      case OPS.Equal: return c === 0;
      case OPS.NotEqual: return c !== 0;
      case OPS.Greater: return c > 0;
      case OPS.Less: return c < 0;
      case OPS.GreaterOrEqual: return c >= 0;
      case OPS.LessOrEqual: return c <= 0;
    }
    return false;
  }

  function cellMatches(f, cell) {
    cell = cell == null ? '' : String(cell);
    if (f.op === OPS.Contains) return lc(cell).indexOf(f.lower) >= 0;
    if (f.op === OPS.NotContains) return lc(cell).indexOf(f.lower) < 0;
    if (f.kind === 'number') {
      var n = parseNumber(cell);
      if (n === null) return f.op === OPS.NotEqual;
      return cmpOp(f.op, n < f.num ? -1 : n > f.num ? 1 : 0);
    }
    if (f.kind === 'date') {
      var d = parseDate(cell);
      if (d === null) return f.op === OPS.NotEqual;
      return cmpOp(f.op, d < f.date ? -1 : d > f.date ? 1 : 0);
    }
    var eq = lc(cell.trim()) === lc(f.text.trim());      // plain text column: only = and <>
    if (f.op === OPS.Equal) return eq;
    if (f.op === OPS.NotEqual) return !eq;
    return false;
  }

  // ================================================================= sub item text: HTML + Font ---------------------------------------------
  // A sub item Text may contain a little HTML ('Total: <b>500 DA</b>'). It is sanitized (whitelist of tags, attributes and CSS properties;
  // nothing is ever executed). Text without one of the allowed tags stays plain text ('a < b', '<>' ...).
  var HTML_TAGS = { b: 1, strong: 1, i: 1, em: 1, u: 1, s: 1, strike: 1, del: 1, ins: 1, mark: 1, small: 1, big: 1, sub: 1, sup: 1,
    code: 1, kbd: 1, span: 1, font: 1, br: 1, wbr: 1, a: 1 };
  var HTML_DROP = { script: 1, style: 1, iframe: 1, object: 1, embed: 1, link: 1, meta: 1, svg: 1, math: 1, template: 1, noscript: 1,
    textarea: 1, select: 1, option: 1, button: 1, form: 1, input: 1, img: 1, video: 1, audio: 1, base: 1, frame: 1, frameset: 1 };
  var HTML_RE = /<\/?(?:b|strong|i|em|u|s|strike|del|ins|mark|small|big|sub|sup|code|kbd|span|font|br|wbr|a)(?:\s[^<>]*)?\/?>/i;
  var CSS_PROPS = ['color', 'background', 'background-color', 'font', 'font-family', 'font-size', 'font-weight', 'font-style',
    'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing', 'white-space', 'vertical-align', 'opacity', 'padding',
    'border', 'border-radius'];
  var _tpl = null;
  function tpl() { return _tpl || (_tpl = document.createElement('template')); }      // inert: nothing in it is ever executed

  function safeStyle(css) {
    var out = [];
    String(css).split(';').forEach(function (d) {
      var k = d.indexOf(':');
      if (k < 0) return;
      var pr = d.slice(0, k).trim().toLowerCase(), v = d.slice(k + 1).trim();
      if (CSS_PROPS.indexOf(pr) >= 0 && v && !/url\s*\(|expression|javascript:|@import|[\\<>{}]/i.test(v)) out.push(pr + ':' + v);
    });
    return out.join(';');
  }
  function walkSafe(node) {
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) return;                                   // text
      if (n.nodeType !== 1) { node.removeChild(n); return; }          // comments ...
      var t = n.nodeName.toLowerCase();
      if (HTML_DROP[t]) { node.removeChild(n); return; }
      walkSafe(n);
      if (!HTML_TAGS[t]) {                                            // unknown tag: it goes, its (already cleaned) content stays
        while (n.firstChild) node.insertBefore(n.firstChild, n);
        node.removeChild(n);
        return;
      }
      [].slice.call(n.attributes).forEach(function (a) {
        var k = a.name.toLowerCase(), v = a.value;
        if (k === 'style') { v = safeStyle(v); if (v) n.setAttribute('style', v); else n.removeAttribute('style'); }
        else if (k === 'title' || k === 'dir' || k === 'lang') { /* harmless */ }
        else if (t === 'font' && (k === 'color' || k === 'face' || k === 'size')) { /* harmless */ }
        else if (t === 'a' && k === 'href' && /^(https?:|mailto:|tel:|#)/i.test(v.trim())) { /* safe links only */ }
        else n.removeAttribute(a.name);                               // on* handlers, javascript: links, ids, classes ...
      });
      if (t === 'a' && n.hasAttribute('href')) { n.setAttribute('rel', 'noopener noreferrer'); n.setAttribute('target', '_blank'); }
    });
  }
  function sanitizeHtml(html) {
    var t = tpl();
    t.innerHTML = html;
    walkSafe(t.content);
    return t.innerHTML;
  }
  function toPlain(safeHtml) {                                         // text shown by the sanitized html (used by filter / sort / search / copy)
    var t = tpl();
    t.innerHTML = String(safeHtml).replace(/<br\s*\/?>/gi, '\n');
    return t.content.textContent;
  }

  function safeCss(v) { return String(v == null ? '' : v).replace(/url\s*\(|expression|[;{}<>"'\\]/gi, '').trim(); }

  // Font: { Family, Size (px), Bold, Italic, Underline, Strikeout }  |  '{Family:"Arial",Bold:true}'  |  'bold italic 12px Arial'
  function parseFontString(str) {
    var t = String(str).trim(), o = null;
    if (t.charAt(0) === '{') {
      try { o = JSON.parse(t.replace(/'/g, '"').replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')); } catch (e) { o = null; }
      return o;
    }
    var f = {}, fam = [];
    t.split(/\s+/).forEach(function (w) {
      if (/^bold$/i.test(w)) f.Bold = true;
      else if (/^italic$/i.test(w)) f.Italic = true;
      else if (/^underline$/i.test(w)) f.Underline = true;
      else if (/^(strikeout|line-through)$/i.test(w)) f.Strikeout = true;
      else if (/^\d+(\.\d+)?px$/i.test(w)) f.Size = parseFloat(w);
      else if (w) fam.push(w);
    });
    if (fam.length) f.Family = fam.join(' ').replace(/^["']|["']$/g, '');
    return f;
  }
  function normFont(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'string') v = parseFontString(v);
    if (!v || typeof v !== 'object') return null;
    var g = function () { for (var i = 0; i < arguments.length; i++) if (v[arguments[i]] !== undefined) return v[arguments[i]]; };
    var f = {}, fam = g('Family', 'family', 'Name', 'name', 'FontFamily'), sz = +g('Size', 'size', 'FontSize'), b;
    if (fam) f.Family = String(fam);
    if (sz > 0) f.Size = sz;
    if ((b = g('Bold', 'bold')) !== undefined) f.Bold = !!b;
    if ((b = g('Italic', 'italic')) !== undefined) f.Italic = !!b;
    if ((b = g('Underline', 'underline')) !== undefined) f.Underline = !!b;
    if ((b = g('Strikeout', 'strikeout', 'Strikethrough')) !== undefined) f.Strikeout = !!b;
    return Object.keys(f).length ? f : null;
  }
  function fontCss(f) {                                                // ';prop:value...' (leading semicolon) or ''
    if (!f) return '';
    var c = '';
    if (f.Family) c += ";font-family:'" + safeCss(f.Family) + "',sans-serif";
    if (f.Size) c += ';font-size:' + f.Size + 'px';
    if (f.Bold !== undefined) c += ';font-weight:' + (f.Bold ? 'bold' : 'normal');
    if (f.Italic !== undefined) c += ';font-style:' + (f.Italic ? 'italic' : 'normal');
    if (f.Underline !== undefined || f.Strikeout !== undefined) {
      var d = (f.Underline ? 'underline ' : '') + (f.Strikeout ? 'line-through' : '');
      c += ';text-decoration:' + (d.trim() || 'none');
    }
    return c;
  }

  // ================================================================= ListViewSubItem / ListViewItem (WinForms) ------------------------------
  // item.subs[i] (ListViewSubItem) owns the formatting of the cell i; item.cells[i] is always its PLAIN text (what filters / sorts / copy read).
  function ListViewSubItem(a, fore, back, font) {
    if (!(this instanceof ListViewSubItem)) return new ListViewSubItem(a, fore, back, font);
    this._item = null;
    this.tag = undefined; this.name = '';
    this.foreColor = ''; this.backColor = ''; this.font = null;
    if (a instanceof ListViewSubItem) {
      this._setText(a.text);
      this.foreColor = a.foreColor; this.backColor = a.backColor; this.font = a.font ? Object.assign({}, a.font) : null;
      this.tag = a.tag; this.name = a.name;
    } else if (a !== null && typeof a === 'object') {
      var g = function () { for (var i = 0; i < arguments.length; i++) if (a[arguments[i]] !== undefined) return a[arguments[i]]; };
      this._setText(g('Text', 'text'));
      this.foreColor = safeCss(g('ForeColor', 'foreColor')); this.backColor = safeCss(g('BackColor', 'backColor'));
      this.font = normFont(g('Font', 'font'));
      this.tag = g('Tag', 'tag'); this.name = g('Name', 'name') || '';
    } else {
      this._setText(a);
      this.foreColor = safeCss(fore); this.backColor = safeCss(back); this.font = normFont(font);
    }
  }
  ListViewSubItem.prototype._setText = function (v) {
    this.text = v == null ? '' : String(v);
    this.html = HTML_RE.test(this.text);
    this._s = null;
    this.plain = this.html ? toPlain(this._safe()) : this.text;
  };
  ListViewSubItem.prototype._safe = function () { return this._s != null ? this._s : (this._s = sanitizeHtml(this.text)); };
  ListViewSubItem.prototype._touch = function (kind) {
    var it = this._item;
    if (!it) return;
    var i = it.subs.indexOf(this);
    if (kind === 'text' && i >= 0) it.cells[i] = this.plain;
    it._hc = null;
    if (it._owner) it._owner._touched(kind);
  };
  ListViewSubItem.prototype.Clone = function () { return new ListViewSubItem(this); };
  ListViewSubItem.prototype.toString = function () { return 'ListViewSubItem: {' + this.plain + '}'; };
  Object.defineProperties(ListViewSubItem.prototype, {
    Text: { get: function () { return this.text; }, set: function (v) { this._setText(v); this._touch('text'); } },
    PlainText: { get: function () { return this.plain; } },
    Font: { get: function () { return this.font ? Object.assign({}, this.font) : null; }, set: function (v) { this.font = normFont(v); this._touch('style'); } },
    ForeColor: { get: function () { return this.foreColor; }, set: function (v) { this.foreColor = safeCss(v); this._touch('style'); } },
    BackColor: { get: function () { return this.backColor; }, set: function (v) { this.backColor = safeCss(v); this._touch('style'); } },
    Tag: { get: function () { return this.tag; }, set: function (v) { this.tag = v; } },
    Name: { get: function () { return this.name; }, set: function (v) { this.name = v == null ? '' : String(v); } }
  });

  function makeSubs(item) {                                            // item.SubItems: array + the WinForms collection members
    var a = [];
    var def = function (n, fn) { Object.defineProperty(a, n, { value: fn, writable: true, configurable: true, enumerable: false }); };
    def('Add', function (x, fore, back, font) { var s = item._insertSub(-1, x, fore, back, font); item._subsChanged(); return s; });
    def('AddRange', function (list) { (list || []).forEach(function (x) { item._insertSub(-1, x); }); item._subsChanged(); });
    def('Insert', function (i, x, fore, back, font) { var s = item._insertSub(i, x, fore, back, font); item._subsChanged(); return s; });
    def('Remove', function (s) { var i = item.subs.indexOf(s); if (i >= 0) item._removeSub(i); });
    def('RemoveAt', function (i) { return item._removeSub(i); });
    def('Clear', function () { while (item.subs.length > 1) item._removeSub(item.subs.length - 1, true); item._subsChanged(); });   // the first one is the item itself
    def('IndexOf', function (s) { return item.subs.indexOf(s); });
    def('Contains', function (s) { return item.subs.indexOf(s) >= 0; });
    Object.defineProperty(a, 'Count', { get: function () { return a.length; }, configurable: true, enumerable: false });
    return a;
  }

  function ListViewItem(a) {
    if (!(this instanceof ListViewItem)) return new ListViewItem(a);
    var o = Array.isArray(a) ? { cells: a } : (a !== null && typeof a === 'object') ? a : { cells: a == null ? [] : [a] };
    this.cells = [];
    this.subs = makeSubs(this);
    this.selected = false;
    this._owner = null;
    var self = this;
    Object.keys(o).forEach(function (k) {                              // group, tag, backColor, foreColor, checked, icon ... (and the PascalCase setters)
      if (k === 'cells' || k === 'SubItems' || k === 'subs' || k === 'selected' || k === 'Selected') return;
      self[k] = o[k];
    });
    (o.SubItems || o.cells || []).forEach(function (v) { self._insertSub(-1, v); });
    if (o.Text !== undefined && !this.subs.length) this._insertSub(-1, o.Text);
    this.checked = !!(o.checked !== undefined ? o.checked : o.Checked);
    this.font = normFont(this.font);
  }
  ListViewItem.prototype._syncSubs = function () {                    // item.cells grown directly (legacy code): give the new cells a sub item
    while (this.subs.length < this.cells.length) {
      var s = new ListViewSubItem(this.cells[this.subs.length]);
      s._item = this;
      this.subs.push(s);
    }
  };
  ListViewItem.prototype._insertSub = function (i, x, fore, back, font) {
    this._syncSubs();
    var s = x instanceof ListViewSubItem ? (x._item && x._item !== this ? x.Clone() : x) : new ListViewSubItem(x, fore, back, font);
    s._item = this;
    if (i == null || i < 0 || i >= this.subs.length) { this.subs.push(s); this.cells.push(s.plain); }
    else { this.subs.splice(i, 0, s); this.cells.splice(i, 0, s.plain); }
    return s;
  };
  ListViewItem.prototype._removeSub = function (i, quiet) {
    this._syncSubs();
    if (!(i >= 0 && i < this.subs.length)) return null;
    var s = this.subs.splice(i, 1)[0];
    this.cells.splice(i, 1);
    s._item = null;
    if (!quiet) this._subsChanged();
    return s;
  };
  ListViewItem.prototype._subsChanged = function () { this._hc = null; if (this._owner) this._owner._touched('text'); };
  ListViewItem.prototype._ui = function (kind) { this._hc = null; if (this._owner) this._owner._touched(kind); };
  ListViewItem.prototype.Clone = function () {
    var self = this, c = new ListViewItem({});
    Object.keys(this).forEach(function (k) {
      if (k === 'cells' || k === 'subs' || k === 'selected' || k === '_owner' || k === '_hc') return;
      c[k] = self[k];
    });
    this.SubItems.forEach(function (s) { c._insertSub(-1, s.Clone()); });
    return c;
  };
  ListViewItem.prototype.Remove = function () { if (this._owner) this._owner.Items.Remove(this); };
  ListViewItem.prototype.EnsureVisible = function () {
    var lv = this._owner;
    if (!lv) return;
    var vi = lv._view.indexOf(this);
    if (vi < 0) return;
    if (lv._pag) lv.setPage(Math.floor(vi / lv._pageSize));
    for (var r = 0; r < lv._rows.length; r++) if (lv._rows[r].it === this) { lv.ensureVisible(r); break; }
  };
  ListViewItem.prototype.toString = function () { return 'ListViewItem: {' + (this.cells[0] || '') + '}'; };
  Object.defineProperties(ListViewItem.prototype, {
    Text: {
      get: function () { var s = this.SubItems[0]; return s ? s.Text : ''; },
      set: function (v) { var s = this.SubItems[0]; if (s) s.Text = v; else { this._insertSub(-1, v); this._subsChanged(); } }
    },
    SubItems: { get: function () { this._syncSubs(); return this.subs; } },
    Checked: { get: function () { return !!this.checked; }, set: function (v) { this.checked = !!v; this._ui('style'); } },
    Selected: {
      get: function () { return !!this.selected; },
      set: function (v) { this.selected = !!v; this._ui('style'); if (this._owner) this._owner._updateStatus(); }
    },
    BackColor: { get: function () { return this.backColor || ''; }, set: function (v) { this.backColor = safeCss(v); this._ui('style'); } },
    ForeColor: { get: function () { return this.foreColor || ''; }, set: function (v) { this.foreColor = safeCss(v); this._ui('style'); } },
    Group: { get: function () { return this.group || ''; }, set: function (v) { this.group = v == null ? '' : String(v); this._ui('rebuild'); } },
    Tag: { get: function () { return this.tag; }, set: function (v) { this.tag = v; } },
    Name: { get: function () { return this.name || ''; }, set: function (v) { this.name = v == null ? '' : String(v); } },
    Font: { get: function () { return this.font ? Object.assign({}, this.font) : null; }, set: function (v) { this.font = normFont(v); this._ui('style'); } },
    Index: { get: function () { return this._owner ? this._owner.Items.indexOf(this) : -1; } },
    ListView: { get: function () { return this._owner; } }
  });

  // renderers: formatting of the cell i of an item (' ;prop:value...' strings, '' when nothing to say)
  function subOf(it, i) {
    var s = it.subs && it.subs[i], c = it.cells[i];
    if (!s) return null;
    if (s.plain !== c) { s._setText(c); it.cells[i] = s.plain; }      // item.cells[i] edited directly: take the new value (it may contain HTML)
    return s;
  }
  function cellInner(it, i) { var s = subOf(it, i); return s && s.html ? s._safe() : esc(it.cells[i]); }
  function cellSpanStyle(it, i, sel) {
    var s = subOf(it, i), c = fontCss((s && s.font) || it.font);
    if (!sel && s && s.foreColor) c += ';color:' + s.foreColor;
    return c;
  }
  function cellBoxStyle(it, i, sel) { var s = subOf(it, i); return !sel && s && s.backColor ? ';background:' + s.backColor : ''; }

  function normCol(c) { return c instanceof ColumnHeader ? c : new ColumnHeader(c); }
  function normItem(x, lv) {
    var it = x instanceof ListViewItem ? (x._owner && x._owner !== lv ? x.Clone() : x) : new ListViewItem(x);
    it.selected = false;
    it.checked = !!it.checked;
    return it;
  }

  // ================================================================= ExListView -----------------------------------------------------------------

 
 function ExListView(opts) 
 {
if (!(this instanceof ExListView)) return new ExListView(opts);
    injectCss();

    if (opts === undefined && arguments.length === 1 && typeof arguments[0] === 'object' && !(arguments[0] instanceof Element)) {
      opts = arguments[0];
    }

    var o = Object.assign({
      rtl: false, allowColumnFilter: true, allowSort: true, canAlternateBackColor: true,
      alternateBackColor: null, filterIndicatorColor: null, gridLines: false,
      multiSelect: true, checkBoxes: false, showGroups: true, allowContextMenu: true,
      ShowToolStrip: true, ShowStatusStrip: true, searchOnType: true, rowHeight: 22, headerHeight: 24,
      cellPadding: '0 6px', lineHeight: 16, wrapMode: 'NoWrap', iconSize: 16, imageList: [], view: 'Details',
      cardWidth: 240, cardHeight: 'auto', cardGap: 10, cardIconSize: 32, cardTitleColumn: -1, cardColumns: null,
      showViewButton: false, theme: null,
      pagination: false, pageSize: 25, pageIndex: 0, pageSizes: [10, 25, 50, 100],
      Columns: [],
	  Items: []
    }, opts || {});

    // REMPLACER root.Control.call PAR CECI (Création propre de l'élément)
    this.element = document.createElement('div');

    var self = this;
     
    ['rtl', 'allowColumnFilter', 'allowSort', 'canAlternateBackColor',
     'multiSelect', 'showGroups', 'allowContextMenu', 'searchOnType', 'rowHeight', 'headerHeight',
     'cardWidth', 'cardHeight', 'cardGap', 'cardTitleColumn', 'cardColumns'].forEach(function (k) { self[k] = o[k]; });
    
    this._checkBoxes = !!o.checkBoxes;
    this._pag = !!o.pagination;
    this._pageSize = Math.max(1, Math.floor(+o.pageSize) || 25);
    this._pageIndex = 0;
    this._pageSizes = (Array.isArray(o.pageSizes) ? o.pageSizes : []).map(function (x) { return Math.floor(+x); }).filter(function (x) { return x > 0; });
    this._cellPad = parsePad(o.cellPadding);
    this._lineHeight = Math.max(10, +o.lineHeight || 16);
    this._wrapMode = normWrap(o.wrapMode);
    this._iconSize = Math.max(8, +o.iconSize || 16);
    this._cardIcon = Math.max(16, +o.cardIconSize || 32);
    this._imageList = o.imageList || [];
    this._card = /card/i.test(o.view);
    this._offs = null; this._lines = []; this._lineOf = []; this._cols = 1; this._hPending = false;
    // Columns / Items (lower-case columns / items are accepted too)
    this._initCols(o.Columns && o.Columns.length ? o.Columns : o.columns);
    this._setItemsArr([]);
    this._view = []; this._pView = []; this._rows = [];
    this._filters = {};
    this._sortCol = -1; this._sortOrder = 'asc';
    this._anchor = -1; this._focusRow = -1;
    this._collapsed = {}; this._handlers = {}; this._pop = null; this._resized = false;
    this._menuItems = []; this._menuOff = {};
    this._searchText = ''; this._searchLower = ''; this._statusText = '';

    // 3. Liaison sur l'élément DOM natif géré par Control
    var root_ = this.root = this.element;
    root_.className = 'exlv' + (o.gridLines ? ' grid' : '') + (this._card ? ' cards' : '');
    root_.tabIndex = 0;
    root_.dir = this.rtl ? 'rtl' : 'ltr';
    this._applyVars();
    
    if (o.theme && root.Theme) root.Theme.Apply(o.theme, root_);
    
    var me = this;
    Object.keys(COLOR_PARTS).forEach(function (n) {
      var k = n.charAt(0).toLowerCase() + n.slice(1);
      if (o[k]) me[n] = o[k];
    });

    this.scroll = document.createElement('div'); this.scroll.className = 'exlv-scroll';
    this.head = document.createElement('div'); this.head.className = 'exlv-head';
    this.body = document.createElement('div'); this.body.className = 'exlv-body';
    this.scroll.appendChild(this.head); this.scroll.appendChild(this.body);
    this.main = document.createElement('div'); this.main.className = 'exlv-main';
    this.main.appendChild(this.scroll);

    root_.appendChild(this._buildToolStrip());
    root_.appendChild(this.main);
    root_.appendChild(this._buildStatusStrip());
    
    this.ToolStripVisible = o.ShowToolStrip;
    this.StatusStripVisible = o.ShowStatusStrip;
    this._updatePagerVisibility();
    
    if (o.showViewButton) {
      this._viewBtn = this.AddToolButton('', function () { self.View = self._card ? 'Details' : 'Card'; });
      this._applyLang();
    }

    this._bind();
    this.setItems(o.Items && o.Items.length ? o.Items : o.items);
    if (this._pag && +o.pageIndex > 0) this.setPage(Math.floor(+o.pageIndex));
	// Application automatique des options de positionnement/taille (Dock, Width, Height, etc.) si transmises
    // Control._applyOptions assigns this[key] = value for EVERY key: only the layout members of Control may go through
    // (Columns / Items / rowHeight ... are already handled above and must not be overwritten by the raw option values)
    if (typeof this._applyOptions === 'function' && opts) {
      var lay = {}, LAYOUT = ['Name', 'Tag', 'Dock', 'Anchor', 'Left', 'Top', 'Width', 'Height', 'Location', 'Size', 'Visible',
        'Enabled', 'TabIndex', 'Padding', 'ToolTipText', 'Cursor', 'BorderStyle', 'ContextMenuStrip'];
      Object.keys(opts).forEach(function (k) {
        var K = k.charAt(0).toUpperCase() + k.slice(1);
        if (LAYOUT.indexOf(K) >= 0) lay[K] = opts[k];
      });
      this._applyOptions(lay);
    }
  }
 
//--------------------------------------------------------------------------------------------------------------------------------
  ExListView.FilterOperator = OPS;
 // Utilisation exclusive de l'héritage standard du framework
  var P = root.Control ? root.Control.Extend(ExListView) : ExListView.prototype;
 
//---------------------------------------------------------------------------------------------------------------------------------------
  Object.defineProperties(P, {
    hasActiveFilters: { get: function () { return Object.keys(this._filters).length > 0; } },
    totalItemCount: { get: function () { return this.Items.length; } },
    count: { get: function () { return this._view.length; } },
    selectedItems: { get: function () { return this._view.filter(function (i) { return i.selected; }); } },
    searchText: { get: function () { return this._searchText; } },
    CheckBoxes: {
      get: function () { return this._checkBoxes; },
      set: function (v) { this._checkBoxes = !!v; this._render(); }
    },
    CheckedItems: { get: function () { return this.Items.filter(function (i) { return i.checked; }); } },
    CellPadding: {                                    // 6 | '4 8' | '4 8 4 8' | { top, right, bottom, left }
      get: function () { var p = this._cellPad; return { Top: p.t, Right: p.r, Bottom: p.b, Left: p.l }; },
      set: function (v) { this._cellPad = parsePad(v); this._applyVars(); this._layout(); }
    },
    LineHeight: {
      get: function () { return this._lineHeight; },
      set: function (v) { this._lineHeight = Math.max(10, +v || 16); this._applyVars(); this._layout(); }
    },
    WrapMode: {                                       // 'NoWrap' (one line, ...) | 'Wrap' (fixed row height) | 'Content' (row fits its text)
      get: function () { return this._wrapMode; },
      set: function (v) { this._wrapMode = normWrap(v); this._layout(); }
    },
    IconSize: {
      get: function () { return this._iconSize; },
      set: function (v) { this._iconSize = Math.max(8, +v || 16); this._applyVars(); this._layout(); }
    },
    CardIconSize: {
      get: function () { return this._cardIcon; },
      set: function (v) { this._cardIcon = Math.max(16, +v || 32); this._applyVars(); this._layout(); }
    },
    ImageList: {                                      // array of image URLs / characters, used by item.imageIndex
      get: function () { return this._imageList; },
      set: function (v) { this._imageList = v || []; this._layout(); }
    },
    View: {                                           // 'Details' | 'Card'
      get: function () { return this._card ? 'Card' : 'Details'; },
      set: function (v) {
        var c = /card/i.test(v);
        if (c === this._card) return;
        this._card = c;
        this.root.classList.toggle('cards', c);
        this.scroll.scrollTop = 0;
        this._layout();
        this._applyLang();
        this._emit('viewChanged', { view: this.View });
      }
    },
    ToolStripVisible: {
      get: function () { return this._tsVisible; },
      set: function (v) { this._tsVisible = !!v; this.ts.style.display = this._tsVisible ? '' : 'none'; this._render(); }
    },
    StatusStripVisible: {
      get: function () { return this._ssVisible; },
      set: function (v) { this._ssVisible = !!v; this.ss.style.display = this._ssVisible ? '' : 'none'; this._render(); }
    },
    selectedIndices: {
      get: function () {
        var r = [];
        this._view.forEach(function (it, i) { if (it.selected) r.push(i); });
        return r;
      }
    },
    pageItems: { get: function () { return this._pView.slice(); } },
    Pagination: {
      get: function () { return this._pag; },
      set: function (v) {
        v = !!v;
        if (v === this._pag) return;
        this._pag = v;
        this._pageIndex = 0;
        this._updatePagerVisibility();
        this.scroll.scrollTop = 0;
        this._rebuild(false);
      }
    },
    PageSize: {
      get: function () { return this._pageSize; },
      set: function (v) {
        var sz = Math.max(1, Math.floor(+v) || 25);
        if (sz === this._pageSize) return;
        this._pageIndex = Math.floor(this._pageIndex * this._pageSize / sz);     // keeps the first row of the page in view
        this._pageSize = sz;
        this._fillPageSizes();
        this.scroll.scrollTop = 0;
        this._rebuild(false);
        this._emitPage();
      }
    },
    PageSizes: {
      get: function () { return this._pageSizes.slice(); },
      set: function (a) {
        this._pageSizes = (Array.isArray(a) ? a : []).map(function (x) { return Math.floor(+x); }).filter(function (x) { return x > 0; });
        this._fillPageSizes();
      }
    },
    PageIndex: {
      get: function () { return this._pageIndex; },
      set: function (v) { this.setPage(v); }
    },
    PageCount: {
      get: function () { return this._pag ? Math.max(1, Math.ceil(this._view.length / this._pageSize)) : 1; }
    }
  });
  ['Pagination', 'PageSize', 'PageSizes', 'PageIndex', 'PageCount'].forEach(function (n) {
    Object.defineProperty(P, n.charAt(0).toLowerCase() + n.slice(1), Object.getOwnPropertyDescriptor(P, n));      // camelCase alias
  });

  // ---------------------------------------------------------------- colors of each part (the theme gives the defaults)
  var COLOR_PARTS = {
    BackColor: '--exlv-bg', ForeColor: '--exlv-fg',
    HeaderBackColor: '--exlv-hdr-bg', HeaderForeColor: '--exlv-hdr-fg',
    ToolBarBackColor: '--exlv-tb-bg', ToolBarForeColor: '--exlv-tb-fg',
    StatusBarBackColor: '--exlv-sb-bg', StatusBarForeColor: '--exlv-sb-fg',
    ContextMenuBackColor: '--exlv-cm-bg', ContextMenuForeColor: '--exlv-cm-fg', ContextMenuHighlightColor: '--exlv-cm-hl',
    SelectionBackColor: '--exlv-sel-bg', SelectionForeColor: '--exlv-sel-fg', InactiveSelectionBackColor: '--exlv-sel-off-bg',
    HoverBackColor: '--exlv-hover-bg', AlternateBackColor: '--exlv-alt', GridLineColor: '--exlv-grid',
    CardBackColor: '--exlv-card-bg', FilterIndicatorColor: '--exlv-funnel'
  };
  // when only a BackColor is given, the text color is picked automatically (white or black) so it stays readable
  var AUTO_FG = {
    BackColor: '--exlv-fg-auto', HeaderBackColor: '--exlv-hdr-fg-auto', ToolBarBackColor: '--exlv-tb-fg-auto',
    StatusBarBackColor: '--exlv-sb-fg-auto', ContextMenuBackColor: '--exlv-cm-fg-auto', SelectionBackColor: '--exlv-sel-fg-auto'
  };
  var CUSTOM_CLASS = [['Items-custom', ['--exlv-bg', '--exlv-fg']], ['hdr-custom', ['--exlv-hdr-bg', '--exlv-hdr-fg']],
                      ['tb-custom', ['--exlv-tb-bg', '--exlv-tb-fg']]];

  // '#rgb', '#rrggbb', 'rgb(...)' or any CSS color name / hsl() (through a canvas) -> [r, g, b] or null
  function toRgb(v) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1];
      return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
    }
    m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(v);
    if (m) return [+m[1], +m[2], +m[3]];
    try {
      var c = document.createElement('canvas').getContext('2d');
      if (!c) return null;
      c.fillStyle = '#000'; c.fillStyle = v; var a = c.fillStyle;
      c.fillStyle = '#fff'; c.fillStyle = v;
      return a === c.fillStyle && a !== v ? toRgb(a) : null;            // same result on both bases = a valid color
    } catch (e) { return null; }
  }
  function readableOn(rgb) {                                              // white or black, whichever contrasts more
    var l = rgb.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    var L = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
    return 1.05 / (L + 0.05) >= (L + 0.05) / 0.05 ? '#ffffff' : '#000000';
  }
  function setPart(lv, name, value) {
    var st = lv.root.style, v = value == null ? '' : String(value).trim();
    if (v) st.setProperty(COLOR_PARTS[name], v); else st.removeProperty(COLOR_PARTS[name]);
    if (AUTO_FG[name]) {
      var rgb = v ? toRgb(v) : null;
      if (rgb) st.setProperty(AUTO_FG[name], readableOn(rgb)); else st.removeProperty(AUTO_FG[name]);
    }
    CUSTOM_CLASS.forEach(function (c) {
      lv.root.classList.toggle(c[0], c[1].some(function (k) { return !!st.getPropertyValue(k); }));
    });
  }
  Object.keys(COLOR_PARTS).forEach(function (n) {
    Object.defineProperty(P, n, {
      get: function () { return this.root.style.getPropertyValue(COLOR_PARTS[n]) || ''; },
      set: function (v) { setPart(this, n, v); },
      configurable: true
    });
    Object.defineProperty(P, n.charAt(0).toLowerCase() + n.slice(1), Object.getOwnPropertyDescriptor(P, n));      // camelCase alias
  });
  // back to the colors of the theme
  P.ResetColors = function () {
    var self = this;
    Object.keys(COLOR_PARTS).forEach(function (n) { setPart(self, n, ''); });
    return this;
  };
  // the context menu and the filter pop-up live in <body>: they copy the colors given to the list
  P._copyPopupVars = function (el) {
    var src = this.root.style;
    ['--exlv-cm-bg', '--exlv-cm-fg', '--exlv-cm-fg-auto', '--exlv-cm-hl'].forEach(function (n) {
      var v = src.getPropertyValue(n);
      if (v) el.style.setProperty(n, v);
    });
    el.classList.toggle('cm-custom', !!(src.getPropertyValue('--exlv-cm-bg') || src.getPropertyValue('--exlv-cm-fg')) && !src.getPropertyValue('--exlv-cm-hl'));
  };

  Object.defineProperty(P, 'Theme', {                // 'Light' | 'Dark' | 'Blue' | 'GreenNature' (needs Theme.js)
    get: function () { return this.root.getAttribute('data-wf-theme') || (root.Theme ? root.Theme.Current : 'Light'); },
    set: function (v) { if (root.Theme) root.Theme.Apply(v, this.root); }
  });
  ['ToolStripVisible', 'StatusStripVisible', 'CheckBoxes', 'CheckedItems', 'CellPadding', 'LineHeight', 'WrapMode', 'IconSize',
   'CardIconSize', 'ImageList', 'View', 'Theme'].forEach(function (n) {       // camelCase aliases
    Object.defineProperty(P, n.charAt(0).toLowerCase() + n.slice(1), Object.getOwnPropertyDescriptor(P, n));
  });

  // ---------------------------------------------------------------- events
  P.on = function (n, fn) { (this._handlers[n] = this._handlers[n] || []).push(fn); return this; };
  P.off = function (n, fn) {
    this._handlers[n] = (this._handlers[n] || []).filter(function (f) { return f !== fn; });
    return this;
  };
  P._emit = function (n, arg) {
    var self = this;
    if (n === 'selectedIndexChanged') this._updateStatus();
    (this._handlers[n] || []).slice().forEach(function (f) { f.call(self, arg); });
  };

  // ---------------------------------------------------------------- pagination
  P.setPage = function (i) {
    i = Math.min(Math.max(0, Math.floor(+i) || 0), this.PageCount - 1);
    if (!this._pag || i === this._pageIndex) return this;
    this._pageIndex = i;
    this.scroll.scrollTop = 0;
    this._rebuild(false);
    this._emitPage();
    return this;
  };
  P.nextPage = function () { return this.setPage(this._pageIndex + 1); };
  P.prevPage = function () { return this.setPage(this._pageIndex - 1); };
  P.firstPage = function () { return this.setPage(0); };
  P.lastPage = function () { return this.setPage(this.PageCount - 1); };
  P._emitPage = function () {
    this._emit('pageChanged', { pageIndex: this._pageIndex, pageCount: this.PageCount, pageSize: this._pageSize });
  };
  P._updatePagerVisibility = function () { if (this.pagerBar) this.pagerBar.style.display = this._pag ? '' : 'none'; };

  P._buildPagerBar = function () {
    var self = this, g = document.createElement('span');
    g.className = 'exlv-pg';
    g.innerHTML = '<span class="exlv-sss"></span>' +
      '<span class="exlv-pg-z"><span class="exlv-pg-t"></span><select class="exlv-pg-s"></select></span>' +
      '<button type="button" class="exlv-tb exlv-pg-b" data-p="first">\u00AB</button>' +
      '<button type="button" class="exlv-tb exlv-pg-b" data-p="prev">\u2039</button>' +
      '<span class="exlv-pg-t"></span>' +
      '<button type="button" class="exlv-tb exlv-pg-b" data-p="next">\u203A</button>' +
      '<button type="button" class="exlv-tb exlv-pg-b" data-p="last">\u00BB</button>';
    var t = g.querySelectorAll('.exlv-pg-t');
    this.pagerBar = g;
    this.pgSizeBox = g.querySelector('.exlv-pg-z');
    this.pgSizeLbl = t[0]; this.pgSize = g.querySelector('.exlv-pg-s');
    this.pgInfo = t[1];
    this.pgBtn = {};
    [].forEach.call(g.querySelectorAll('.exlv-pg-b'), function (b) { self.pgBtn[b.dataset.p] = b; });
    g.addEventListener('click', function (e) {
      var b = e.target.closest('.exlv-pg-b');
      if (!b || b.disabled) return;
      var k = b.dataset.p;
      if (k === 'first') self.firstPage(); else if (k === 'prev') self.prevPage();
      else if (k === 'next') self.nextPage(); else self.lastPage();
      self.root.focus();
    });
    this.pgSize.addEventListener('change', function () { self.PageSize = +self.pgSize.value; self.root.focus(); });
    this._applyPagerLang();
    this._updatePagerVisibility();
    return g;
  };

  // page-size selector: the configured sizes (+ the current one when it is not in the list)
  P._fillPageSizes = function () {
    if (!this.pagerBar) return;
    var cur = this._pageSize, sizes = this._pageSizes.slice();
    if (sizes.indexOf(cur) < 0) { sizes.push(cur); sizes.sort(function (a, b) { return a - b; }); }
    this.pgSize.innerHTML = sizes.map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
    this.pgSize.value = String(cur);
    this.pgSizeBox.style.display = this._pageSizes.length ? '' : 'none';
  };

  P._applyPagerLang = function () {
    if (!this.pagerBar) return;
    var T = this.rtl ? LABELS.rtl : LABELS.ltr;
    this.pgSizeLbl.textContent = T.pgSize;
    this.pgBtn.first.title = T.pgFirst; this.pgBtn.prev.title = T.pgPrev;
    this.pgBtn.next.title = T.pgNext; this.pgBtn.last.title = T.pgLast;
    this._fillPageSizes();
    this._updatePagerUI();
  };

  P._updatePagerUI = function () {
    if (!this.pagerBar || !this._pag) return;
    var T = this.rtl ? LABELS.rtl : LABELS.ltr, n = this._view.length, ps = this._pageSize;
    var pc = this.PageCount, pi = this._pageIndex, a = n ? pi * ps + 1 : 0, b = Math.min(n, (pi + 1) * ps);
    this.pgInfo.textContent = T.pgInfo.replace('{0}', pi + 1).replace('{1}', pc);
    this.pgInfo.title = T.pgRange.replace('{0}', a).replace('{1}', b).replace('{2}', n);      // 26–50 / 103 as a tooltip
    this.pgBtn.first.disabled = this.pgBtn.prev.disabled = pi <= 0;
    this.pgBtn.next.disabled = this.pgBtn.last.disabled = pi >= pc - 1;
  };

  // ---------------------------------------------------------------- Items / Columns
  P.setItems = function (list) {
    var self = this, had = this.hasActiveFilters;           // reloading data drops the filters (like the WinForms control)
    this._filters = {};
    (this.Items || []).forEach(function (it) { it._owner = null; });
    var arr = (list || []).map(function (x) { return normItem(x, self); });
    arr.forEach(function (it) { it._owner = self; });
    this._setItemsArr(arr);
    this._pageIndex = 0;
    this._rebuild(had);
  };
  P.addItems = function (list) {
    var self = this, add = [];
    (list || []).forEach(function (x) {
      var it = normItem(x, self);
      if (it._owner === self) return;                       // already in this list
      it._owner = self;
      self.Items.push(it);
      add.push(it);
    });
    this._rebuild(this.hasActiveFilters);      // new rows obey the active filters
    return add;
  };
  P.clear = function () { this.setItems([]); };
  P.removeItems = function (list) {
    var self = this, gone = new Set(list || []);
    gone.forEach(function (it) { if (it && it._owner === self) it._owner = null; });
    this._setItemsArr(this.Items.filter(function (it) { return !gone.has(it); }));
    this._rebuild(true);
  };
  // this.Items stays a plain array of ListViewItem (read everywhere in this file); the WinForms collection members are attached to it.
  P._setItemsArr = function (arr) {
    var self = this;
    var def = function (n, fn) { Object.defineProperty(arr, n, { value: fn, writable: true, configurable: true, enumerable: false }); };
    def('Add', function (x) { return self._itemInsert(-1, x); });
    def('AddRange', function (list) { self.addItems(list); });
    def('Insert', function (i, x) { return self._itemInsert(i, x); });
    def('Remove', function (it) { if (it && it._owner === self) self.removeItems([it]); });
    def('RemoveAt', function (i) { var it = self.Items[i]; if (!it) return null; self.removeItems([it]); return it; });
    def('Clear', function () { self.setItems([]); });
    def('IndexOf', function (it) { return self.Items.indexOf(it); });
    def('Contains', function (it) { return self.Items.indexOf(it) >= 0; });
    Object.defineProperty(arr, 'Count', { get: function () { return self.Items.length; }, configurable: true, enumerable: false });
    this.Items = arr;
  };
  P._itemInsert = function (index, x) {
    var it = normItem(x, this);
    if (it._owner === this) return it;
    it._owner = this;
    if (index == null || index < 0 || index >= this.Items.length) this.Items.push(it); else this.Items.splice(index, 0, it);
    this._rebuild(this.hasActiveFilters);
    return it;
  };
  // BeginUpdate() ... EndUpdate(): many changes, one single refresh
  P.BeginUpdate = function () { this._upd = (this._upd || 0) + 1; };
  P.EndUpdate = function () {
    this._upd = Math.max(0, (this._upd || 0) - 1);
    if (!this._upd && this._updDirty) {
      var e = this._updEmit;
      this._updDirty = false; this._updEmit = false;
      this._rebuild(e);
    }
  };
  // a sub item / item changed: kind = 'text' (filters / sort / search may be affected), 'style' (colors, fonts, checked ...), 'rebuild'
  P._touched = function (kind) {
    if (this._upd) { this._updDirty = true; return; }
    if (kind === 'rebuild' || (kind === 'text' && (this.hasActiveFilters || this._searchLower || this._sortCol >= 0))) this._rebuild(false);
    else this._layout();
  };
  // ---------------------------------------------------------------- Columns (WinForms ColumnHeaderCollection)
  // this.Columns stays a plain array of ColumnHeader (read everywhere in this file); the WinForms members are attached to it.
  P._initCols = function (list) {
    var self = this, a = (list || []).map(normCol);
    a.forEach(function (h, i) {
      if (h._owner && h._owner !== self) throw new Error('ColumnHeader already belongs to another ExListView (use Clone())');
      if (a.indexOf(h) !== i) throw new Error('The same ColumnHeader cannot be added twice');
    });
    a.forEach(function (h) { h._owner = self; h._idx = -1; });
    var def = function (n, fn) { Object.defineProperty(a, n, { value: fn, writable: true, configurable: true, enumerable: false }); };
    def('Add', function (x, w, al) { return self._colInsert(-1, x, w, al); });
    def('Insert', function (i, x, w, al) { return self._colInsert(i, x, w, al); });
    def('AddRange', function (arr) {
      self._colBatch = true;
      try { (arr || []).forEach(function (x) { self._colInsert(-1, x); }); } finally { self._colBatch = false; }
      self._rebuild(false);
    });
    def('Remove', function (h) { var i = self.Columns.indexOf(h); if (i >= 0) self._colRemove(i); });
    def('RemoveAt', function (i) { return self._colRemove(i); });
    def('Clear', function () { self.setColumns([]); });
    def('IndexOf', function (h) { return self.Columns.indexOf(h); });
    def('Contains', function (h) { return self.Columns.indexOf(h) >= 0; });
    Object.defineProperty(a, 'Count', { get: function () { return self.Columns.length; }, configurable: true, enumerable: false });
    this.Columns = a;
  };
  // filters and the sort column are addressed by column index: follow the columns when one is inserted / removed
  P._remapCols = function (fn) {
    var self = this, f = {};
    Object.keys(this._filters).forEach(function (k) { var j = fn(+k); if (j >= 0) f[j] = self._filters[k]; });
    this._filters = f;
    if (this._sortCol >= 0) this._sortCol = fn(this._sortCol);
  };
  P._colInsert = function (index, x, w, al) {
    var h = x instanceof ColumnHeader ? x : new ColumnHeader(x, w, al);
    if (h._owner === this) return h;
    if (h._owner) throw new Error('ColumnHeader already belongs to another ExListView (use Clone())');
    var n = this.Columns.length;
    if (index == null || index < 0) index = h._idx >= 0 ? h._idx : n;
    index = Math.min(Math.floor(index), n);
    h._idx = -1; h._owner = this;
    this.Columns.splice(index, 0, h);
    this._remapCols(function (i) { return i >= index ? i + 1 : i; });
    if (!this._colBatch) this._rebuild(false);
    return h;
  };
  P._colRemove = function (index) {
    if (!(index >= 0 && index < this.Columns.length)) return null;
    var h = this.Columns.splice(index, 1)[0];
    h._owner = null;
    this._remapCols(function (i) { return i === index ? -1 : i > index ? i - 1 : i; });
    this._rebuild(false);
    return h;
  };
  P.addColumn = function (c) { return this._colInsert(-1, c); };
  P.setColumns = function (cols) {
    this.Columns.forEach(function (h) { h._owner = null; });
    this._initCols(cols);
    this._filters = {}; this._sortCol = -1; this._pageIndex = 0; this._rebuild(false);
  };
  // lower-case aliases of the previous API (lv.columns / lv.items)
  Object.defineProperties(P, {
    columns: { get: function () { return this.Columns; }, set: function (v) { this.setColumns(v); } },
    items: { get: function () { return this.Items; }, set: function (v) { this.setItems(v); } }
  });

  // ---------------------------------------------------------------- filtering API
  P.getFilter = function (col) { var f = this._filters[col]; return f ? f.text : ''; };
  P.getFilterOperator = function (col) { var f = this._filters[col]; return f ? f.op : OPS.Contains; };

  // setFilter(col, text)  or  setFilter(col, op, text). Returns false when text is not valid for that operator.
  P.setFilter = function (col, a, b) {
    var op = arguments.length < 3 ? OPS.Contains : a;
    var text = arguments.length < 3 ? a : b;
    if (col < 0 || col >= this.Columns.length) return false;
    text = text == null ? '' : String(text);
    if (!text.trim()) {
      if (this._filters[col]) { delete this._filters[col]; this._pageIndex = 0; this._rebuild(true); }
      return true;
    }
    var cur = this._filters[col];
    if (cur && cur.op === op && cur.text === text) return true;
    var f = this._buildFilter(col, op, text);
    if (!f) return false;
    this._filters[col] = f;
    this._pageIndex = 0;
    this._rebuild(true);
    return true;
  };
  P.clearFilters = function () {
    if (!this.hasActiveFilters) return;
    this._filters = {};
    this._pageIndex = 0;
    this._rebuild(true);
  };

  P._buildFilter = function (col, op, text) {
    var f = { op: op, text: text, lower: lc(text), kind: 'text' };
    if (op === OPS.Contains || op === OPS.NotContains) return f;
    var kind = this._kind(col);
    if (kind === 'number') {
      var n = parseNumber(text);
      if (n === null) return null;
      f.kind = 'number'; f.num = n;
    } else if (kind === 'date') {
      var d = parseDate(text);
      if (d === null) return null;
      f.kind = 'date'; f.date = d;
    } else if (op !== OPS.Equal && op !== OPS.NotEqual) {
      return null;                              // > < >= <= make no sense on a text column
    }
    return f;
  };

  // samples the column to know whether it holds numbers, dates or text
  P._kind = function (col) {
    var Items = this.Items, total = Items.length, step = Math.max(1, Math.floor(total / 300)), ne = 0, n = 0, d = 0;
    for (var i = 0; i < total; i += step) {
      var t = Items[i].cells[col];
      if (t == null || !String(t).trim()) continue;
      ne++;
      if (parseNumber(t) !== null) n++; else if (parseDate(t) !== null) d++;
    }
    if (!ne) return 'text';
    if (n * 10 >= ne * 9) return 'number';
    if (d * 10 >= ne * 9) return 'date';
    return 'text';
  };

  // ---------------------------------------------------------------- sorting
  P.sort = function (col, order) {
    this._sortCol = col; this._sortOrder = order === 'desc' ? 'desc' : 'asc';
    this._pageIndex = 0;
    this._rebuild(false);
  };

  P._sortView = function (view) {
    var c = this._sortCol;
    if (c < 0 || c >= this.Columns.length) return view;
    var kind = this._kind(c), dir = this._sortOrder === 'desc' ? -1 : 1;
    var coll = new Intl.Collator(undefined, { sensitivity: 'base' });
    var keyed = view.map(function (it, i) {
      var t = it.cells[c] || '', k = kind === 'number' ? parseNumber(t) : kind === 'date' ? parseDate(t) : t;
      if (kind !== 'text' && k === null) k = -Infinity;
      return { it: it, k: k, i: i };
    });
    keyed.sort(function (a, b) {
      var r = kind === 'text' ? coll.compare(a.k, b.k) : (a.k < b.k ? -1 : a.k > b.k ? 1 : 0);
      return r * dir || a.i - b.i;
    });
    return keyed.map(function (x) { return x.it; });
  };

  // ---------------------------------------------------------------- rebuild (filter -> sort -> group -> render)
  P._rebuild = function (emitFilters)
  {
    var self = this;
// --- PROTECTION DE SÉCURITÉ ---
    this._filters = this._filters || {};
    if (!this.Items) return; // Empêche le plantage si l'initialisation est en cours
    if (this._upd) { this._updDirty = true; this._updEmit = this._updEmit || !!emitFilters; return; }     // between BeginUpdate / EndUpdate
    
    var fl = Object.keys(this._filters).map(function (k) { return [+k, self._filters[k]]; });
    var sq = this._searchLower;
    var view = (fl.length || sq) ? this.Items.filter(function (it) {
      if (sq && !it.cells.some(function (c) { return lc(c).indexOf(sq) >= 0; })) return false;
      return fl.every(function (p) { return cellMatches(p[1], it.cells[p[0]]); });
    }) : this.Items.slice();
    view = this._sortView(view);
    this._view = view;
    // ... (le reste de la fonction _rebuild ne change pas)

    var pv = view;                               // rows of the current page (all rows when pagination is off)
    if (this._pag) {
      this._pageIndex = Math.max(0, Math.min(this._pageIndex, Math.ceil(view.length / this._pageSize) - 1));
      pv = view.slice(this._pageIndex * this._pageSize, (this._pageIndex + 1) * this._pageSize);
    }
    this._pView = pv;

    var rows = [], k = 0;
    if (this.showGroups && pv.some(function (it) { return it.group; })) {
      var order = [], map = Object.create(null);
      pv.forEach(function (it) {
        var g = it.group || '';
        if (!(g in map)) { map[g] = []; order.push(g); }
        map[g].push(it);
      });
      order.forEach(function (g) {
        if (g !== '') rows.push({ g: g, n: map[g].length });
        if (g === '' || !self._collapsed[g]) map[g].forEach(function (it) { rows.push({ it: it, k: k++ }); });
      });
    } else {
      pv.forEach(function (it) { rows.push({ it: it, k: k++ }); });
    }
    this._rows = rows;
    this._anchor = -1; this._focusRow = -1;
    this._layout();
    this._updateStatus();
    this._updatePagerUI();
    if (emitFilters) this._emit('filtersChanged');
  };

  P._totalW = function () {
    return this.Columns.reduce(function (s, c) { return s + c.width; }, 0);
  };

  P._layout = function () {
    if (this._card) {                                   // card view: no header, the cards fill the width
      this._cardLayout();
      this.head.style.display = 'none';
      this.head.style.width = ''; this.body.style.width = '';
      this.body.style.height = this._cardTotal + 'px';
      this._render();
      return;
    }
    this.head.style.display = '';
    this._calcHeights();
    var W = this._totalW() + 'px';
    this.head.style.width = W; this.head.style.height = this.headerHeight + 'px';
    this.body.style.width = W; this.body.style.height = this._bodyH() + 'px';
    this._renderHead();
    this._render();
  };

  // ---------------------------------------------------------------- rendering
  P._renderHead = function () {
    var h = [], self = this;
    this.Columns.forEach(function (c, i) {
      var inner = esc(c.text);
      if (self._sortCol === i) inner += '<span class="exlv-sort ' + self._sortOrder + '"></span>';
      if (self._filters[i] && c.width >= 28) {
        // funnel goes on the side opposite to the text (centered Columns: right, or left in RTL)
        var onLeft = self.rtl;
        if (c.align === 'right') onLeft = true; else if (c.align === 'left') onLeft = false;
        inner += '<svg class="exlv-fn" width="10" height="10" viewBox="0 0 10 10" style="' + (onLeft ? 'left' : 'right') +
          ':5px"><polygon points="0,0 10,0 6,5 6,10 4,8 4,5"/></svg>';
      }
      h.push('<div class="exlv-h" data-c="' + i + '" style="width:' + c.width + 'px;text-align:' + c.align +
        ';line-height:' + (self.headerHeight - 1) + 'px">' + inner + '<span class="exlv-rs"></span></div>');
    });
    this.head.innerHTML = h.join('');
  };

  P._render = function () {
    if (this._card) { this._renderCards(); return; }
    if (this._hPending && this.scroll.clientHeight) {          // row heights could not be measured before
      this._calcHeights();
      this.body.style.height = this._bodyH() + 'px';
    }
    var rows = this._rows, rh = this.rowHeight, cols = this.Columns, W = this._totalW();
    var st = this.scroll.scrollTop, vh = (this.scroll.clientHeight || 400) - this.headerHeight;
    var s = Math.max(0, this._rowAt(st) - 3), e = Math.min(rows.length, this._rowAt(st + vh) + 4), h = [];
    for (var i = s; i < e; i++) {
      var r = rows[i], pos = 'top:' + this._rowTop(i) + 'px;height:' + this._rowH(i) + 'px;line-height:' + rh + 'px;width:' + W + 'px';
      if (r.g !== undefined) {
        h.push('<div class="exlv-row exlv-grp" data-i="' + i + '" style="' + pos + '"><span class="exlv-tw">' +
          (this._collapsed[r.g] ? '\u25B6' : '\u25BC') + '</span>' + esc(r.g) + ' (' + r.n + ')</div>');
        continue;
      }
      var it = r.it, style = pos;
      var cls = 'exlv-row' + (it.selected ? ' sel' : '') +
        (this.canAlternateBackColor && r.k % 2 === 1 && !it.backColor ? ' alt' : '');
      if (!it.selected) {
        if (it.backColor) style += ';background:' + it.backColor;
        if (it.foreColor) style += ';color:' + it.foreColor;
      }
      h.push('<div class="' + cls + '" data-i="' + i + '" style="' + style + '">');
      for (var c = 0; c < cols.length; c++) {
        var wrapped = this._modeOf(cols[c]) !== 'NoWrap';
        h.push('<div class="exlv-cell' + (wrapped ? ' top' : '') + '" style="width:' + cols[c].width + 'px' + cellBoxStyle(it, c, it.selected) + '">' +
          (c === 0 && this.checkBoxes ? '<input type="checkbox" class="exlv-cb"' + (it.checked ? ' checked' : '') + '>' : '') +
          (c === 0 ? iconHtml(this._iconOf(it)) : '') +
          '<span class="exlv-ct' + (wrapped ? ' w' : '') + '" style="text-align:' + cols[c].align + cellSpanStyle(it, c, it.selected) + '">' +
          (cols[c].rating ? starsHtml(it.cells[c]) : cellInner(it, c)) + '</span></div>');
      }
      h.push('</div>');
    }
    this.body.innerHTML = h.join('');
  };

  // ---------------------------------------------------------------- padding / wrap / icons / row heights
  P._modeOf = function (col) { return col.wrap || this._wrapMode; };
  P._iconOf = function (it) {
    if (it.icon) return it.icon;
    return it.imageIndex != null && it.imageIndex >= 0 ? (this._imageList[it.imageIndex] || '') : '';
  };
  P._hh = function () { return this._card ? 0 : this.headerHeight; };

  P._applyVars = function () {
    var st = this.root.style, p = this._cellPad;
    st.setProperty('--exlv-pt', p.t + 'px'); st.setProperty('--exlv-pr', p.r + 'px');
    st.setProperty('--exlv-pb', p.b + 'px'); st.setProperty('--exlv-pl', p.l + 'px');
    st.setProperty('--exlv-lh', this._lineHeight + 'px');
    st.setProperty('--exlv-is', this._iconSize + 'px');
    st.setProperty('--exlv-cis', this._cardIcon + 'px');
  };

  // 'Content' Columns: every row is as tall as its tallest wrapped cell (measured once, cached on the item)
  P._calcHeights = function () {
    this._offs = null;
    this._hPending = false;
    if (this._card) return;
    var self = this, cols = this.Columns, wcols = [];
    cols.forEach(function (c, i) { if (self._modeOf(c) === 'Content') wcols.push(i); });
    if (!wcols.length) return;
    var rows = this._rows, rh = this.rowHeight, p = this._cellPad, lh = this._lineHeight;
    var padV = Math.max(p.t, 3) + Math.max(p.b, 3);
    var sig = wcols.map(function (i) { return cols[i].width; }).join(',') + '|' +
      [p.l, p.r, lh, this._iconSize, this.checkBoxes ? 1 : 0, padV].join(',');
    var need = [];
    rows.forEach(function (r) {
      if (r.it && !(r.it._hc && r.it._hc.sig === sig && r.it._hc.key === r.it.cells.join('\u0001'))) need.push(r.it);
    });
    if (need.length) {
      var meas = this._meas;
      if (!meas) { meas = this._meas = document.createElement('div'); meas.className = 'exlv-meas'; this.root.appendChild(meas); }
      meas.innerHTML = '';
      var nodes = [];
      need.forEach(function (it) {
        wcols.forEach(function (ci) {
          var d = document.createElement('div');
          var extra = ci === 0 ? (self.checkBoxes ? 19 : 0) + (self._iconOf(it) ? self._iconSize + 6 : 0) : 0;
          d.className = 'exlv-ct w';
          d.style.width = Math.max(10, cols[ci].width - p.l - p.r - extra) + 'px';
          d.style.lineHeight = lh + 'px';
          d.innerHTML = cellInner(it, ci) || '\u00A0';
          d.style.cssText += cellSpanStyle(it, ci, true);
          meas.appendChild(d);
          nodes.push(d);
        });
      });
      var total = 0;
      var hs = nodes.map(function (d) { var x = d.offsetHeight; total += x; return x; });   // one layout pass for all rows
      meas.innerHTML = '';
      if (!total) this._hPending = true;                  // list not displayed yet: measured when it appears
      else {
        var k = 0;
        need.forEach(function (it) {
          var m = 0;
          wcols.forEach(function () { m = Math.max(m, hs[k++]); });
          it._hc = { sig: sig, key: it.cells.join('\u0001'), h: Math.max(rh, m + padV) };
        });
      }
    }
    var offs = new Array(rows.length + 1), y = 0;
    for (var i = 0; i < rows.length; i++) {
      offs[i] = y;
      var it2 = rows[i].it;
      y += it2 && it2._hc && it2._hc.sig === sig ? it2._hc.h : rh;
    }
    offs[rows.length] = y;
    this._offs = offs;
  };

  // forces the row heights to be measured again (after editing item.cells from your own code)
  P.refresh = function () {
    this.Items.forEach(function (it) { it._hc = null; });
    this._layout();
    return this;
  };

  P._rowTop = function (i) {
    if (this._card) { var ln = this._lines[this._lineOf[i]]; return ln ? ln.top : 0; }
    return this._offs ? this._offs[i] : i * this.rowHeight;
  };
  P._rowH = function (i) {
    if (this._card) { var ln = this._lines[this._lineOf[i]]; return ln ? ln.h : this.rowHeight; }
    return this._offs ? this._offs[i + 1] - this._offs[i] : this.rowHeight;
  };
  P._bodyH = function () { return this._offs ? this._offs[this._rows.length] : this._rows.length * this.rowHeight; };
  P._rowAt = function (y) {                              // index of the row at body position y
    if (!this._offs) return Math.floor(y / this.rowHeight);
    var a = 0, b = this._rows.length - 1;
    while (a < b) { var m = (a + b + 1) >> 1; if (this._offs[m] <= y) a = m; else b = m - 1; }
    return a;
  };

  // ---------------------------------------------------------------- card view
  P._cardFields = function () {
    var cols = this.Columns, t = this.cardTitleColumn;
    if (t == null || t < 0 || t >= cols.length) {
      t = 0;
      for (var i = 0; i < cols.length; i++) if (!cols[i].rating) { t = i; break; }
    }
    var list = Array.isArray(this.cardColumns) ? this.cardColumns : cols.map(function (c, i) { return i; });
    return { title: t, fields: list.filter(function (i) { return i !== t && cols[i]; }) };
  };

  // cards are laid out in lines: as many as fit in the width (like a CSS grid with a minimum card width)
  P._cardLayout = function () {
    var gap = this.cardGap, fl = this._cardFields(), rows = this._rows;
    var avail = Math.max(50, (this.scroll.clientWidth || 600) - gap * 2);
    var n = Math.max(1, Math.floor((avail + gap) / (this.cardWidth + gap)));
    var cw = (avail - gap * (n - 1)) / n;
    var ch = this.cardHeight === 'auto' || this.cardHeight == null
      ? 16 + Math.max(this._cardIcon, 20) + 4 + fl.fields.length * 18 + 2 : +this.cardHeight;
    var gh = this.rowHeight + 4, lines = [], lineOf = new Array(rows.length), y = gap, cur = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].g !== undefined) {
        cur = null;
        lines.push({ top: y, h: gh, g: i }); lineOf[i] = lines.length - 1; y += gh + gap;
      } else {
        if (!cur || cur.Items.length >= n) { cur = { top: y, h: ch, Items: [] }; lines.push(cur); y += ch + gap; }
        cur.Items.push(i); lineOf[i] = lines.length - 1;
      }
    }
    this._lines = lines; this._lineOf = lineOf; this._cols = n; this._cw = cw; this._ch = ch;
    this._cardTotal = y; this._cardW = this.scroll.clientWidth; this._fl = fl;
  };

  P._renderCards = function () {
    if (this.scroll.clientWidth && this.scroll.clientWidth !== this._cardW) {       // the list was resized
      this._cardLayout();
      this.body.style.height = this._cardTotal + 'px';
    }
    var self = this, lines = this._lines, rows = this._rows, cols = this.Columns, gap = this.cardGap, fl = this._fl;
    var st = this.scroll.scrollTop, vh = this.scroll.clientHeight || 400, cw = this._cw, ch = this._ch, h = [];
    var a = 0, b = lines.length - 1;
    while (a < b) { var m = (a + b) >> 1; if (lines[m].top + lines[m].h < st) a = m + 1; else b = m; }
    for (var li = Math.max(0, a - 1); li < lines.length && lines[li].top <= st + vh + 40; li++) {
      var ln = lines[li];
      if (ln.g !== undefined) {
        var gr = rows[ln.g];
        h.push('<div class="exlv-row exlv-grp" data-i="' + ln.g + '" style="top:' + ln.top + 'px;height:' + ln.h + 'px;line-height:' +
          ln.h + 'px;width:' + Math.max(0, (this.scroll.clientWidth || 600) - gap * 2) + 'px;inset-inline-start:' + gap + 'px">' +
          '<span class="exlv-tw">' + (this._collapsed[gr.g] ? '\u25B6' : '\u25BC') + '</span>' + esc(gr.g) + ' (' + gr.n + ')</div>');
        continue;
      }
      ln.Items.forEach(function (ri, k) {
        var it = rows[ri].it;
        h.push('<div class="exlv-row exlv-card' + (it.selected ? ' sel' : '') + '" data-i="' + ri + '" style="inset-inline-start:' +
          (gap + k * (cw + gap)) + 'px;top:' + ln.top + 'px;width:' + cw + 'px;height:' + ch + 'px' +
          (it.backColor && !it.selected ? ';background:' + it.backColor : '') + '">' +
          '<div class="exlv-card-h">' +
          (self.checkBoxes ? '<input type="checkbox" class="exlv-cb"' + (it.checked ? ' checked' : '') + '>' : '') +
          iconHtml(self._iconOf(it)) + '<span class="exlv-card-t">' + cellInner(it, fl.title) + '</span></div>' +
          fl.fields.map(function (c) {
            return '<div class="exlv-card-f"><span class="k">' + esc(cols[c].text) + '</span><span class="v">' +
              (cols[c].rating ? starsHtml(it.cells[c]) : cellInner(it, c)) + '</span></div>';
          }).join('') + '</div>');
      });
    }
    this.body.innerHTML = h.join('');
  };

  // ---------------------------------------------------------------- selection
  P._select = function (i, e) {
    var rows = this._rows, row = rows[i];
    if (!row || !row.it) return;
    var Items = this.Items;
    if (this.multiSelect && e.shiftKey && this._anchor >= 0) {
      if (!e.ctrlKey) Items.forEach(function (x) { x.selected = false; });
      var a = Math.min(this._anchor, i), b = Math.max(this._anchor, i);
      for (var j = a; j <= b; j++) if (rows[j].it) rows[j].it.selected = true;
    } else if (this.multiSelect && (e.ctrlKey || e.metaKey)) {
      row.it.selected = !row.it.selected; this._anchor = i;
    } else {
      Items.forEach(function (x) { x.selected = false; });
      row.it.selected = true; this._anchor = i;
    }
    this._focusRow = i;
    this._render();
    this._emit('selectedIndexChanged');
  };
  P.selectAll = function () {
    if (!this.multiSelect) return;
    this._pView.forEach(function (it) { it.selected = true; });
    this._render(); this._emit('selectedIndexChanged');
  };
  // check (or uncheck) every row currently shown; fires 'itemChecked' for each row that changed
  P.checkAll = function (on) {
    on = on !== false;
    var self = this;
    this._pView.forEach(function (it) {
      if (it.checked === on) return;
      it.checked = on;
      self._emit('itemChecked', it);
    });
    this._render();
    return this;
  };
  P.uncheckAll = function () { return this.checkAll(false); };
  P.clearSelection = function () {
    this.Items.forEach(function (it) { it.selected = false; });
    this._render(); this._emit('selectedIndexChanged');
  };
  P.ensureVisible = function (rowIndex) {
    var sc = this.scroll, vh = sc.clientHeight - this._hh(), top = this._rowTop(rowIndex), h = this._rowH(rowIndex);
    if (top < sc.scrollTop) sc.scrollTop = top;
    else if (top + h > sc.scrollTop + vh) sc.scrollTop = top + h - vh;
  };

  // ---------------------------------------------------------------- ToolStrip (search box + button + custom buttons)
  var ICON_SEARCH = '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" style="fill:var(--wf-press,#dcebfa);stroke:var(--wf-accent,#2a6fb5)" ' +
    'stroke-width="1.5"/><path d="M10 10l4.5 4.5" style="stroke:var(--wf-accent,#2a6fb5)" stroke-width="2" stroke-linecap="round"/></svg>';
  var GRIP = '<svg class="exlv-grip" width="12" height="12" viewBox="0 0 12 12" style="fill:var(--wf-text-off,#9a9a9a)"><circle cx="10" cy="2" r="1.1"/>' +
    '<circle cx="6" cy="6" r="1.1"/><circle cx="10" cy="6" r="1.1"/><circle cx="2" cy="10" r="1.1"/>' +
    '<circle cx="6" cy="10" r="1.1"/><circle cx="10" cy="10" r="1.1"/></svg>';

  P._buildToolStrip = function () {
    var self = this, ts = document.createElement('div'), timer = null;
    ts.className = 'exlv-ts';
    ts.innerHTML = '<div class="exlv-tl"></div><div class="exlv-spring"></div>' +
      '<input class="exlv-tt" type="text" spellcheck="false">' +
      '<button type="button" class="exlv-tb exlv-go">' + ICON_SEARCH + '<span></span></button>';
    this.ts = ts;
    this.tsLeft = ts.querySelector('.exlv-tl');
    this.tsInput = ts.querySelector('.exlv-tt');
    this.tsGo = ts.querySelector('.exlv-go');

    this.tsInput.addEventListener('input', function () {
      if (!self.searchOnType) return;
      clearTimeout(timer);
      timer = setTimeout(function () { self.search(self.tsInput.value); }, 300);
    });
    this.tsInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); self.search(self.tsInput.value); }
      else if (e.key === 'Escape') { clearTimeout(timer); self.tsInput.value = ''; self.search(''); }
    });
    this.tsGo.addEventListener('click', function () {
      clearTimeout(timer);
      self.search(self.tsInput.value);
      self.tsInput.focus();
    });
    this._applyLang();
    return ts;
  };

  // lv.AddToolButton('Actualiser', function (selectedItems) { ... })  -> returns the <button> (use .disabled)
  P.AddToolButton = function (text, fn, enabled) {
    var self = this, b = document.createElement('button');
    b.type = 'button'; b.className = 'exlv-tb'; b.textContent = text; b.disabled = enabled === false;
    b.addEventListener('click', function () { if (fn) fn.call(self, self.selectedItems); });
    if (this.tsLeft) this.tsLeft.appendChild(b);
    return b;
  };
  P.AddToolSeparator = function () {
    if (this.tsLeft) {
      var s = document.createElement('span');
      s.className = 'exlv-tsep';
      this.tsLeft.appendChild(s);
    }
    return this;
  };
  ['AddToolButton', 'AddToolSeparator'].forEach(function (n) { P[n.charAt(0).toLowerCase() + n.slice(1)] = P[n]; });

  // search in every cell (combined with the column filters); '' removes it
  P.search = function (text) {
    text = text == null ? '' : String(text).trim();
    if (text === this._searchText) return this;
    this._searchText = text;
    this._searchLower = lc(text);
    this._pageIndex = 0;
    if (this.tsInput && this.tsInput.value.trim() !== text) this.tsInput.value = text;
    this._rebuild(true);
    return this;
  };
  P.clearSearch = function () { return this.search(''); };

  // ---------------------------------------------------------------- StatusStrip (Items / selected counters)
  P._buildStatusStrip = function () {
    var ss = document.createElement('div');
    ss.className = 'exlv-ss';
    ss.innerHTML = '<span class="exlv-ssl"></span><span class="exlv-sss"></span><span class="exlv-ssl"></span>' +
      '<span class="exlv-spring"></span><span class="exlv-ssl"></span>' + GRIP;
    var l = ss.querySelectorAll('.exlv-ssl');
    this.ss = ss; this.ssCount = l[0]; this.ssSel = l[1]; this.ssText = l[2];
    ss.insertBefore(this._buildPagerBar(), this.ssText);          // paging controls live in the status bar
    this._updateStatus();
    return ss;
  };
  P.setStatusText = function (text) { this._statusText = text == null ? '' : String(text); this._updateStatus(); return this; };

  P._updateStatus = function () {
    if (!this.ss) return;
    var T = this.rtl ? LABELS.rtl : LABELS.ltr, n = this._view.length, tot = this.Items.length;
    var sel = this._view.filter(function (it) { return it.selected; }).length;
    this.ssCount.innerHTML = esc(T.Items) + '<b><bdi>' + n + (n !== tot ? ' / ' + tot : '') + '</bdi></b>';
    this.ssSel.innerHTML = esc(T.selected) + '<b><bdi>' + sel + '</bdi></b>';
    this.ssText.textContent = this._statusText;
  };

  P._applyLang = function () {
    var T = this.rtl ? LABELS.rtl : LABELS.ltr;
    if (this.ts) { this.tsInput.placeholder = T.search + '...'; this.tsGo.lastChild.textContent = T.search; }
    if (this._viewBtn) this._viewBtn.textContent = '\u25A6 ' + (this._card ? T.viewDetails : T.viewCards);
    this._updateStatus();
    this._applyPagerLang();
  };

  // switch left-to-right / right-to-left (texts, header, menus)
  P.setRtl = function (v) {
    this.rtl = !!v;
    this.root.dir = this.rtl ? 'rtl' : 'ltr';
    this._applyLang(); this._renderHead(); this._render();
  };

  // ---------------------------------------------------------------- rating (column with yellow stars)
  P._ratingCol = function () {
    for (var i = 0; i < this.Columns.length; i++) if (this.Columns[i].rating) return i;
    return -1;
  };
  P.addRatingColumn = function (text, width) {
    this.addColumn({ text: text || (this.rtl ? LABELS.rtl : LABELS.ltr).ratingTitle, width: width || 110, rating: true });
    return this.Columns.length - 1;
  };
  P.getRating = function (item) {
    var c = this._ratingCol();
    return c < 0 || !item ? 0 : Math.max(0, Math.min(5, Math.round(parseFloat(item.cells[c]) || 0)));
  };
  // lv.rate(4) rates the selected rows (or the row under the cursor); rate(0) / rate('') = no rating
  P.rate = function (value, Items) {
    var col = this._ratingCol();
    if (col < 0) return false;
    Items = Items || this.selectedItems;
    if (!Items.length && this._ctxItem) Items = [this._ctxItem];
    if (!Items.length) return false;
    var v = value === '' || value == null ? '' : String(Math.max(0, Math.min(5, Math.round(+value) || 0)));
    Items.forEach(function (it) {
      while (it.cells.length <= col) it.cells.push('');
      it.cells[col] = v;
    });
    this._rebuild(false);
    this._emit('ratingChanged', { Items: Items, value: v === '' ? 0 : +v });
    return true;
  };
  ['Rate', 'AddRatingColumn'].forEach(function (n) { P[n] = P[n.charAt(0).toLowerCase() + n.slice(1)]; });

  // ---------------------------------------------------------------- clipboard
  function clean(v) { return String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' '); }

  function copyText(text) {
    var prev = document.activeElement;
    var fallback = function () {
      var t = document.createElement('textarea');
      t.value = text; t.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(t);
      if (prev && prev.focus) prev.focus();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
  }

  P._rowText = function (it) { return it.cells.map(clean).join('\t'); };      // tab-separated: pastes into Excel

  // copy one row (the row under the cursor when used from the menu)
  P.copyRow = function (item) {
    if (!item) return false;
    copyText(this._rowText(item));
    this._emit('copied', [item]);
    return true;
  };
  // copy every selected row, one line per row
  P.copySelection = function () {
    var sel = this.selectedItems, self = this;
    if (!sel.length) return false;
    copyText(sel.map(function (it) { return self._rowText(it); }).join('\r\n'));
    this._emit('copied', sel);
    return true;
  };
  // copy the value of one column for the selected rows (or the row under the cursor)
  P.copyColumn = function (col) {
    var sel = this.selectedItems;
    if (!sel.length && this._ctxItem) sel = [this._ctxItem];
    if (!sel.length || col < 0 || col >= this.Columns.length) return false;
    copyText(sel.map(function (it) { return clean(it.cells[col]); }).join('\r\n'));
    this._emit('copied', sel);
    return true;
  };

  // ---------------------------------------------------------------- export (rows currently shown: filtered + sorted)
  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // CSV with ";" separator (Excel FR/DZ); the BOM added on download keeps Arabic/accents intact
  P.toCsv = function (sep) {
    sep = sep || ';';
    var n = this.Columns.length;
    var q = function (v) {
      v = v == null ? '' : String(v);
      return v.indexOf(sep) >= 0 || /["\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    var lines = [this.Columns.map(function (c) { return q(c.text); }).join(sep)];
    this._view.forEach(function (it) {
      var r = [];
      for (var i = 0; i < n; i++) r.push(q(it.cells[i]));
      lines.push(r.join(sep));
    });
    return lines.join('\r\n');
  };

  P.toHtml = function (title) {
    var cols = this.Columns, h = [];
    h.push('<!DOCTYPE html><html dir="' + (this.rtl ? 'rtl' : 'ltr') + '"><head><meta charset="utf-8"><title>' + esc(title || 'ExListView') +
      '</title><style>body{font:12px "Segoe UI",Tahoma,Arial,sans-serif}table{border-collapse:collapse}' +
      'th,td{border:1px solid #ccc;padding:3px 8px}th{background:#f0f0f0}tbody tr:nth-child(even){background:#f7f7f7}</style></head><body><table><thead><tr>');
    cols.forEach(function (c) { h.push('<th style="text-align:' + c.align + '">' + esc(c.text) + '</th>'); });
    h.push('</tr></thead><tbody>');
    this._view.forEach(function (it) {
      h.push('<tr>');
      cols.forEach(function (c, i) {
        var n = Math.max(0, Math.min(5, Math.round(parseFloat(it.cells[i]) || 0)));
        h.push('<td style="text-align:' + c.align + cellSpanStyle(it, i, false) + cellBoxStyle(it, i, false) + '">' + (c.rating
          ? '<span style="color:#e0a800">' + new Array(n + 1).join('\u2605') + '</span><span style="color:#ccc">' + new Array(6 - n).join('\u2605') + '</span>'
          : cellInner(it, i)) + '</td>');
      });
      h.push('</tr>');
    });
    h.push('</tbody></table></body></html>');
    return h.join('');
  };

  P.exportCsv = function (fileName) { download(fileName || 'export.csv', 'text/csv;charset=utf-8', '\uFEFF' + this.toCsv()); };
  P.exportHtml = function (fileName) { download(fileName || 'export.html', 'text/html;charset=utf-8', this.toHtml()); };

  // ---------------------------------------------------------------- custom menu Items
  P._findMenu = function (text) {
    for (var i = 0; i < this._menuItems.length; i++) if (this._menuItems[i].text === text) return this._menuItems[i];
    return null;
  };

  // lv.AddContextMenu('Supprimer', function (selectedItems) { ... })   (pass the function, not supprimer())
  // 'this' inside the function is the list. Same text again = replaces the function.
  P.AddContextMenu = function (text, fn, enabled) {
    var it = this._findMenu(text);
    if (it) { it.fn = fn; it.enabled = enabled !== false; }
    else this._menuItems.push({ text: text, fn: fn, enabled: enabled !== false });
    return this;
  };
  P.AddContextMenuSeparator = function () { this._menuItems.push({ sep: true }); return this; };
  P.RemoveContextMenu = function (text) {
    this._menuItems = this._menuItems.filter(function (i) { return i.text !== text; });
    return this;
  };
  P.ClearContextMenu = function () { this._menuItems = []; return this; };

  // lv.Activate('Supprimer') / lv.Deactivate('Supprimer') / lv.Activate('Supprimer', false)
  // Also works on the built-in entries: 'selAll', 'selNone', 'expCsv', 'expHtml'.
  P.Activate = function (name, on) {
    on = on !== false;
    var it = this._findMenu(name);
    if (it) it.enabled = on; else this._menuOff[name] = !on;
    return this;
  };
  P.Deactivate = function (name) { return this.Activate(name, false); };
  P.IsActive = function (name) {
    var it = this._findMenu(name);
    return it ? it.enabled : !this._menuOff[name];
  };
  ['AddContextMenu', 'AddContextMenuSeparator', 'RemoveContextMenu', 'ClearContextMenu', 'Activate', 'Deactivate', 'IsActive']
    .forEach(function (n) { P[n.charAt(0).toLowerCase() + n.slice(1)] = P[n]; });     // camelCase aliases

  // ---------------------------------------------------------------- context menu (right click on the rows)
  P._showMenu = function (x, y) {
    var self = this, T = this.rtl ? LABELS.rtl : LABELS.ltr;
    this._closePopup();
    this._emit('contextMenuOpening', this.selectedItems);     // lets the app call Activate / Deactivate first
    var hasRows = this._view.length > 0, off = this._menuOff;
    var hasSel = this._view.some(function (it) { return it.selected; });
    var defs = [];
    this._menuItems.forEach(function (c) {
      defs.push(c.sep ? { sep: true } : { t: c.text, on: c.enabled, fn: c.fn });
    });
    if (defs.length) defs.push({ sep: true });
    var ctx = this._ctxItem, hasTarget = hasSel || !!ctx;
    var colSub = [];
    this.Columns.forEach(function (c, i) {
      if (!c.noCopy) colSub.push({ t: c.text, on: true, run: function () { self.copyColumn(i); } });
    });
    if (this._ratingCol() >= 0) {                      // "Evaluer" sub menu: 1 to 5 yellow stars
      var rateSub = [1, 2, 3, 4, 5].map(function (n) {
        return { h: starsHtml(n), on: true, run: function () { self.rate(n); } };
      });
      rateSub.push({ sep: true }, { t: T.rateNone, on: true, run: function () { self.rate(''); } });
      defs.push({ t: T.rate, on: hasTarget && !off.rate, sub: rateSub }, { sep: true });
    }
    defs.push({ t: T.copy, on: !!ctx && !off.copy, run: function () { self.copyRow(ctx); } },
              { t: T.copySel, on: hasSel && !off.copySel, run: function () { self.copySelection(); } },
              { t: T.copyCol, on: hasTarget && !off.copyCol && colSub.length > 0, sub: colSub },
              { sep: true });
    defs.push({ k: 'selAll', t: T.selAll, on: this.multiSelect && hasRows && !off.selAll },
              { k: 'selNone', t: T.selNone, on: hasSel && !off.selNone },
              { sep: true },
              { k: 'expCsv', t: T.expCsv, on: hasRows && !off.expCsv },
              { k: 'expHtml', t: T.expHtml, on: hasRows && !off.expHtml });

    var m = document.createElement('div');
    m.className = 'exlv-menu';
    m.dir = this.rtl ? 'rtl' : 'ltr';
    var reg = [];                                   // clickable entries (main menu and sub menu)
    var html = function (list) {
      return list.map(function (d) {
        if (d.sep) return '<div class="exlv-ms"></div>';
        if (d.sub) {
          return '<div class="exlv-mi has-sub' + (d.on ? '' : ' dis') + '">' + esc(d.t) + '<span class="exlv-arrow">' +
            (self.rtl ? '\u25C0' : '\u25B6') + '</span><div class="exlv-menu exlv-sub">' + html(d.sub) + '</div></div>';
        }
        reg.push(d);
        return '<div class="exlv-mi' + (d.on ? '' : ' dis') + '" data-i="' + (reg.length - 1) + '">' + (d.h || esc(d.t)) + '</div>';
      }).join('');
    };
    m.innerHTML = html(defs);
    document.body.appendChild(m);
    if (root.Theme) root.Theme.Inherit(this.root, m);        // the menu uses the theme of the list
    this._copyPopupVars(m);
    var r = m.getBoundingClientRect();
    m.style.left = Math.max(0, Math.min(x, window.innerWidth - r.width)) + 'px';
    m.style.top = Math.max(0, Math.min(y, window.innerHeight - r.height)) + 'px';

    var close = function () {
      if (!m.parentNode) return;
      m.parentNode.removeChild(m);
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', close);
      self._pop = null;
      self.root.focus();
    };
    var onDown = function (e) { if (!m.contains(e.target)) close(); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };

    m.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    m.addEventListener('mouseover', function (e) {
      var p = e.target.closest('.has-sub');
      if (!p) return;
      var sub = p.querySelector('.exlv-sub');
      sub.classList.remove('flip');
      var b = sub.getBoundingClientRect();
      if (self.rtl ? b.left < 0 : b.right > window.innerWidth) sub.classList.add('flip');
    });
    m.addEventListener('click', function (e) {
      var el = e.target.closest('[data-i]'), d = el && reg[+el.dataset.i];
      if (!d || !d.on) return;
      var sel = self.selectedItems;
      close();
      if (d.fn) d.fn.call(self, sel);
      else if (d.run) d.run();
      else if (d.k === 'selAll') self.selectAll();
      else if (d.k === 'selNone') self.clearSelection();
      else if (d.k === 'expCsv') self.exportCsv();
      else if (d.k === 'expHtml') self.exportHtml();
    });
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', close);
    this._pop = close;
  };

  // ---------------------------------------------------------------- DOM events
  P._bind = function () {
    var self = this, raf = 0;
    if (window.ResizeObserver) {                          // re-draw the visible rows when the list is resized
      this._ro = new ResizeObserver(function () { self._render(); });
      this._ro.observe(this.scroll);
    }
    this.scroll.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; self._render(); });
    });

    this.body.addEventListener('mousedown', function (e) {
      var r = e.target.closest('.exlv-row');
      if (!r) return;
      var i = +r.dataset.i, row = self._rows[i];
      if (row.g !== undefined) {
        if (e.button === 0) { self._collapsed[row.g] = !self._collapsed[row.g]; self._rebuild(false); }
        return;
      }
      if (e.target.classList.contains('exlv-cb')) return;
      if (e.button === 2 && row.it.selected) return;       // right click on a selected row keeps the selection
      self._select(i, e);
    });
    this.body.addEventListener('change', function (e) {
      if (!e.target.classList.contains('exlv-cb')) return;
      var row = self._rows[+e.target.closest('.exlv-row').dataset.i];
      row.it.checked = e.target.checked;
      self._emit('itemChecked', row.it);
    });
    this.body.addEventListener('dblclick', function (e) {
      var r = e.target.closest('.exlv-row');
      if (r && self._rows[+r.dataset.i].it) self._emit('itemActivate', self._rows[+r.dataset.i].it);
    });

    this.head.addEventListener('click', function (e) {
      if (e.target.classList.contains('exlv-rs') || self._resized) return;
      var h = e.target.closest('.exlv-h');
      if (!h) return;
      var c = +h.dataset.c;
      self._emit('columnClick', c);
      if (!self.allowSort) return;
      self._sortOrder = self._sortCol === c && self._sortOrder === 'asc' ? 'desc' : 'asc';
      self._sortCol = c;
      self._pageIndex = 0;
      self._rebuild(false);
    });
    this.head.addEventListener('contextmenu', function (e) {
      if (!self.allowColumnFilter) return;
      e.preventDefault();
      var h = e.target.closest('.exlv-h');
      if (h) self._showPopup(+h.dataset.c, e.clientX, e.clientY);
    });
    this.scroll.addEventListener('contextmenu', function (e) {
      if (!self.allowContextMenu || e.target.closest('.exlv-head')) return;
      e.preventDefault();
      var rowEl = e.target.closest('.exlv-row'), rowDef = rowEl && self._rows[+rowEl.dataset.i];
      self._ctxItem = rowDef && rowDef.it ? rowDef.it : null;         // row under the cursor
      self._showMenu(e.clientX, e.clientY);
    });
    this.head.addEventListener('mousedown', function (e) {
      if (!e.target.classList.contains('exlv-rs') || e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      var c = +e.target.parentNode.dataset.c, sx = e.clientX, sw = self.Columns[c].width, dir = self.rtl ? -1 : 1;
      var mv = function (ev) { self.Columns[c].width = Math.max(20, sw + dir * (ev.clientX - sx)); self._layout(); };
      var up = function () {
        document.removeEventListener('mousemove', mv);
        document.removeEventListener('mouseup', up);
        self._resized = true; setTimeout(function () { self._resized = false; }, 0);
        self._emit('columnWidthChanged', c);
      };
      document.addEventListener('mousemove', mv);
      document.addEventListener('mouseup', up);
    });

    this.root.addEventListener('keydown', function (e) {
      if (e.target.closest('.exlv-ts, .exlv-ss, .exlv-pg')) return;     // typing in the search box must not drive the list
      var rows = self._rows, n = rows.length;
      if (!n) return;
      var f = self._focusRow, nf = f, step = 1, card = self._card, dn = card ? self._cols : 1;
      var page = Math.max(1, Math.floor((self.scroll.clientHeight - self._hh()) / (card ? self._ch + self.cardGap : self.rowHeight))) * dn;
      if (self._pag && (e.key === 'PageDown' || e.key === 'PageUp')) {       // already at the edge of the page: change page
        var down = e.key === 'PageDown';
        if (down ? (f >= n - 1 && self._pageIndex < self.PageCount - 1) : (f <= 0 && self._pageIndex > 0)) {
          e.preventDefault();
          self.setPage(self._pageIndex + (down ? 1 : -1));
          var r2 = self._rows, j = down ? 0 : r2.length - 1;
          while (j >= 0 && j < r2.length && r2[j].g !== undefined) j += down ? 1 : -1;
          if (j >= 0 && j < r2.length) { self._select(j, {}); self.ensureVisible(j); }
          return;
        }
      }
      switch (e.key) {
        case 'ArrowDown': nf = f + dn; break;
        case 'ArrowUp': nf = f < 0 ? 0 : f - dn; step = -1; break;
        case 'ArrowRight': if (!card) return; nf = f + (self.rtl ? -1 : 1); step = self.rtl ? -1 : 1; break;
        case 'ArrowLeft': if (!card) return; nf = f + (self.rtl ? 1 : -1); step = self.rtl ? 1 : -1; break;
        case 'PageDown': nf = f + page; break;
        case 'PageUp': nf = f - page; step = -1; break;
        case 'Home': nf = 0; break;
        case 'End': nf = n - 1; step = -1; break;
        case 'Enter': if (rows[f] && rows[f].it) self._emit('itemActivate', rows[f].it); return;
        case ' ':
          if (self.checkBoxes && rows[f] && rows[f].it) {
            rows[f].it.checked = !rows[f].it.checked; self._render(); self._emit('itemChecked', rows[f].it);
            e.preventDefault();
          }
          return;
        case 'c': case 'C':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); self.copySelection(); }
          return;
        case 'a': case 'A':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); self.selectAll(); }
          return;
        default: return;
      }
      e.preventDefault();
      nf = Math.max(0, Math.min(n - 1, nf));
      while (nf >= 0 && nf < n && rows[nf].g !== undefined) nf += step;     // skip group headers
      if (nf < 0 || nf >= n) return;
      self._select(nf, { shiftKey: e.shiftKey });
      self.ensureVisible(nf);
    });
  };

  // ---------------------------------------------------------------- filter popup
  P._closePopup = function () { if (this._pop) this._pop(); };

  P._showPopup = function (col, x, y) {
    var self = this;
    this._closePopup();
    var T = this.rtl ? LABELS.rtl : LABELS.ltr, kind = this._kind(col);
    var names = [OPS.Contains, OPS.NotContains, OPS.Equal, OPS.NotEqual];
    if (kind !== 'text') names.push(OPS.Greater, OPS.Less, OPS.GreaterOrEqual, OPS.LessOrEqual);
    var idx = Math.max(0, names.indexOf(this.getFilterOperator(col)));
    var now = new Date(), today = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + now.getFullYear();

    var pop = document.createElement('div');
    pop.className = 'exlv-pop';
    pop.dir = this.rtl ? 'rtl' : 'ltr';
    pop.innerHTML = '<b>' + esc(T.title + this.Columns[col].text) + '</b>' +
      '<select>' + names.map(function (n, i) {
        return '<option value="' + i + '"' + (i === idx ? ' selected' : '') + '>' + esc(T[n]) + '</option>';
      }).join('') + '</select>' +
      '<input type="text" value="' + esc(this.getFilter(col)) + '">' +
      (kind === 'date' ? '<span class="hint">' + esc(T.ex + today) + '</span>' : '') +
      '<div class="btns"><button data-b="clear">' + esc(T.clear) + '</button><button data-b="all"' +
      (this.hasActiveFilters ? '' : ' disabled') + '>' + esc(T.all) + '</button><button data-b="close">' + esc(T.close) + '</button></div>';
    document.body.appendChild(pop);
    if (root.Theme) root.Theme.Inherit(this.root, pop);
    this._copyPopupVars(pop);
    var r = pop.getBoundingClientRect();
    pop.style.left = Math.max(0, Math.min(x, window.innerWidth - r.width)) + 'px';
    pop.style.top = Math.max(0, Math.min(y, window.innerHeight - r.height)) + 'px';

    var sel = pop.querySelector('select'), inp = pop.querySelector('input'), timer = null;
    var apply = function () {
      var ok = self.setFilter(col, names[sel.selectedIndex], inp.value);
      inp.style.background = ok ? '' : 'mistyrose'; inp.style.color = ok ? '' : '#000';          // not a valid number / date
    };
    var close = function () {
      if (!pop.parentNode) return;
      if (timer) { clearTimeout(timer); timer = null; apply(); }     // flush a pending edit
      pop.parentNode.removeChild(pop);
      document.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('blur', close);
      self._pop = null;
      self.root.focus();
    };
    var onDown = function (e) { if (!pop.contains(e.target)) close(); };

    inp.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { timer = null; apply(); }, 300);   // 300 ms after the last keystroke
    });
    sel.addEventListener('change', function () { clearTimeout(timer); timer = null; apply(); inp.focus(); });
    pop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target !== sel) { e.preventDefault(); close(); }
      else if (e.key === 'Escape') close();
    });
    pop.addEventListener('click', function (e) {
      var b = e.target.dataset && e.target.dataset.b;
      if (!b) return;
      if (b === 'clear') { clearTimeout(timer); timer = null; self.setFilter(col, ''); }
      else if (b === 'all') { clearTimeout(timer); timer = null; self.clearFilters(); }
      close();
    });
    document.addEventListener('mousedown', onDown, true);
    window.addEventListener('blur', close);
    this._pop = close;
    inp.focus(); inp.select();
  };

  P.destroy = function () {
    this._closePopup();
    if (this._ro) this._ro.disconnect();
    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
  };
 
 ExListView.ColumnHeader = ColumnHeader;
  ExListView.ListViewItem = ListViewItem;
  ExListView.ListViewSubItem = ListViewSubItem;
  root.ListViewItem = ListViewItem;
  root.ListViewSubItem = ListViewSubItem;
  ExListView.HorizontalAlignment = HALIGN;
  root.ColumnHeader = ColumnHeader;
  if (!root.HorizontalAlignment) root.HorizontalAlignment = HALIGN;
  root.ExListView = ExListView;
  if (typeof module !== 'undefined' && module.exports) module.exports = ExListView;
})(typeof window !== 'undefined' ? window : this);