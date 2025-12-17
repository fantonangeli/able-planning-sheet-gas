/**
 * Updates the GH Status for a specific row
 * @param {Sheet} sheet - The sheet object
 * @param {number} rowIndex - Zero-based row index (0 = header)
 * @param {Array} row - The row data
 * @param {Array} richTextRow - The rich text values for the row
 * @param {Object} columnIndexes - Object containing column indexes
 * @return {boolean} - True if ok, false otherwise
 */
function updateRowGHStatus(sheet, rowIndex, row, richTextRow, columnIndexes) {
  const rowNumber = rowIndex + 1; // Convert to 1-based row number
  Logger.log(`\n--- Processing row ${rowNumber} ---`);

  const {statusColIndex, remainingWorkColIndex, upstreamIssueColIndex, responsibleColIndex, responsibleEmailColIndex, requirementColIndex, productJiraColIndex} = columnIndexes;

  // Extract the Upstream Issue value
  let upstreamIssue = row[upstreamIssueColIndex];
  Logger.log(`Raw Upstream Issue value: "${upstreamIssue}"`);

  // Extract URL from HYPERLINK formula, rich text link, or plain URL
  let issueUrl = extractUrlFromCell(upstreamIssue, richTextRow[upstreamIssueColIndex]);
  Logger.log(`Extracted URL: "${issueUrl}"`);

  // Extract responsible person's name and email (always log, regardless of URL validity)
  let responsibleName = "";
  let responsibleEmail = "";

  if (responsibleColIndex !== -1) {
    const nameValue = row[responsibleColIndex];
    responsibleName = nameValue ? String(nameValue).trim() : "";
    Logger.log(`Responsible name: ${responsibleName}`);
  }

  if (responsibleEmailColIndex !== -1) {
    const emailValue = row[responsibleEmailColIndex];
    responsibleEmail = emailValue ? String(emailValue).trim() : "";
    Logger.log(`Responsible email: ${responsibleEmail}`);
  }

  // Parse and validate GitHub issue URL
  const issueInfo = parseGitHubIssueUrl(issueUrl);

  if (!issueInfo) {
    Logger.log(`✗ Invalid GitHub issue URL, skipping this row`);
    return false;
  }

  Logger.log(`✓ Valid GitHub issue URL - Owner: ${issueInfo.owner}, Repo: ${issueInfo.repo}, Issue: ${issueInfo.issueNumber}`);

  // Fetch the issue state from GitHub API
  const issueState = fetchGitHubIssueState(issueInfo.owner, issueInfo.repo, issueInfo.issueNumber);
  Logger.log(`  → Issue state: ${issueState}`);

  if (!issueState) {
    Logger.log( `✗ Failed to fetch issue state`);
    return false;
  }

  Logger.log(`✓ Fetched issue state: ${issueState}`);

  if (issueState !== "closed") {
      return false;
  }

  // If issue is closed, update Status to "Finished" and REMAINING_WORK ENG to 0
  let updatedStatus = row[statusColIndex]; // Default to current status

  const statusCell = sheet.getRange(rowNumber, statusColIndex + 1);
  statusCell.setValue(STATUS_VALUES.FINISHED);
  updatedStatus = STATUS_VALUES.FINISHED;

  const remainingWorkCell = sheet.getRange(rowNumber, remainingWorkColIndex + 1);
  remainingWorkCell.setValue("0");

  Logger.log(`Updated Status and Remaining Work Eng`);

  // Send notification (if enabled)
  if (ENABLE_EMAIL_NOTIFICATIONS && responsibleEmail) {
    const requirementName = row[requirementColIndex] || "";
    const productJiraRaw = row[productJiraColIndex] || "";
    const productJiraUrl = extractUrlFromCell(productJiraRaw, richTextRow[productJiraColIndex]);
    const spreadsheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

    sendUpdateNotification({
      email: responsibleEmail,
      issueUrl,
      issueState,
      requirementName,
      rowNumber,
      productJiraUrl,
      responsibleName,
      spreadsheetUrl,
      updatedStatus
    });

    Logger.log(`Email notification sent to ${responsibleEmail}`);
  } else if (ENABLE_EMAIL_NOTIFICATIONS && !responsibleEmail) {
    Logger.log(`No email found for responsible person, skipping notification`);
  }

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

  // Get sheet context
  const context = getSheetContext();

  const {sheet, values, richTextValues, columnIndexes} = context;
  Logger.log(`Loaded ${values.length} rows from sheet`);
  Logger.log(`Found columns - Status: ${columnIndexes.statusColIndex}, Upstream Issue: ${columnIndexes.upstreamIssueColIndex}`);

  // Filter rows with "In progress" status and process
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < values.length && (updatedCount + skippedCount) < MAX_ROWS_TO_PROCESS; i++) {
    const row = values[i];
    const status = row[columnIndexes.statusColIndex];

    // Check if status is "In progress"
    if (status === STATUS_VALUES.IN_PROGRESS) {
      Logger.log(`Found "${STATUS_VALUES.IN_PROGRESS}" row at index ${i + 1}`);

      const result = updateRowGHStatus(sheet, i, row, richTextValues[i], columnIndexes);

      if (result) {
        updatedCount++;
      } else {
        skippedCount++;
      }

      // Apply delay before processing next row (if configured)
      if (DELAY_BETWEEN_ROWS_MS > 0) {
        Utilities.sleep(DELAY_BETWEEN_ROWS_MS);
      }
    }
  }

  Logger.log(`\n=== Completed: ${updatedCount} updated, ${skippedCount} skipped ===`);

  // Show summary alert
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Sync Completed',
    `Updated: ${updatedCount} row(s)\nSkipped: ${skippedCount} row(s)`,
    ui.ButtonSet.OK
  );
}

/**
 * Updates the GH Status for the currently selected row in the spreadsheet
 * Useful for manual testing without processing all rows
 */
function updateCurrentRowGHStatus() {
  Logger.log("=== Updating Current Row GH Status ===");

  // Get the active cell and its row number
  const activeCell = SpreadsheetApp.getActiveSpreadsheet().getActiveCell();
  if (!activeCell) {
    Logger.log("No cell selected!");
    SpreadsheetApp.getUi().alert('Error', 'Please select a cell in the row you want to update.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const rowNumber = activeCell.getRow();
  Logger.log(`Selected row: ${rowNumber}`);

  if (rowNumber === 1) {
    Logger.log("Cannot update header row!");
    SpreadsheetApp.getUi().alert('Error', 'Cannot update the header row. Please select a data row.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Get sheet context
  const context = getSheetContext();

  const {sheet, values, richTextValues, columnIndexes} = context;

  // Get the row data (rowNumber - 1 because values array is 0-based)
  const rowIndex = rowNumber - 1;
  const row = values[rowIndex];
  const richTextRow = richTextValues[rowIndex];

  // Update the row
  updateRowGHStatus(sheet, rowIndex, row, richTextRow, columnIndexes);

  Logger.log(`\n=== Completed update of row ${rowIndex+1} ===`);
}
