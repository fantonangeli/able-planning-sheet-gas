/**
 * Creates custom menu when the spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('ABLE Tools')
    .addItem('Sync GH Issues Statuses', 'updateAllGHStatuses')
    .addToUi();
}
