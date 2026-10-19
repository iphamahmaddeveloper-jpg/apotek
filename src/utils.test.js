import { describe, it, expect } from 'vitest';
import {
  formatRupiah,
  escapeHtml,
  getLocalDateString,
  isSameDayInTimezone,
  isSameMonthInTimezone,
  isSameYearInTimezone,
  isWithinPastDaysInTimezone,
  formatDateTime
} from './utils';

describe('Utility Functions', () => {
  describe('formatRupiah', () => {
    it('formats integer rupiah correctly', () => {
      const formatted = formatRupiah(50000);
      expect(formatted).toContain('50.000');
    });

    it('handles 0 and invalid inputs gracefully', () => {
      expect(formatRupiah(0)).toContain('0');
      expect(formatRupiah(null)).toContain('0');
      expect(formatRupiah(NaN)).toContain('0');
    });
  });

  describe('escapeHtml', () => {
    it('escapes dangerous HTML special characters', () => {
      const dangerous = '<script>alert("xss & \'injection\'")</script>';
      const escaped = escapeHtml(dangerous);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss &amp; &#39;injection&#39;&quot;)&lt;/script&gt;');
    });

    it('handles non-string or empty inputs', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(12345)).toBe('12345');
    });
  });

  describe('Timezone-aware Date Utilities (Asia/Makassar UTC+8)', () => {
    it('calculates correct local date string across UTC boundaries', () => {
      const dateUtc = '2026-10-02T17:30:00Z';
      const makassarDate = getLocalDateString(dateUtc, 'Asia/Makassar');
      expect(makassarDate).toBe('2026-10-03');
    });

    it('matches same day in target timezone correctly', () => {
      const dateUtc1 = '2026-10-02T16:00:00Z'; // 2026-10-03 00:00 WITA
      const dateUtc2 = '2026-10-02T23:59:00Z'; // 2026-10-03 07:59 WITA
      const dateUtc3 = '2026-10-02T15:59:00Z'; // 2026-10-02 23:59 WITA

      expect(isSameDayInTimezone(dateUtc1, dateUtc2, 'Asia/Makassar')).toBe(true);
      expect(isSameDayInTimezone(dateUtc1, dateUtc3, 'Asia/Makassar')).toBe(false);
    });

    it('checks same month and year in target timezone', () => {
      const date1 = '2026-10-02T10:00:00Z';
      const date2 = '2026-10-25T10:00:00Z';
      const date3 = '2026-11-01T10:00:00Z';
      const date4 = '2025-10-02T10:00:00Z';

      expect(isSameMonthInTimezone(date1, date2, 'Asia/Makassar')).toBe(true);
      expect(isSameMonthInTimezone(date1, date3, 'Asia/Makassar')).toBe(false);
      expect(isSameYearInTimezone(date1, date2, 'Asia/Makassar')).toBe(true);
      expect(isSameYearInTimezone(date1, date4, 'Asia/Makassar')).toBe(false);
    });

    it('checks if date is within past days', () => {
      const now = new Date('2026-10-10T12:00:00Z');
      const fourDaysAgo = new Date('2026-10-06T12:00:00Z');
      const tenDaysAgo = new Date('2026-09-30T12:00:00Z');

      expect(isWithinPastDaysInTimezone(fourDaysAgo, 7, now)).toBe(true);
      expect(isWithinPastDaysInTimezone(tenDaysAgo, 7, now)).toBe(false);
    });

    it('formats date and time in target timezone', () => {
      const dateUtc = '2026-10-02T07:30:00Z'; // 15:30 WITA
      const formatted = formatDateTime(dateUtc, 'Asia/Makassar');
      expect(formatted).toContain('15.30');
      expect(formatted).toContain('Okt');
      expect(formatted).toContain('2026');
    });
  });
});
