/**
 * Gets the sheet context with all necessary data for processing
 * @return {Object|null} - Context object with sheet, values, richTextValues, columnIndexes or null if error
 */
function getSheetContext() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
        SpreadsheetApp.getUi().alert('Error', `Sheet "${SHEET_NAME}" not found!`, SpreadsheetApp.getUi().ButtonSet.OK);
        throw new Error(`Sheet '${SHEET_NAME}' not found!`)
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const richTextValues = dataRange.getRichTextValues();
    const headers = values[0];

    const columnIndexes = {
        statusColIndex: headers.indexOf(COLUMN_NAMES.STATUS),
        upstreamIssueColIndex: headers.indexOf(COLUMN_NAMES.UPSTREAM_ISSUE),
        responsibleColIndex: headers.indexOf(COLUMN_NAMES.RESPONSIBLE),
        responsibleEmailColIndex: headers.indexOf(COLUMN_NAMES.RESPONSIBLE_EMAIL),
        requirementColIndex: headers.indexOf(COLUMN_NAMES.REQUIREMENT),
        productJiraColIndex: headers.indexOf(COLUMN_NAMES.PRODUCT_JIRA),
        remainingWorkColIndex: headers.findIndex((e=>e.startsWith(COLUMN_NAMES.REMAINING_WORK))), //note: the Eng and Qe headers in the Spreadsheet are merged
    };

    // Validate required columns
    if (columnIndexes.statusColIndex === -1 || columnIndexes.upstreamIssueColIndex === -1) {
        SpreadsheetApp.getUi().alert('Error', 'Required columns not found!', SpreadsheetApp.getUi().ButtonSet.OK);
        throw new Error("Required columns not found!")
    }

    return {
        sheet,
        values,
        richTextValues,
        columnIndexes
    };
}

