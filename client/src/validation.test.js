import { validateReading } from './validation';
import { getStatus } from './constants';

const TODAY = '2026-10-15';
const valid = { date: TODAY, slot: 'morning_fasting', value: '110' };

describe('validateReading', () => {
  test('accepts a valid reading', () => {
    expect(validateReading(valid, TODAY)).toBe('');
  });

  test('accepts the boundary values 40 and 600', () => {
    expect(validateReading({ ...valid, value: '40' }, TODAY)).toBe('');
    expect(validateReading({ ...valid, value: '600' }, TODAY)).toBe('');
  });

  test('allows today but not tomorrow', () => {
    expect(validateReading({ ...valid, date: '2026-10-16' }, TODAY)).toBe('Date cannot be in the future.');
  });
});

describe('getStatus', () => {
  test.each([
    [69, 'Low'],
    [70, 'Normal'],
    [180, 'Normal'],
    [181, 'High'],
  ])('%i mg/dl is %s', (value, status) => {
    expect(getStatus(value)).toBe(status);
  });
});
