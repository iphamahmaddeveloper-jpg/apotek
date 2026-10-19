import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(number) {
  const validNum = typeof number === 'number' && !isNaN(number) ? number : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(validNum);
}

/**
 * Escapes characters for safe inclusion in HTML templates.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Get date formatted in specified timezone (default: Asia/Makassar).
 */
export function getLocalDateString(dateInput = new Date(), timeZone = 'Asia/Makassar') {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  
  // Format as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Check if a date falls on the same calendar day in the given timezone.
 */
export function isSameDayInTimezone(date1, date2 = new Date(), timeZone = 'Asia/Makassar') {
  const d1Str = getLocalDateString(date1, timeZone);
  const d2Str = getLocalDateString(date2, timeZone);
  return !!d1Str && d1Str === d2Str;
}

/**
 * Check if a date falls in the same calendar month and year in the given timezone.
 */
export function isSameMonthInTimezone(date1, date2 = new Date(), timeZone = 'Asia/Makassar') {
  const d1Str = getLocalDateString(date1, timeZone);
  const d2Str = getLocalDateString(date2, timeZone);
  if (!d1Str || !d2Str) return false;
  return d1Str.slice(0, 7) === d2Str.slice(0, 7); // YYYY-MM
}

/**
 * Check if a date falls in the same calendar year in the given timezone.
 */
export function isSameYearInTimezone(date1, date2 = new Date(), timeZone = 'Asia/Makassar') {
  const d1Str = getLocalDateString(date1, timeZone);
  const d2Str = getLocalDateString(date2, timeZone);
  if (!d1Str || !d2Str) return false;
  return d1Str.slice(0, 4) === d2Str.slice(0, 4); // YYYY
}

/**
 * Check if a date is within the last N days relative to target date in the given timezone.
 */
export function isWithinPastDaysInTimezone(dateInput, days = 7, referenceDate = new Date()) {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const ref = typeof referenceDate === 'string' || typeof referenceDate === 'number' ? new Date(referenceDate) : referenceDate;
  if (isNaN(d.getTime()) || isNaN(ref.getTime())) return false;
  
  const diffMs = ref.getTime() - d.getTime();
  const maxMs = days * 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= maxMs;
}

/**
 * Format full date and time in target timezone (Indonesian locale).
 */
export function formatDateTime(dateInput, timeZone = 'Asia/Makassar') {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

/**
 * Format date for header display.
 */
export function formatHeaderDate(dateInput = new Date(), timeZone = 'Asia/Makassar') {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';
  
  return new Intl.DateTimeFormat('id-ID', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}
