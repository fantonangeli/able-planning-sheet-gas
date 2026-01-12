const {evalSource} = require('./Utils');

evalSource('../src/Config.js');
evalSource('../src/GitHubApiClient.js');

describe('fetchGitHubIssueState', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        global.GITHUB_API_ENABLE_MOCK_ANSWER = false;
    });

    it.each([
        ['empty string', ''],
        ['invalid URL format', 'not-a-url'],
        ['non-GitHub URL', 'https://example.com/issues/123'],
        ['GitHub URL without issue number', 'https://github.com/owner/repo/issues'],
        ['GitHub URL with extra path', 'https://github.com/owner/repo/issues/123/extra'],
        ['GitHub pull request URL', 'https://github.com/owner/repo/pull/123'],
    ])('should return null for %s', (_description, url) => {
        expect(fetchGitHubIssueState(url)).toBeNull();
    });

    it.each([
        ['null', null],
        ['undefined', undefined],
    ])('should throw error when issueUrl is %s', (_description, url) => {
        expect(() => fetchGitHubIssueState(url)).toThrow();
    });

    it('should return "closed" when GITHUB_API_ENABLE_MOCK_ANSWER is true', () => {
        global.GITHUB_API_ENABLE_MOCK_ANSWER = true;

        expect(fetchGitHubIssueState('https://github.com/owner/repo/issues/123')).toBe('closed');
        expect(UrlFetchApp.fetch).not.toHaveBeenCalled();
    });

    it('should return "open" when API returns state open', () => {
        UrlFetchApp.fetch.mockReturnValue({
            getResponseCode: jest.fn(() => 200),
            getContentText: jest.fn(() => JSON.stringify({ state: "open" }))
        });

        expect(fetchGitHubIssueState('https://github.com/owner/repo/issues/123')).toBe("open");
        expect(UrlFetchApp.fetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/owner/repo/issues/123',
            expect.objectContaining({
                method: 'get',
                headers: {
                    'Accept': 'application/json',
                },
                muteHttpExceptions: true
            })
        );
    });

    it.each([
        ['404', 404],
        ['501', 501],
    ])('should return null when API returns %s status code', (_description, statusCode) => {
        UrlFetchApp.fetch.mockReturnValue({
            getResponseCode: jest.fn(() => statusCode),
            getContentText: jest.fn(() => JSON.stringify({ message: 'Error' }))
        });

        expect(fetchGitHubIssueState('https://github.com/owner/repo/issues/123')).toBeNull();
    });

    it('should return null when fetch throws error', () => {
        UrlFetchApp.fetch.mockImplementation(() => {
            throw new Error('Network error');
        });

        expect(fetchGitHubIssueState('https://github.com/owner/repo/issues/123')).toBeNull();
    });
});
