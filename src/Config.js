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
  GH_STATUS: "GH Status",
  PRODUCT_JIRA: "Product JIRA",
  REMAINING_WORK: "Remaining Work Eng QE", //note: the Eng and Qe headers in the Spreadsheet are merged
  REQUIREMENT: "Requirement", 
  RESPONSIBLE: "Responsible",
  RESPONSIBLE_EMAIL: "Responsible email",
  STATUS: "Status",
  UPSTREAM_ISSUE: "Upstream Issue",
};

// Status values
const STATUS_VALUES = {
  IN_PROGRESS: "In progress"
};

// GitHub API configuration
const GITHUB_API_ENABLE_MOCK_ANSWER = true; // Set to true to avoid contacting the real API and get "closed" status from the GH Issue
const GITHUB_API_BASE_URL = "https://api.github.com";

// Email notification configuration
const GH_STATUS_CHANGE_NOTIFICATION_EMAIL = {
  subject: (requirementName) => `ABLE Planning Sheet - GH Status Updated for: ${requirementName}`,
  body: (requirementName, issueUrl, issueState, rowNumber, productJira, responsibleName) => `Hello ${responsibleName},

The GitHub issue status has been updated for the following requirement:

Row: ${rowNumber}
Requirement: ${requirementName}
GitHub Issue: ${issueUrl}
Issue State: ${issueState}

IMPORTANT: Please update the Product JIRA ticket with this status change.
// TODO instead of the productJira I want the link to the jira
Product JIRA: ${productJira || 'Not specified'}

This is an automated notification from the ABLE Team Initiatives Planning Sheet.`
};
