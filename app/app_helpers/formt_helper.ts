function formatCurrency(amount: number | null | undefined, currency = 'USD') {
    const val = Number(amount ?? 0)
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val)
}

function formatDuration(totalSeconds?: number) {
    const s = Math.max(0, Number(totalSeconds || 0))
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(Math.floor(s % 60)).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
}

export {
    formatCurrency,
    formatDuration,
}