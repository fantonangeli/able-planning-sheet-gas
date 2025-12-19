global.Logger = {
  log: jest.fn(),
  clear: jest.fn(),
  getLog: jest.fn(() => ''),
};

global.MailApp = {
  sendEmail: jest.fn(),
};

global.UrlFetchApp = {
  fetch: jest.fn(),
};

global.Utilities = {
  sleep: jest.fn(),
  formatDate: jest.fn(),
};

const createMockRange = () => ({
  setValue: jest.fn(),
  getValue: jest.fn(),
  setValues: jest.fn(),
  getValues: jest.fn(() => []),
  getFormula: jest.fn(),
  getRow: jest.fn(() => 1),
  getColumn: jest.fn(() => 1),
});

const createMockSheet = (name = 'Sheet1') => ({
  getName: jest.fn(() => name),
  getRange: jest.fn((row, col, numRows, numCols) => createMockRange()),
  getDataRange: jest.fn(() => ({
    getValues: jest.fn(() => []),
    getRichTextValues: jest.fn(() => []),
    getFormulas: jest.fn(() => []),
  })),
  getLastRow: jest.fn(() => 100),
  getLastColumn: jest.fn(() => 10),
});

const createMockSpreadsheet = () => ({
  getActiveSheet: jest.fn(() => createMockSheet()),
  getSheetByName: jest.fn((name) => createMockSheet(name)),
  getSheets: jest.fn(() => [createMockSheet()]),
  getUrl: jest.fn(() => 'https://docs.google.com/spreadsheets/d/123/edit'),
  getId: jest.fn(() => '123'),
  getName: jest.fn(() => 'Test Spreadsheet'),
});

const createMockUi = () => ({
  alert: jest.fn(),
  prompt: jest.fn(),
  ButtonSet: {
    OK: 'OK',
    OK_CANCEL: 'OK_CANCEL',
    YES_NO: 'YES_NO',
    YES_NO_CANCEL: 'YES_NO_CANCEL',
  },
  Button: {
    OK: 'OK',
    CANCEL: 'CANCEL',
    YES: 'YES',
    NO: 'NO',
  },
});

global.SpreadsheetApp = {
  getActiveSpreadsheet: jest.fn(() => createMockSpreadsheet()),
  getUi: jest.fn(() => createMockUi()),
  openById: jest.fn((id) => createMockSpreadsheet()),
  openByUrl: jest.fn((url) => createMockSpreadsheet()),
  create: jest.fn((name) => createMockSpreadsheet()),
};

module.exports = {
  createMockRange,
  createMockSheet,
  createMockSpreadsheet,
  createMockUi,
};
