/**
 * Sends an email notification about the GH Status update
 * @param {Object} params - Notification parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.issueUrl - GitHub issue URL
 * @param {string} params.issueState - GitHub issue state (open/closed)
 * @param {string} params.requirementName - Name of the requirement
 * @param {number} params.rowNumber - Spreadsheet row number
 * @param {string} params.productJiraUrl - Product JIRA ticket URL
 * @param {string} params.responsibleName - Name of the responsible person
 * @param {string} params.spreadsheetUrl - URL of the spreadsheet
 * @param {string} params.updatedStatus - The updated status value
 */
function sendUpdateNotification({email, issueUrl, issueState, requirementName, rowNumber, productJiraUrl, responsibleName, spreadsheetUrl, updatedStatus}) {
  const subject = GH_STATUS_CHANGE_NOTIFICATION_EMAIL.subject(requirementName);
  const htmlBody = GH_STATUS_CHANGE_NOTIFICATION_EMAIL.htmlBody(requirementName, issueUrl, issueState, rowNumber, productJiraUrl, responsibleName, spreadsheetUrl, updatedStatus);

  if (!ENABLE_EMAIL_NOTIFICATIONS) {
      return false;
  }

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (error) {
    Logger.log(`Failed to send email to ${email}: ${error.message}`);
  }
}
