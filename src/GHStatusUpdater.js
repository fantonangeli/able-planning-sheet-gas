/**
 * Updates the GH Status for a specific row
 * @param {Sheet} sheet - The sheet object
 * @param {number} rowIndex - Zero-based row index (0 = header)
 * @param {Array} row - The row data
 * @param {Array} richTextRow - The rich text values for the row
 * @param {Object} columnIndices - Object containing column indices
 * @return {Object} - Result object with {success: boolean, message: string}
 */
function updateRowGHStatus(sheet, rowIndex, row, richTextRow, columnIndices) {
  const rowNumber = rowIndex + 1; // Convert to 1-based row number
  Logger.log(`\n--- Processing row ${rowNumber} ---`);

  const {statusColIndex, upstreamIssueColIndex, ghStatusColIndex, responsibleColIndex, responsibleEmailColIndex, requirementColIndex, productJiraColIndex} = columnIndices;

  // Step 1: Extract the Upstream Issue value
  let upstreamIssue = row[upstreamIssueColIndex];
  Logger.log(`Step 1: Raw Upstream Issue value: "${upstreamIssue}"`);

  // Step 2: Extract URL from HYPERLINK formula, rich text link, or plain URL
  let issueUrl = extractUrlFromCell(upstreamIssue, richTextRow[upstreamIssueColIndex]);
  Logger.log(`Step 2: Extracted URL: "${issueUrl}"`);

  // Step 3: Extract responsible person's name and email (always log, regardless of URL validity)
  let responsibleName = "";
  let responsibleEmail = "";

  if (responsibleColIndex !== -1) {
    const nameValue = row[responsibleColIndex];
    responsibleName = nameValue ? String(nameValue).trim() : "";
    Logger.log(`Step 3: Responsible name: ${responsibleName}`);
  }

  if (responsibleEmailColIndex !== -1) {
    const emailValue = row[responsibleEmailColIndex];
    responsibleEmail = emailValue ? String(emailValue).trim() : "";
    Logger.log(`Step 3: Responsible email: ${responsibleEmail}`);
  }

  // Step 4: Parse and validate GitHub issue URL
  const issueInfo = parseGitHubIssueUrl(issueUrl);

  if (!issueInfo) {
    const msg = `✗ Invalid GitHub issue URL, skipping this row`;
    Logger.log(`Step 4: ${msg}`);
    return {success: false, message: msg};
  }

  Logger.log(`Step 4: ✓ Valid GitHub issue URL - Owner: ${issueInfo.owner}, Repo: ${issueInfo.repo}, Issue: ${issueInfo.issueNumber}`);

  // Step 5: Fetch the issue state from GitHub API
  const issueState = fetchGitHubIssueState(issueInfo.owner, issueInfo.repo, issueInfo.issueNumber);
  Logger.log(`  → Issue state: ${issueState}`);

  if (!issueState) {
    const msg = `✗ Failed to fetch issue state`;
    Logger.log(`Step 5: ${msg}`);
    return {success: false, message: msg};
  }

  Logger.log(`Step 5: ✓ Fetched issue state: ${issueState}`);

    // TODO: until now for debug, we used a "GH Status" col, which will not be present in the real spreadsheet. If the GH Issue is "closed", change the "Status" col to "Finished" and the REMAINING_WORK column to 0 
  // Step 6: Write the issue state to the GH Status column
  const ghStatusCell = sheet.getRange(rowNumber, ghStatusColIndex + 1);
  ghStatusCell.setValue(issueState);
  Logger.log(`Step 6: Updated GH Status cell with: ${issueState}`);

  // Step 7: Send notification (if enabled)
  if (ENABLE_EMAIL_NOTIFICATIONS && responsibleEmail) {
    const requirementName = row[requirementColIndex] || "";
    const productJira = row[productJiraColIndex] || "";

    sendUpdateNotification({
      email: responsibleEmail,
      issueUrl,
      issueState,
      requirementName,
      rowNumber,
      productJira,
      responsibleName
    });

    Logger.log(`Step 7: Email notification sent to ${responsibleEmail}`);
  } else if (ENABLE_EMAIL_NOTIFICATIONS && !responsibleEmail) {
    Logger.log(`Step 7: No email found for responsible person, skipping notification`);
  }

  return {success: true, message: `Updated row ${rowNumber} with status: ${issueState}`};
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

  const {sheet, values, richTextValues, columnIndices} = context;
  Logger.log(`Loaded ${values.length} rows from sheet`);
  Logger.log(`Found columns - Status: ${columnIndices.statusColIndex}, Upstream Issue: ${columnIndices.upstreamIssueColIndex}, GH Status: ${columnIndices.ghStatusColIndex}`);

  // Filter rows with "In progress" status and process
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < values.length && (updatedCount + skippedCount) < MAX_ROWS_TO_PROCESS; i++) {
    const row = values[i];
    const status = row[columnIndices.statusColIndex];

    // Check if status is "In progress"
    if (status === STATUS_VALUES.IN_PROGRESS) {
      Logger.log(`Found "${STATUS_VALUES.IN_PROGRESS}" row at index ${i + 1}`);

      const result = updateRowGHStatus(sheet, i, row, richTextValues[i], columnIndices);

      if (result.success) {
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

  const {sheet, values, richTextValues, columnIndices} = context;

  // Get the row data (rowNumber - 1 because values array is 0-based)
  const rowIndex = rowNumber - 1;
  const row = values[rowIndex];
  const richTextRow = richTextValues[rowIndex];

  // Update the row
  const result = updateRowGHStatus(sheet, rowIndex, row, richTextRow, columnIndices);

  // Show result
  const ui = SpreadsheetApp.getUi();
  if (result.success) {
    ui.alert('Success', result.message, ui.ButtonSet.OK);
  } else {
    ui.alert('Failed', result.message, ui.ButtonSet.OK);
  }

  Logger.log(`\n=== Completed: ${result.message} ===`);
}
