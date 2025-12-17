/**
 * Extracts URL from HYPERLINK formula, rich text link, or returns the value as-is if it's already a plain URL
 * @param {string} value - The cell value, might be a HYPERLINK formula or plain URL
 * @param {RichTextValue} richTextValue - The rich text value from the cell
 * @return {string} - The extracted URL
 */
function extractUrlFromCell(value, richTextValue) {
  if (!value) {
    return "";
  }

  const valueStr = String(value).trim();

  // Check if it's a HYPERLINK formula: =HYPERLINK("url", "label")
  const hyperlinkRegex = /^=HYPERLINK\("([^"]+)"\s*,\s*"[^"]*"\)$/i;
  const match = valueStr.match(hyperlinkRegex);

  if (match) {
    Logger.log("  → Extracted from HYPERLINK formula");
    return match[1]; // Return the URL part
  }

  // Check if it's a rich text link (text with URL but not a formula)
  if (richTextValue) {
    const linkUrl = richTextValue.getLinkUrl();
    if (linkUrl) {
      Logger.log("  → Extracted from rich text link");
      return linkUrl;
    }
  }

  // Otherwise, assume it's a plain URL
  Logger.log("  → Using plain text value");
  return valueStr;
}
