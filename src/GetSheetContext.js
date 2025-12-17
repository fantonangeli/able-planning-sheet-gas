/**
 * Gets the sheet context with all necessary data for processing
 * @return {Object|null} - Context object with sheet, values, richTextValues, columnIndices or null if error
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

    const columnIndices = {
        statusColIndex: headers.indexOf(COLUMN_NAMES.STATUS),
        upstreamIssueColIndex: headers.indexOf(COLUMN_NAMES.UPSTREAM_ISSUE),
        ghStatusColIndex: headers.indexOf(COLUMN_NAMES.GH_STATUS),
        responsibleColIndex: headers.indexOf(COLUMN_NAMES.RESPONSIBLE),
        responsibleEmailColIndex: headers.indexOf(COLUMN_NAMES.RESPONSIBLE_EMAIL),
        requirementColIndex: headers.indexOf(COLUMN_NAMES.REQUIREMENT),
        productJiraColIndex: headers.indexOf(COLUMN_NAMES.PRODUCT_JIRA)
    };

    // Validate required columns
    if (columnIndices.statusColIndex === -1 || columnIndices.upstreamIssueColIndex === -1 || columnIndices.ghStatusColIndex === -1) {
        SpreadsheetApp.getUi().alert('Error', 'Required columns not found!', SpreadsheetApp.getUi().ButtonSet.OK);
        throw new Error("Required columns not found!")
    }

    return {
        sheet,
        values,
        richTextValues,
        columnIndices
    };
}

