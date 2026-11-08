// Unit tests for the pure validation function (no database needed)
const { validateReadingInput } = require('../src/validation/readingValidation');
const { isValidDateString } = require('../src/utils/dates');

const TODAY = '2026-10-15';
const valid = { date: '2026-10-15', slot: 'morning_fasting', value: 110 };

afterAll(() => require('../src/db').pool.end());

describe('validateReadingInput', () => {
  test('accepts a valid reading and converts the value to a number', () => {
    expect(validateReadingInput({ ...valid, value: '110' }, TODAY)).toEqual({
      data: { date: '2026-10-15', slot: 'morning_fasting', value: 110 },
    });
  });

  test('accepts the boundary values 40 and 600', () => {
    expect(validateReadingInput({ ...valid, value: 40 }, TODAY).error).toBeUndefined();
    expect(validateReadingInput({ ...valid, value: 600 }, TODAY).error).toBeUndefined();
  });

  test('treats an empty value as missing', () => {
    expect(validateReadingInput({ ...valid, value: '  ' }, TODAY).error).toBe(
      'Please enter a glucose value.'
    );
  });

  test('rejects non-numbers', () => {
    expect(validateReadingInput({ ...valid, value: 'abc' }, TODAY).error).toBe(
      'Value must be between 40 and 600 mg/dl.'
    );
  });

  test('allows today but not tomorrow', () => {
    expect(validateReadingInput({ ...valid, date: TODAY }, TODAY).error).toBeUndefined();
    expect(validateReadingInput({ ...valid, date: '2026-10-16' }, TODAY).error).toBe(
      'Date cannot be in the future.'
    );
  });

  test('rejects an unknown slot', () => {
    expect(validateReadingInput({ ...valid, slot: 'midnight' }, TODAY).error).toBe(
      'Please select a valid time slot.'
    );
  });
});

describe('isValidDateString', () => {
  test.each([
    ['2026-02-28', true],
    ['2028-02-29', true], // leap year
    ['2026-02-29', false],
    ['2026-13-01', false],
    ['15-10-2026', false],
    ['', false],
  ])('%s -> %s', (input, expected) => {
    expect(isValidDateString(input)).toBe(expected);
  });
});
