/**
 * Configuration file for GH Status Updater
 */

// Feature flags
const ENABLE_EMAIL_NOTIFICATIONS = true; // Set to true to enable email notifications

// Processing limits
const MAX_ROWS_TO_PROCESS = 1000; // Maximum number of "In progress" rows to process
const DELAY_BETWEEN_ROWS_MS = 0; // Delay in milliseconds between processing each row (0 = no delay)

// Sheet configuration
const SHEET_NAME = "Requirements";

// Column names
const COLUMN_NAMES = {
  PRODUCT_JIRA: "Product JIRA",
  REMAINING_WORK: "Remaining Work", 
  REQUIREMENT: "Requirement",
  RESPONSIBLE: "Responsible",
  RESPONSIBLE_EMAIL: "Responsible email",
  STATUS: "Status",
  UPSTREAM_ISSUE: "Upstream Issue",
};

// Status values
const STATUS_VALUES = {
  IN_PROGRESS: "In progress",
  FINISHED: "Finished"
};

// GitHub API configuration
const GITHUB_API_ENABLE_MOCK_ANSWER = true; // Set to true to avoid contacting the real API and get "closed" status from the GH Issue
const GITHUB_API_BASE_URL = "https://api.github.com";

// Email notification configuration
const GH_STATUS_CHANGE_NOTIFICATION_EMAIL = {
  subject: (requirementName) => `ABLE Planning Sheet - GH Status Updated for: ${requirementName}`,
  htmlBody: (requirementName, issueUrl, issueState, rowNumber, productJiraUrl, responsibleName, spreadsheetUrl, updatedStatus) => {
    const jiraLink = productJiraUrl ? `<a href="${productJiraUrl}">${productJiraUrl}</a>` : 'Not specified';
    const rowLink = `<a href="${spreadsheetUrl}#gid=0&range=A${rowNumber}">Row ${rowNumber}</a>`;

    return `<p>Hello ${responsibleName},</p>

<p>This is an automated notification from the ABLE Team Initiatives Planning Sheet.<br>
The <b>Status</b> and the <b>Remaining Work</b> has been updated for the following requirement:</p>

<p>
Row link: ${rowLink}<br>
Requirement: ${requirementName}<br>
Status (updated): <b>${updatedStatus}</b><br>
Remaining Work Eng (updated): <b>0</b><br>
GitHub Issue: <a href="${issueUrl}">${issueUrl}</a><br>
GitHub Issue State: ${issueState}<br>
Product JIRA: ${jiraLink}
</p>

<p><strong>IMPORTANT:</strong> Please update the Product JIRA ticket with this status change.</p>
`;
  }
};
