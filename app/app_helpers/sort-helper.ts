// helpers/sort.ts
export type SortableField = 'date' | 'price' | 'duration'
export type SortOrder = 'asc' | 'desc'

export function toggleSort<K extends SortableField>(
    params: { sortBy?: K; sortOrder?: SortOrder },
    field: K
) {
    if (params.sortBy === field) {
        params.sortOrder = params.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
        params.sortBy = field
        // оставляем текущий порядок, либо раскомментируй, если всегда с asc
        // params.sortOrder = 'asc'
    }
    // НЕ трогаем params.page
}