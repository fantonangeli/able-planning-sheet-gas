const {evalSource} = require('./Utils');
const { createMockSheet, createMockRange, createMockUi } = require('./__mocks__/gas-api');

global.extractUrlFromCell = jest.fn();
global.fetchGitHubIssueState = jest.fn();
global.sendUpdateNotification = jest.fn();

evalSource( '../src/Config.js')
evalSource( '../src/GHStatusUpdater.js')

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

const createTestRow = (overrides = {}) => [
    overrides.requirement || 'Some requirement',
    overrides.productJira || 'https://issues.jira.com/browse/JIRA-12345',
    overrides.upstreamIssue || 'https://github.com/owner/repo/issues/123',
    overrides.status || 'In progress',
    overrides.responsible || 'John Doe',
    overrides.email !== undefined ? overrides.email : 'john@example.com',
    overrides.remainingWork || '5',
];

const mockEmptySheetContextdata = [
    ['Requirement', 'Product JIRA', 'Upstream Issue', 'Status', 'Responsible', 'Responsible email', 'Remaining Work'],
];

const mockSheetContextdata = [
    ['Requirement', 'Product JIRA', 'Upstream Issue', 'Status', 'Responsible', 'Responsible email', 'Remaining Work'],
    ['Requirement 1', 'https://issues.jira.com/browse/JIRA-1', 'https://github.com/owner/repo/issues/1', 'In progress', 'John', 'john@example.com', '5'],
    ['Requirement 2', 'https://issues.jira.com/browse/JIRA-2', 'https://github.com/owner/repo/issues/2', 'In progress', 'Jane', 'jane@example.com', '3'],
    ['Requirement 3', 'https://issues.jira.com/browse/JIRA-3', 'https://github.com/owner/repo/issues/3', 'Finished', 'Bob', 'bob@example.com', '0'],
    ['Requirement 4', 'https://issues.jira.com/browse/JIRA-4', 'https://github.com/owner/repo/issues/4', 'In progress', 'Alice', 'alice@example.com', '2'],
    ['Requirement 5', 'https://issues.jira.com/browse/JIRA-5', 'https://github.com/owner/repo/issues/5', 'Not started', 'Charlie', 'charlie@example.com', '7'],
];

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
            const row = createTestRow({ upstreamIssue: githubIssueUrl, remainingWork: '3' });

            fetchGitHubIssueState.mockReturnValue(fetchGitHubIssueStateMockValue);

            const result = updateRowGHStatus(mockSheet, 1, row, row, columnIndexes, spreadsheetUrl);

            expect(result).toBe(false);
            expect(fetchGitHubIssueState).toHaveBeenCalledWith(githubIssueUrl);
            expect(mockRange.setValue).not.toHaveBeenCalled();
        });
    });

    describe('when GitHub issue is closed', () => {
        it('should update Status to Finished and Remaining Work to 0', () => {
            const row = createTestRow();

            fetchGitHubIssueState.mockReturnValue('closed');

            const result = updateRowGHStatus(mockSheet, 1, row, row, columnIndexes, spreadsheetUrl);

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
            const row = createTestRow({ email: '' });

            fetchGitHubIssueState.mockReturnValue('closed');

            const result = updateRowGHStatus(mockSheet, 1, row, row, columnIndexes, spreadsheetUrl);

            expect(result).toBe(true);
            expect(sendUpdateNotification).not.toHaveBeenCalled();
        });
    });
});

