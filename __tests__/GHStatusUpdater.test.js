const {evalSource} = require('./Utils');
const { createMockSheet, createMockRange, resetAllMocks } = require('../__mocks__/gas-api');

global.extractUrlFromCell = jest.fn();
global.fetchGitHubIssueState = jest.fn();
global.sendUpdateNotification = jest.fn();

evalSource( '../src/Config.js')
evalSource( '../src/GHStatusUpdater.js')

describe('updateRowGHStatus', () => {
    let mockSheet;
    let mockRange;
    const richTextRow = Array(6).fill(null);
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

    beforeEach(() => {
        resetAllMocks();
        jest.clearAllMocks();

        mockRange = createMockRange();
        mockSheet = createMockSheet();
        mockSheet.getRange.mockReturnValue(mockRange);

        extractUrlFromCell.mockReset();
        fetchGitHubIssueState.mockReset();
        sendUpdateNotification.mockReset();
    });

    describe("should return false and skip the row ", ()=>{
        it.each([
            ['when GitHub issue URL is invalid or the API fails to fetch the state', 'invalid-url', null],
            ['when GitHub issue is open', 'https://github.com/owner/repo/issues/123', 'open'],
        ])('%s', (_description, githubIssueUrl, fetchGitHubIssueStateMockValue) => {
            const row = [
                'Some requirement',
                'RHEL-12345',
                githubIssueUrl,
                'In progress',
                'John Doe',
                'john@example.com',
                '3',
            ];

            extractUrlFromCell.mockReturnValue(githubIssueUrl);
            fetchGitHubIssueState.mockReturnValue(fetchGitHubIssueStateMockValue);

            const result = updateRowGHStatus(mockSheet, 1, row, richTextRow, columnIndexes, spreadsheetUrl);

            expect(result).toBe(false);
            expect(fetchGitHubIssueState).toHaveBeenCalledWith(githubIssueUrl);
            expect(mockSheet.getRange).not.toHaveBeenCalled();
            expect(mockRange.setValue).not.toHaveBeenCalled();
        });
    });

    describe('when GitHub issue is closed', () => {
        it('should update Status to Finished and Remaining Work to 0', () => {
            const row = [
                'Some requirement',
                'RHEL-12345',
                'https://github.com/owner/repo/issues/123',
                'In progress',
                'John Doe',
                'john@example.com',
                '5',
            ];

            extractUrlFromCell.mockReturnValue('https://github.com/owner/repo/issues/123');
            fetchGitHubIssueState.mockReturnValue('closed');

            const result = updateRowGHStatus(mockSheet, 1, row, richTextRow, columnIndexes, spreadsheetUrl);

            expect(result).toBe(true);
            expect(fetchGitHubIssueState).toHaveBeenCalledWith('https://github.com/owner/repo/issues/123');
            expect(mockRange.setValue).toHaveBeenCalledWith('Finished');
            expect(mockRange.setValue).toHaveBeenCalledWith('0');
            expect(sendUpdateNotification).toHaveBeenCalledWith({
                email: 'john@example.com',
                issueUrl: 'https://github.com/owner/repo/issues/123',
                issueState: 'closed',
                requirementName: 'Some requirement',
                rowNumber: 2,
                productJiraUrl: 'https://github.com/owner/repo/issues/123', 
                responsibleName: 'John Doe',
                spreadsheetUrl,
                updatedStatus: 'Finished'
            });
        });

        it('should skip email notification when no responsible email', () => {

            const row = [
                'Some requirement',
                'RHEL-12345',
                'https://github.com/owner/repo/issues/123',
                'In progress',
                'John Doe',
                '',
                '5',
            ];

            extractUrlFromCell.mockReturnValue('https://github.com/owner/repo/issues/123');
            fetchGitHubIssueState.mockReturnValue('closed');

            const result = updateRowGHStatus(mockSheet, 1, row, richTextRow, columnIndexes, spreadsheetUrl);

            expect(result).toBe(true);
            expect(sendUpdateNotification).not.toHaveBeenCalled();
            expect(Logger.log).toHaveBeenCalledWith(expect.stringContaining('No email found'));
        });
    });
});
