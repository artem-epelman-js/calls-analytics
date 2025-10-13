const toArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean)
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean)
    return []
}
const toCSV = (arr: string[]) => (arr.length ? arr.join(',') : undefined)

export {
    toArray,
    toCSV,
}