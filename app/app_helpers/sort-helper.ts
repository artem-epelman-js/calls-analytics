// helpers/sort.ts
import {h} from "vue";
import {UButton} from "#components";

export type SortableField = 'date' | 'price' | 'duration'|'status'
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

export function renderSortableHeader(field: SortableField, label: string, params?: any) {
    return () =>
        h(
            UButton,
            {
                variant: 'ghost',
                size: 'xs',
                class: 'px-2',
                onClick: (e: MouseEvent) => {
                    e.stopPropagation()
                    toggleSort(params?.value as any, field)
                }
            },
            () =>
                `${label} ${
                    params?.value?.sortBy === field && params?.value.sortOrder === 'asc' ? '↑' : '↓'
                }`
        )
}