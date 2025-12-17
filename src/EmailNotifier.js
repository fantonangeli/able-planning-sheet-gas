/**
 * Sends an email notification about the GH Status update
 * @param {Object} params - Notification parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.issueUrl - GitHub issue URL
 * @param {string} params.issueState - GitHub issue state (open/closed)
 * @param {string} params.requirementName - Name of the requirement
 * @param {number} params.rowNumber - Spreadsheet row number
 * @param {string} params.productJira - Product JIRA ticket
 * @param {string} params.responsibleName - Name of the responsible person
 */
function sendUpdateNotification({email, issueUrl, issueState, requirementName, rowNumber, productJira, responsibleName}) {
  const subject = GH_STATUS_CHANGE_NOTIFICATION_EMAIL.subject(requirementName);
  const body = GH_STATUS_CHANGE_NOTIFICATION_EMAIL.body(requirementName, issueUrl, issueState, rowNumber, productJira, responsibleName);

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
  } catch (error) {
    Logger.log(`Failed to send email to ${email}: ${error.message}`);
  }
}
