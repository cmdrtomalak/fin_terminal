export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toString();
}

export function formatMarketCap(cap: number): string {
    if (cap >= 1_000_000_000_000) return '$' + (cap / 1_000_000_000_000).toFixed(2) + 'T';
    if (cap >= 1_000_000_000) return '$' + (cap / 1_000_000_000).toFixed(2) + 'B';
    return '$' + (cap / 1_000_000).toFixed(2) + 'M';
}

export function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
}

export function formatStatementValue(val: number | null): string {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1_000_000_000) return sign + '$' + (absVal / 1_000_000_000).toFixed(1) + 'B';
    if (absVal >= 1_000_000) return sign + '$' + (absVal / 1_000_000).toFixed(1) + 'M';
    if (absVal >= 1_000) return sign + '$' + (absVal / 1_000).toFixed(1) + 'K';
    return sign + '$' + absVal.toFixed(0);
}

export function formatRatioValue(
    val: number | null,
    type: 'number' | 'percent' | 'currency' | 'ratio' = 'number'
): string {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    switch (type) {
        case 'percent':
            return (val * 100).toFixed(2) + '%';
        case 'currency':
            return formatMarketCap(val);
        case 'ratio':
            return val.toFixed(2);
        default:
            return formatNumber(val);
    }
}

export function getValueClass(val: number | null): string {
    if (val === null || val === undefined) return '';
    return val >= 0 ? 'positive' : 'negative';
}
