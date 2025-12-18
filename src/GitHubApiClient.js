/**
 * Fetches the state of a GitHub issue
 * @param {string} issueUrl - GitHub issue URL (e.g., https://github.com/owner/repo/issues/123)
 * @return {string|null} - Issue state ('open' or 'closed') or null if invalid URL or failed
 */
function fetchGitHubIssueState(issueUrl) {
  const githubIssueRegex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)$/;
  const match = issueUrl.match(githubIssueRegex);

  if (!match) {
    return null;
  }

  const owner = match[1];
  const repo = match[2];
  const issueNumber = match[3];

  if (GITHUB_API_ENABLE_MOCK_ANSWER) {
    Logger.log(`  → Using mock response (GITHUB_API_ENABLE_MOCK_ANSWER=true)`);
    return "closed";
  }

  const apiUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/issues/${issueNumber}`;
  Logger.log(`  → Fetching issue state from: ${apiUrl}`);

  try {
    const options = {
      method: 'get',
      headers: {
        'Accept': 'application/json',
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    const statusCode = response.getResponseCode();

    if (statusCode === 200) {
      const data = JSON.parse(response.getContentText());
      const state = data.state; // 'open' or 'closed'
      Logger.log(`Issue state: ${state}`);
      return state;
    } else if (statusCode === 404) {
        Logger.log(`GitHub response: ${statusCode}`);
    }
  } catch (error) {
    Logger.log(`  ✗ Error fetching issue state: ${error.message}`);
  }
  return null;
}
