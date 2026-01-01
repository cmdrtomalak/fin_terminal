import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    formatNumber,
    formatMarketCap,
    formatTime,
    formatStatementValue,
    formatRatioValue,
    getValueClass,
} from '../utils';

describe('formatNumber', () => {
    it('formats billions correctly', () => {
        expect(formatNumber(1_500_000_000)).toBe('1.50B');
        expect(formatNumber(10_000_000_000)).toBe('10.00B');
    });

    it('formats millions correctly', () => {
        expect(formatNumber(1_500_000)).toBe('1.50M');
        expect(formatNumber(999_999_999)).toBe('1000.00M');
    });

    it('formats thousands correctly', () => {
        expect(formatNumber(1_500)).toBe('1.50K');
        expect(formatNumber(999_999)).toBe('1000.00K');
    });

    it('formats small numbers correctly', () => {
        expect(formatNumber(500)).toBe('500');
        expect(formatNumber(0)).toBe('0');
        expect(formatNumber(999)).toBe('999');
    });
});

describe('formatMarketCap', () => {
    it('formats trillions correctly', () => {
        expect(formatMarketCap(1_500_000_000_000)).toBe('$1.50T');
        expect(formatMarketCap(3_000_000_000_000)).toBe('$3.00T');
    });

    it('formats billions correctly', () => {
        expect(formatMarketCap(150_000_000_000)).toBe('$150.00B');
        expect(formatMarketCap(1_000_000_000)).toBe('$1.00B');
    });

    it('formats millions correctly', () => {
        expect(formatMarketCap(500_000_000)).toBe('$500.00M');
        expect(formatMarketCap(1_000_000)).toBe('$1.00M');
    });
});

describe('formatTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-12-31T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns "Just now" for timestamps less than 1 hour ago', () => {
        const thirtyMinutesAgo = new Date('2025-12-31T11:30:00Z').toISOString();
        expect(formatTime(thirtyMinutesAgo)).toBe('Just now');
    });

    it('returns hours ago for timestamps within 24 hours', () => {
        const threeHoursAgo = new Date('2025-12-31T09:00:00Z').toISOString();
        expect(formatTime(threeHoursAgo)).toBe('3h ago');

        const twentyThreeHoursAgo = new Date('2025-12-30T13:00:00Z').toISOString();
        expect(formatTime(twentyThreeHoursAgo)).toBe('23h ago');
    });

    it('returns date for timestamps older than 24 hours', () => {
        const twoDaysAgo = new Date('2025-12-29T12:00:00Z').toISOString();
        const result = formatTime(twoDaysAgo);
        expect(result).toMatch(/\d+\/\d+\/\d+/);
    });
});

describe('formatStatementValue', () => {
    it('returns "—" for null values', () => {
        expect(formatStatementValue(null)).toBe('—');
    });

    it('returns "—" for NaN values', () => {
        expect(formatStatementValue(NaN)).toBe('—');
    });

    it('formats billions with sign', () => {
        expect(formatStatementValue(5_500_000_000)).toBe('$5.5B');
        expect(formatStatementValue(-5_500_000_000)).toBe('-$5.5B');
    });

    it('formats millions with sign', () => {
        expect(formatStatementValue(250_000_000)).toBe('$250.0M');
        expect(formatStatementValue(-250_000_000)).toBe('-$250.0M');
    });

    it('formats thousands with sign', () => {
        expect(formatStatementValue(50_000)).toBe('$50.0K');
        expect(formatStatementValue(-50_000)).toBe('-$50.0K');
    });

    it('formats small numbers correctly', () => {
        expect(formatStatementValue(500)).toBe('$500');
        expect(formatStatementValue(-500)).toBe('-$500');
        expect(formatStatementValue(0)).toBe('$0');
    });
});

describe('formatRatioValue', () => {
    it('returns "N/A" for null values', () => {
        expect(formatRatioValue(null)).toBe('N/A');
        expect(formatRatioValue(null, 'percent')).toBe('N/A');
        expect(formatRatioValue(null, 'currency')).toBe('N/A');
        expect(formatRatioValue(null, 'ratio')).toBe('N/A');
    });

    it('returns "N/A" for NaN values', () => {
        expect(formatRatioValue(NaN)).toBe('N/A');
    });

    it('formats percent type correctly', () => {
        expect(formatRatioValue(0.25, 'percent')).toBe('25.00%');
        expect(formatRatioValue(0.0585, 'percent')).toBe('5.85%');
        expect(formatRatioValue(-0.10, 'percent')).toBe('-10.00%');
    });

    it('formats currency type correctly', () => {
        expect(formatRatioValue(1_000_000_000, 'currency')).toBe('$1.00B');
        expect(formatRatioValue(500_000_000, 'currency')).toBe('$500.00M');
    });

    it('formats ratio type correctly', () => {
        expect(formatRatioValue(15.75, 'ratio')).toBe('15.75');
        expect(formatRatioValue(0.85, 'ratio')).toBe('0.85');
    });

    it('formats number type (default) correctly', () => {
        expect(formatRatioValue(1_500_000)).toBe('1.50M');
        expect(formatRatioValue(1_500_000, 'number')).toBe('1.50M');
    });
});

describe('getValueClass', () => {
    it('returns empty string for null', () => {
        expect(getValueClass(null)).toBe('');
    });

    it('returns "positive" for positive numbers', () => {
        expect(getValueClass(100)).toBe('positive');
        expect(getValueClass(0.01)).toBe('positive');
    });

    it('returns "positive" for zero', () => {
        expect(getValueClass(0)).toBe('positive');
    });

    it('returns "negative" for negative numbers', () => {
        expect(getValueClass(-100)).toBe('negative');
        expect(getValueClass(-0.01)).toBe('negative');
    });
});
