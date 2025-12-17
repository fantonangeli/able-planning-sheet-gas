/**
 * Fetches the state of a GitHub issue
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} issueNumber - Issue number
 * @return {string|null} - Issue state ('open' or 'closed') or null if failed
 */
function fetchGitHubIssueState(owner, repo, issueNumber) {
  // Mock response if enabled (useful for testing)
  if (GITHUB_API_ENABLE_MOCK_ANSWER) {
    Logger.log(`  → Using mock response (GITHUB_API_ENABLE_MOCK_ANSWER=true)`);
    return "closed";
  }

  const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/issues/${issueNumber}`;
  Logger.log(`  → Fetching issue state from: ${url}`);

  try {
    const options = {
      method: 'get',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Google-Apps-Script'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();

    if (statusCode === 200) {
      const data = JSON.parse(response.getContentText());
      const state = data.state; // 'open' or 'closed'
      Logger.log(`  → Issue state: ${state}`);
      return state;
    } else if (statusCode === 404) {
      Logger.log(`  ⚠ Issue not found (404)`);
      return null;
    } else if (statusCode === 403) {
      Logger.log(`  ⚠ Rate limit exceeded (403). Consider adding a GitHub token.`);
      return null;
    } else {
      Logger.log(`  ⚠ GitHub API returned status code: ${statusCode}`);
      return null;
    }
  } catch (error) {
    Logger.log(`  ✗ Error fetching issue state: ${error.message}`);
    return null;
  }
}

/**
 * Parses a GitHub issue URL and extracts owner, repo, and issue number
 * @param {string} issueUrl - GitHub issue URL
 * @return {Object|null} - Object with owner, repo, issueNumber or null if invalid
 */
function parseGitHubIssueUrl(issueUrl) {
  const githubIssueRegex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)$/;
  const match = issueUrl.match(githubIssueRegex);

  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      issueNumber: match[3]
    };
  }

  return null;
}
