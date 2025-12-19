const {evalSource} = require('./Utils');

evalSource('../src/UrlExtractor.js');

describe('extractUrlFromCell', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it.each([
        ['null', null],
        ['undefined', undefined],
        ['empty string', ''],
    ])('should return empty string when value is %s', (_description, value) => {
        expect(extractUrlFromCell(value, null)).toBe('');
    });

    it.each([
        ['standard formula', '=HYPERLINK("https://github.com/owner/repo/issues/123", "Issue #123")', 'https://github.com/owner/repo/issues/123'],
        ['case-insensitive formula', '=hyperlink("https://example.com", "label")', 'https://example.com'],
    ])('should extract URL from HYPERLINK %s', (_description, formula, expectedUrl) => {
        expect(extractUrlFromCell(formula, null)).toBe(expectedUrl);
    });

    it('should handle rich text with link', () => {
        const richTextValue = {
            getLinkUrl: jest.fn(() => 'https://example.com/link')
        };

        expect(extractUrlFromCell( 'Some text', richTextValue)).toBe('https://example.com/link');
        expect(richTextValue.getLinkUrl).toHaveBeenCalled();
    });

    it.each([
        ['plain text URL', 'https://github.com/owner/repo/issues/456', 'https://github.com/owner/repo/issues/456'],
        ['URL with whitespace', '  https://example.com  ', 'https://example.com'],
        ['non-string value', 12345, '12345'],
    ])('should return %s as plain text', (_description, value, expected) => {
        expect(extractUrlFromCell(value, null)).toBe(expected);
    });
});