describe("updateAllGHStatuses", () => {
    let mockSheet;
    let mockUi;
    let originalUpdateRowGHStatus;
    let updateRowGHStatusSpy;
    let originalGetSheetContext;

    beforeEach(() => {
        jest.resetAllMocks();
        global.DELAY_BETWEEN_ROWS_MS = 0;
        global.MAX_ROWS_TO_PROCESS = 1000;

        mockSheet = createMockSheet();
        mockUi = createMockUi();

        const mockSpreadsheet = {
            getUrl: jest.fn().mockReturnValue(spreadsheetUrl),
        };

        SpreadsheetApp.getUi.mockReturnValue(mockUi);
        SpreadsheetApp.getActiveSpreadsheet.mockReturnValue(mockSpreadsheet);

        originalUpdateRowGHStatus = global.updateRowGHStatus;
        updateRowGHStatusSpy = jest.fn().mockReturnValue(true);
        global.updateRowGHStatus = updateRowGHStatusSpy;

        originalGetSheetContext = global.getSheetContext;
        global.getSheetContext = jest.fn().mockReturnValue({
            sheet: mockSheet,
            values: mockSheetContextdata,
            richTextValues: mockSheetContextdata,
            columnIndexes,
        });
    });

    afterEach(() => {
        global.updateRowGHStatus = originalUpdateRowGHStatus;
        global.getSheetContext = originalGetSheetContext;
    });

    describe('should call updateRowGHStatus', () => {
        it('when there are in progress rows', () => {
            updateAllGHStatuses();

            expect(updateRowGHStatusSpy).toHaveBeenCalledTimes(3);
            expect(updateRowGHStatusSpy).toHaveBeenNthCalledWith(
                1,
                mockSheet,
                1,
                ['Requirement 1', 'https://issues.jira.com/browse/JIRA-1', 'https://github.com/owner/repo/issues/1', 'In progress', 'John', 'john@example.com', '5'],
                ['Requirement 1', 'https://issues.jira.com/browse/JIRA-1', 'https://github.com/owner/repo/issues/1', 'In progress', 'John', 'john@example.com', '5'],
                columnIndexes,
                spreadsheetUrl
            );
            expect(mockUi.alert).toHaveBeenCalled();
        });

        it('when there are in progress rows and DELAY_BETWEEN_ROWS_MS is 500 and respected', () => {
            global.DELAY_BETWEEN_ROWS_MS = 500;

            updateAllGHStatuses();

            expect(updateRowGHStatusSpy).toHaveBeenCalledTimes(3);
            expect(Utilities.sleep).toHaveBeenCalledTimes(3);
            expect(Utilities.sleep).toHaveBeenCalledWith(500);
            expect(mockUi.alert).toHaveBeenCalled();
        });

        it('only once when there are 2 in progress rows and MAX_ROWS_TO_PROCESS is set to 1', () => {
            global.MAX_ROWS_TO_PROCESS = 1;

            updateAllGHStatuses();

            expect(updateRowGHStatusSpy).toHaveBeenCalledTimes(1);
            expect(mockUi.alert).toHaveBeenCalledWith(
                'Sync Completed',
                'Updated: 1 row(s)\nSkipped: 0 row(s)',
                mockUi.ButtonSet.OK
            );
        });
    });

    describe('should not call updateRowGHStatus', () => {
        it('when there are no "in progress" rows', () => {
            const noInProgressRows = mockSheetContextdata.map((row, index) => {
                if (index === 0) return row;
                const newRow = [...row];
                newRow[3] = 'Finished';
                return newRow;
            });

            global.getSheetContext.mockReturnValue({
                sheet: mockSheet,
                values: noInProgressRows,
                richTextValues: mockSheetContextdata,
                columnIndexes,
            });

            updateAllGHStatuses();

            expect(updateRowGHStatusSpy).not.toHaveBeenCalled();
            expect(mockUi.alert).toHaveBeenCalled();
        });

        it('when there are no rows', () => {
            global.getSheetContext.mockReturnValue({
                sheet: mockSheet,
                values: [mockSheetContextdata[0]],
                richTextValues: [mockSheetContextdata[0]],
                columnIndexes,
            });

            updateAllGHStatuses();

            expect(updateRowGHStatusSpy).not.toHaveBeenCalled();
            expect(mockUi.alert).toHaveBeenCalled();
        });
    });
});
