const {evalSource} = require('./Utils');
const { createMockSheet, createMockSpreadsheet, createMockUi } = require('./__mocks__/gas-api');

evalSource('../src/Config.js');
evalSource('../src/GetSheetContext.js');

describe('getSheetContext', () => {
    let mockSheet;
    let mockSpreadsheet;
    let mockUi;
    let mockDataRange;

    const mockSheetContextdata = [
        ['Requirement', 'Product JIRA', 'Upstream Issue', 'Status', 'Responsible', 'Responsible email', 'Remaining Work'],
        ['Requirement 1', 'https://issues.jira.com/browse/JIRA-1', 'https://github.com/owner/repo/issues/1', 'In progress', 'John', 'john@example.com', '5'],
        ['Requirement 2', 'https://issues.jira.com/browse/JIRA-2', 'https://github.com/owner/repo/issues/2', 'In progress', 'Jane', 'jane@example.com', '3'],
        ['Requirement 3', 'https://issues.jira.com/browse/JIRA-3', 'https://github.com/owner/repo/issues/3', 'Finished', 'Bob', 'bob@example.com', '0'],
        ['Requirement 4', 'https://issues.jira.com/browse/JIRA-4', 'https://github.com/owner/repo/issues/4', 'In progress', 'Alice', 'alice@example.com', '2'],
        ['Requirement 5', 'https://issues.jira.com/browse/JIRA-5', 'https://github.com/owner/repo/issues/5', 'Not started', 'Charlie', 'charlie@example.com', '7'],
    ];

    beforeEach(() => {
        jest.resetAllMocks();

        mockDataRange = {
            getValues: jest.fn(() => mockSheetContextdata),
            getRichTextValues: jest.fn(() => mockSheetContextdata),
        };

        mockSheet = createMockSheet('Requirements');
        mockSheet.getDataRange.mockReturnValue(mockDataRange);

        mockUi = createMockUi();

        mockSpreadsheet = createMockSpreadsheet();
        mockSpreadsheet.getSheetByName.mockReturnValue(mockSheet);

        SpreadsheetApp.getActiveSpreadsheet.mockReturnValue(mockSpreadsheet);
        SpreadsheetApp.getUi.mockReturnValue(mockUi);
    });

    it('should return context with sheet, values, richTextValues and columnIndexes', () => {
        const result = getSheetContext();

        expect(result).toEqual({
            sheet: mockSheet,
            values: mockSheetContextdata,
            richTextValues: mockSheetContextdata,
            columnIndexes: {
                statusColIndex: 3,
                upstreamIssueColIndex: 2,
                responsibleColIndex: 4,
                responsibleEmailColIndex: 5,
                requirementColIndex: 0,
                productJiraColIndex: 1,
                remainingWorkColIndex: 6,
            }
        });
    });

    it('should throw error when sheet is not found', () => {
        mockSpreadsheet.getSheetByName.mockReturnValue(null);

        expect(() => getSheetContext()).toThrow('Sheet \'Requirements\' not found!');
        expect(mockUi.alert).toHaveBeenCalled();
    });

    it.each([
        ['Status', ['Requirement', 'Product JIRA', 'Upstream Issue', 'Responsible', 'Responsible email', 'Remaining Work Eng']],
        ['Upstream Issue', ['Requirement', 'Product JIRA', 'Status', 'Responsible', 'Responsible email', 'Remaining Work Eng']],
        ['Remaining Work', ['Requirement', 'Product JIRA', 'Upstream Issue', 'Status', 'Responsible', 'Responsible email', 'QE Assignee']],
    ])('should throw error when %s column is missing', (_columnName, headers) => {
        const values = [...mockSheetContextdata];
        values[0] = headers;
        mockDataRange.getValues.mockReturnValue(values);
        mockDataRange.getRichTextValues.mockReturnValue(values);

        expect(() => getSheetContext()).toThrow('Required columns not found!');
        expect(mockUi.alert).toHaveBeenCalled();
    });
});
