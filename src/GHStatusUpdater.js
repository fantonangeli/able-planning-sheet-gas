/**
 * Updates the GH Status for the currently selected row in the spreadsheet
 * Useful for manual testing without processing all rows
 */
function updateCurrentRowGHStatus() {
  Logger.log("=== Updating Current Row GH Status ===");

  const activeCell = SpreadsheetApp.getActiveSpreadsheet().getActiveCell();
  if (!activeCell) {
    Logger.log("No cell selected!");
    return;
  }

  const rowNumber = activeCell.getRow();
  Logger.log(`Selected row: ${rowNumber}`);

  if (rowNumber === 1) {
    Logger.log("Cannot update header row!");
    return;
  }

  const context = getSheetContext();

  const {sheet, values, richTextValues, columnIndexes} = context;

  const rowIndex = rowNumber - 1;
  const row = values[rowIndex];
  const richTextRow = richTextValues[rowIndex];
  const spreadsheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  updateRowGHStatus(sheet, rowIndex, row, richTextRow, columnIndexes, spreadsheetUrl);

  Logger.log(`\n=== Completed update of row ${rowIndex+1} ===`);
}

/**
 * Updates the GH Status for a specific row
 * @param {Sheet} sheet - The sheet object
 * @param {number} rowIndex - Zero-based row index (0 = header)
 * @param {Array} row - The row data
 * @param {Array} richTextRow - The rich text values for the row
 * @param {Object} columnIndexes - Object containing column indexes
 * @param {string} spreadsheetUrl - The spreadsheet URL
 * @return {boolean} - True if ok, false otherwise
 */
function updateRowGHStatus(sheet, rowIndex, row, richTextRow, columnIndexes, spreadsheetUrl) {
  const rowNumber = rowIndex + 1;
  Logger.log(`\n--- Processing row ${rowNumber} ---`);

  const {statusColIndex, remainingWorkColIndex, upstreamIssueColIndex, responsibleColIndex, responsibleEmailColIndex, requirementColIndex, productJiraColIndex} = columnIndexes;

  const upstreamIssue = row[upstreamIssueColIndex];
  Logger.log(`Raw Upstream Issue value: "${upstreamIssue}"`);

  const issueUrl = extractUrlFromCell(upstreamIssue, richTextRow[upstreamIssueColIndex]);
  Logger.log(`Extracted URL: "${issueUrl}"`);

  const responsibleName = row[responsibleColIndex];
  Logger.log(`Responsible name: ${responsibleName}`);

  const responsibleEmail = row[responsibleEmailColIndex];
  Logger.log(`Responsible email: ${responsibleEmail}`);

  const issueState = fetchGitHubIssueState(issueUrl);

  if (!issueState) {
    Logger.log(`✗ Invalid GitHub issue URL or failed to fetch state, skipping this row`);
    return false;
  }

  Logger.log(`✓ Fetched issue state: ${issueState}`);

  if (issueState !== "closed") {
      return false;
  }

  const statusCell = sheet.getRange(rowNumber, statusColIndex + 1);
  const updatedStatus = STATUS_VALUES.FINISHED;
  statusCell.setValue(updatedStatus);

  const remainingWorkCell = sheet.getRange(rowNumber, remainingWorkColIndex + 1);
  remainingWorkCell.setValue("0");

  Logger.log(`Updated Status and Remaining Work Eng`);

  if (!responsibleEmail) {
      Logger.log(`No email found for responsible person, skipping notification`);
      return true;
  }

  const productJiraRaw = row[productJiraColIndex] || "";
  const productJiraUrl = extractUrlFromCell(productJiraRaw, richTextRow[productJiraColIndex]);

  sendUpdateNotification({
    email: responsibleEmail,
    issueUrl,
    issueState,
    requirementName: row[requirementColIndex],
    rowNumber,
    productJiraUrl,
    responsibleName,
    spreadsheetUrl,
    updatedStatus
  });

  Logger.log(`Email notification sent to ${responsibleEmail}`);
  return true;
}

/**
 * Updates the GitHub Status column based on the upstream GitHub issues
 */
function updateAllGHStatuses() {
  Logger.log("=== Starting GH Status Updater ===");
  Logger.log(`Email notifications: ${ENABLE_EMAIL_NOTIFICATIONS ? 'ENABLED' : 'DISABLED'}`);
  Logger.log(`Max rows to process: ${MAX_ROWS_TO_PROCESS}`);
  Logger.log(`Delay between rows: ${DELAY_BETWEEN_ROWS_MS}ms`);

  const context = getSheetContext();

  const {sheet, values, richTextValues, columnIndexes} = context;
  const spreadsheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  Logger.log(`Loaded ${values.length} rows from sheet`);
  Logger.log(`Found columns - Status: ${columnIndexes.statusColIndex}, Upstream Issue: ${columnIndexes.upstreamIssueColIndex}`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < values.length && (updatedCount + skippedCount) < MAX_ROWS_TO_PROCESS; i++) {
    const row = values[i];
    const status = row[columnIndexes.statusColIndex];

    if (status === STATUS_VALUES.IN_PROGRESS) {
      const result = updateRowGHStatus(sheet, i, row, richTextValues[i], columnIndexes, spreadsheetUrl);

      if (result) {
        updatedCount++;
      } else {
        skippedCount++;
      }

      if (DELAY_BETWEEN_ROWS_MS > 0) {
        Utilities.sleep(DELAY_BETWEEN_ROWS_MS);
      }
    }
  }

  Logger.log(`\n=== Completed: ${updatedCount} updated, ${skippedCount} skipped ===`);

    try {
        // if executed by a timely trigger getUi() throw an exception
        const ui = SpreadsheetApp.getUi();
        ui.alert(
            'Sync Completed',
            `Updated: ${updatedCount} row(s)\nSkipped: ${skippedCount} row(s)`,
            ui.ButtonSet.OK
        );
    } catch (error) {
        
    }
}
