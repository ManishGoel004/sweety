const { getReportRange, getMonthRange, daysInMonth } = require('../src/utils/dateRanges');

test('getMonthRange gives the whole calendar month', () => {
  expect(getMonthRange('2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  expect(getMonthRange('2028-02-03')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
});

describe('getReportRange - examples from the assignment (selected date 15 Oct 2026)', () => {
  test('daily is the selected date', () => {
    expect(getReportRange('daily', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' });
  });

  test('month-to-date is the 1st of the month to the selected date', () => {
    expect(getReportRange('mtd', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });

  test('monthly is the whole previous month', () => {
    expect(getReportRange('monthly', '2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });
});

describe('getReportRange - edge cases', () => {
  test('monthly in January gives December of the previous year', () => {
    expect(getReportRange('monthly', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  test('monthly in March gives February (leap and non-leap years)', () => {
    expect(getReportRange('monthly', '2026-03-05').to).toBe('2026-02-28');
    expect(getReportRange('monthly', '2028-03-05').to).toBe('2028-02-29');
  });

  test('month-to-date on the 1st is a single day', () => {
    expect(getReportRange('mtd', '2026-11-01')).toEqual({ from: '2026-11-01', to: '2026-11-01' });
  });

  test('unknown type throws', () => {
    expect(() => getReportRange('yearly', '2026-10-15')).toThrow();
  });
});

test('daysInMonth', () => {
  expect(daysInMonth(2026, 2)).toBe(28);
  expect(daysInMonth(2028, 2)).toBe(29);
  expect(daysInMonth(2026, 4)).toBe(30);
  expect(daysInMonth(2026, 12)).toBe(31);
});
