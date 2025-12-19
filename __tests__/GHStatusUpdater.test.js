const {evalSource} = require('./Utils');
const { createMockSheet, createMockRange } = require('../__mocks__/gas-api');

global.extractUrlFromCell = jest.fn();
global.fetchGitHubIssueState = jest.fn();
global.sendUpdateNotification = jest.fn();

evalSource( '../src/Config.js')
evalSource( '../src/GHStatusUpdater.js')

const richTextRow = Array(7).fill(null);
const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/12345678910/edit';
const columnIndexes = {
    requirementColIndex: 0,
    productJiraColIndex: 1,
    upstreamIssueColIndex: 2,
    statusColIndex: 3,
    responsibleColIndex: 4,
    responsibleEmailColIndex: 5,
    remainingWorkColIndex: 6,
};

describe('updateRowGHStatus', () => {
    let mockSheet;
    let mockRange;

    beforeEach(() => {
        jest.resetAllMocks();

        mockRange = createMockRange();
        mockSheet = createMockSheet();
        mockSheet.getRange.mockReturnValue(mockRange);

        extractUrlFromCell.mockImplementation((url) => url);
    });

    describe("should return false and skip the row ", ()=>{
        it.each([
            ['when GitHub issue URL is invalid or the API fails to fetch the state', 'invalid-url', null],
            ['when GitHub issue is open', 'https://github.com/owner/repo/issues/123', 'open'],
        ])('%s', (_description, githubIssueUrl, fetchGitHubIssueStateMockValue) => {
            const row = [
                'Some requirement',
                'https://issues.jira.com/browse/JIRA-12345',
                githubIssueUrl,
                'In progress',
                'John Doe',
                'john@example.com',
                '3',
            ];

            fetchGitHubIssueState.mockReturnValue(fetchGitHubIssueStateMockValue);

            const result = updateRowGHStatus(mockSheet, 1, row, richTextRow, columnIndexes, spreadsheetUrl);

            expect(result).toBe(false);
            expect(fetchGitHubIssueState).toHaveBeenCalledWith(githubIssueUrl);
            expect(mockRange.setValue).not.toHaveBeenCalled();
        });
    });

    describe('when GitHub issue is closed', () => {
        it('should update Status to Finished and Remaining Work to 0', () => {
            const row = [
                'Some requirement',
                'https://issues.jira.com/browse/JIRA-12345',
                'https://github.com/owner/repo/issues/123',
                'In progress',
                'John Doe',
                'john@example.com',
                '5',
            ];

            fetchGitHubIssueState.mockReturnValue('closed');

            const result = updateRowGHStatus(mockSheet, 1, row, richTextRow, columnIndexes, spreadsheetUrl);

            expect(result).toBe(true);
            expect(fetchGitHubIssueState).toHaveBeenCalledWith('https://github.com/owner/repo/issues/123');
            expect(mockRange.setValue).toHaveBeenCalledWith('Finished');
            expect(mockRange.setValue).toHaveBeenCalledWith('0');
            expect(sendUpdateNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                email: 'john@example.com',
                issueUrl: 'https://github.com/owner/repo/issues/123',
                issueState: 'closed',
                requirementName: 'Some requirement',
                rowNumber: 2,
                productJiraUrl: 'https://issues.jira.com/browse/JIRA-12345', 
                responsibleName: 'John Doe',
                spreadsheetUrl,
                updatedStatus: 'Finished'
                })
            );
        });

        it('should skip email notification when responsible email is not set', () => {

            const row = [
                'Some requirement',
                'https://issues.jira.com/browse/JIRA-12345',
                'https://github.com/owner/repo/issues/123',
                'In progress',
                'John Doe',
                '',
                '5',
            ];

            fetchGitHubIssueState.mockReturnValue('closed');

            const result = updateRowGHStatus(mockSheet, 1, row, richTextRow, columnIndexes, spreadsheetUrl);

            expect(result).toBe(true);
            expect(sendUpdateNotification).not.toHaveBeenCalled();
        });
    });
});
