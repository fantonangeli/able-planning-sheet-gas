/**
 * Debug function to inspect the content of a cell with People chip
 *
 * Usage:
 * 1. Open your spreadsheet
 * 2. Click on a cell with a People chip (e.g., "Responsible" column)
 * 3. Run this function from the Apps Script editor
 * 4. Check the logs to see what data is available
 */
function debugPeopleChip() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Requirements");

  // Change this to the row with a People chip you want to inspect
  const rowIndex = 26; // Row 26 has "Ricardo Zanini" as Responsible
  const responsibleColIndex = 8; // Adjust based on your "Responsible" column index

  const cell = sheet.getRange(rowIndex, responsibleColIndex);

  Logger.log("=== Debugging People Chip ===");
  Logger.log("Cell address: " + cell.getA1Notation());

  // Get different representations of the cell value
  const value = cell.getValue();
  const displayValue = cell.getDisplayValue();
  const formula = cell.getFormula();
  const richTextValue = cell.getRichTextValue();

  Logger.log("\n--- Basic Values ---");
  Logger.log("getValue():", value);
  Logger.log("Value type:", typeof value);
  Logger.log("getDisplayValue():", displayValue);
  Logger.log("getFormula():", formula);

  Logger.log("\n--- Rich Text Analysis ---");
  if (richTextValue) {
    Logger.log("richTextValue.getText():", richTextValue.getText());
    Logger.log("richTextValue.getLinkUrl():", richTextValue.getLinkUrl());

    // Try to get runs (formatted text segments)
    const runs = richTextValue.getRuns();
    Logger.log("Number of runs:", runs.length);

    runs.forEach((run, index) => {
      Logger.log(`\nRun ${index}:`);
      Logger.log("  Text:", run.getText());
      Logger.log("  Link URL:", run.getLinkUrl());

      const textStyle = run.getTextStyle();
      if (textStyle) {
        Logger.log("  Font Family:", textStyle.getFontFamily());
        Logger.log("  Font Size:", textStyle.getFontSize());
      }
    });
  } else {
    Logger.log("No rich text value found");
  }

  Logger.log("\n--- Object Properties ---");
  if (typeof value === 'object' && value !== null) {
    Logger.log("Value is an object. Properties:");
    for (let key in value) {
      Logger.log(`  ${key}:`, value[key]);
    }
  }

  Logger.log("\n=== End Debug ===");
}

/**
 * Alternative: Debug the currently selected cell
 *
 * Usage:
 * 1. Select a cell with a People chip in your spreadsheet
 * 2. Run this function
 * 3. Check the logs
 */
function debugSelectedCell() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const cell = sheet.getActiveCell();

  if (!cell) {
    Logger.log("No cell selected!");
    return;
  }

  Logger.log("=== Debugging Selected Cell ===");
  Logger.log("Cell address: " + cell.getA1Notation());

  const value = cell.getValue();
  const displayValue = cell.getDisplayValue();
  const richTextValue = cell.getRichTextValue();

  Logger.log("\ngetValue():", value);
  Logger.log("Type:", typeof value);
  Logger.log("getDisplayValue():", displayValue);

  if (richTextValue) {
    Logger.log("\nRich Text:");
    Logger.log("  getText():", richTextValue.getText());
    Logger.log("  getLinkUrl():", richTextValue.getLinkUrl());

    const runs = richTextValue.getRuns();
    runs.forEach((run, index) => {
      Logger.log(`\n  Run ${index}:`);
      Logger.log("    Text:", run.getText());
      Logger.log("    Link URL:", run.getLinkUrl());
    });
  }

  // Try to see if it's a special object
  if (typeof value === 'object' && value !== null) {
    Logger.log("\nValue object keys:", Object.keys(value));
    Logger.log("Value JSON:", JSON.stringify(value, null, 2));
  }

  Logger.log("\n=== End Debug ===");
}

/**
 * Debug all "In progress" rows to see what the Responsible column contains
 * This helps understand how People chips are stored
 */
function debugAllResponsibleCells() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Requirements");

  if (!sheet) {
    Logger.log("Sheet 'Requirements' not found!");
    return;
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const richTextValues = dataRange.getRichTextValues();

  const headers = values[0];
  const statusColIndex = headers.indexOf("Status");
  const responsibleColIndex = headers.indexOf("Responsible");

  Logger.log("=== Debugging All Responsible Cells in 'In progress' Rows ===");
  Logger.log(`Status column index: ${statusColIndex}`);
  Logger.log(`Responsible column index: ${responsibleColIndex}`);

  if (statusColIndex === -1 || responsibleColIndex === -1) {
    Logger.log("Required columns not found!");
    return;
  }

  let count = 0;
  const MAX_DEBUG = 5; // Only debug first 5 "In progress" rows

  for (let i = 1; i < values.length && count < MAX_DEBUG; i++) {
    const row = values[i];
    const status = row[statusColIndex];

    if (status === "In progress") {
      count++;
      Logger.log(`\n--- Row ${i + 1} ---`);

      const responsibleValue = row[responsibleColIndex];
      const responsibleRichText = richTextValues[i][responsibleColIndex];

      Logger.log("Raw value:", responsibleValue);
      Logger.log("Value type:", typeof responsibleValue);
      Logger.log("Display value:", responsibleValue);

      if (responsibleRichText) {
        Logger.log("Rich text:", responsibleRichText.getText());
        Logger.log("Link URL:", responsibleRichText.getLinkUrl());

        const runs = responsibleRichText.getRuns();
        Logger.log("Number of runs:", runs.length);

        runs.forEach((run, idx) => {
          Logger.log(`  Run ${idx}: "${run.getText()}" | Link: ${run.getLinkUrl()}`);
        });
      }

      // Try to parse as object
      if (typeof responsibleValue === 'object' && responsibleValue !== null) {
        Logger.log("Object keys:", Object.keys(responsibleValue));
        try {
          Logger.log("JSON:", JSON.stringify(responsibleValue, null, 2));
        } catch (e) {
          Logger.log("Cannot stringify object:", e.message);
        }
      }
    }
  }

  Logger.log(`\n=== Debugged ${count} rows ===`);
}
