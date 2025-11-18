import type {TableColumn} from "#ui/components/Table.vue";
import type {Calls} from "@prisma/client";
import {h} from "vue";
import {UBadge, UButton, UDropdownMenu} from "#components";
import {renderSortableHeader} from "~/app_helpers/sort-helper";
import {type CallStatus, useCallStore} from "~~/stores/call.store";
import {useLiveStore} from "~~/stores/live.store";
import {useMessangerStore} from "~~/stores/messanger.store";
import {useRowActions} from "~/services/tableActions";

export function useTabsColumns() {
    const {callActions, liveActions, messangerActions} = useRowActions()
    const {callsParams} = useCallStore()
    const {liveParams} = useLiveStore()
    const {messengersParams} = useMessangerStore()

    const callsColumns: TableColumn<Calls>[] = [
        {
            id: 'action',
            header: 'Действие',
            cell: ({row}) =>
                h(
                    UDropdownMenu,
                    {content: {align: 'end'}, items: callActions(row)},
                    () => h(UButton, {
                        icon: 'i-lucide-ellipsis-vertical',
                        variant: 'subtle',
                        size: 'xl',
                        class: 'cursor-pointer'
                    })
                )
        },
        {
            accessorKey: 'date',
            header: renderSortableHeader('date', 'Дата', callsParams),

            cell: ({row}) => {

                return new Date(row.getValue('date')).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }
        },
        {
            accessorKey: 'phone',
            header: 'Номер',

        },
        {
            accessorKey: 'duration',
            header: renderSortableHeader('duration', 'Длительность', callsParams),
            cell: ({row}) => {
                const sec = Number(row.getValue('duration') ?? 0)
                return new Date(sec * 1000).toISOString().slice(11, 19)
            }
        },
        {
            accessorKey: 'status',
            header: renderSortableHeader('status', 'Статус', callsParams),

            cell: ({row}) => {
                const color = <CallStatus>{
                    'Вызов завершен': 'success' as const,
                    'Занято': 'success' as const,
                    'Временно недоступен': 'secondary' as const,
                    'Сервис недоступен': 'secondary' as const,
                    'Таймаут запроса': 'secondary' as const,
                    'Отклонить': 'warning' as const,
                    'Отменено': 'warning' as const,
                    'Disconnected': 'error' as const,
                    'Forbidden': 'error' as const,
                    'Internal Server Error': 'error' as const,
                    'No Rates Found for Account 23': 'error' as const,
                    'Неверный набор или несуществующий номер': 'error' as const,
                    'Temporarily unavailable': 'neutral' as const,
                }[row.getValue('status') as string]

                return h(UBadge, {class: 'capitalize', variant: 'subtle', color}, () => // todo дописать в конец color
                    row.getValue('status')
                )
            }
        },
        {
            accessorKey: 'createdAt',
            header: 'Изменен',
            cell: ({row}) => {
                return new Date(row.getValue('createdAt')).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }
        },
        {
            accessorKey: 'updatedAt',
            header: 'Загружен',
            cell: ({row}) => {
                return new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }
        },
    ]
    const liveColumns = [
        {id: 'id', header: 'ID', accessorKey: 'id'},
        {
            id: 'action',
            header: 'Действие',
            cell: ({row}) =>
                h(
                    UDropdownMenu,
                    {content: {align: 'end'}, items: liveActions(row)},
                    () => h(UButton, {
                        icon: 'i-lucide-ellipsis-vertical',
                        variant: 'subtle',
                        size: 'xl',
                        class: 'cursor-pointer'
                    })
                )
        },
        {
            id: 'count',
            header: renderSortableHeader('count', 'Колличество', liveParams),
            accessorKey: 'count'
        },
        {
            accessorKey: 'date',
            header: renderSortableHeader('date', 'Дата', liveParams),

            cell: ({row}) => {
                return new Date(row.getValue('date')).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }
        },
        {
            id: 'geo',
            header: renderSortableHeader('geo', 'Гео', liveParams),
            accessorKey: 'geo'
        },
        {
            accessorKey: 'updatedAt',
            header: renderSortableHeader('createdAt', 'Загружен', liveParams),
            cell: ({row}) => {
                return new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }
        },
    ]
    const messangerColumns = [
        {id: 'id', header: 'ID', accessorKey: 'id'},
        {
            id: 'action',
            header: 'Действие',
            cell: ({row}) =>
                h(
                    UDropdownMenu,
                    {content: {align: 'end'}, items: messangerActions(row)},
                    () => h(UButton, {
                        icon: 'i-lucide-ellipsis-vertical',
                        variant: 'subtle',
                        size: 'xl',
                        class: 'cursor-pointer'
                    })
                )
        },
        {id: 'count', header: renderSortableHeader('count', 'Колличество', messengersParams), accessorKey: 'count'},
        {
            accessorKey: 'date',
            header: renderSortableHeader('date', 'Дата', messengersParams),

            cell: ({row}) => {
                return new Date(row.getValue('date')).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }
        },
        {id: 'type', header: renderSortableHeader('type', 'Тип', messengersParams), accessorKey: 'type'},
        {
            id: 'isRecovery', header: renderSortableHeader('isRecovery', 'Рекавери', messengersParams),
            accessorKey: 'isRecovery'
        },
        {
            id: 'price', header: renderSortableHeader('price', 'Цена', messengersParams),
            accessorKey: 'price'
        },
        {
            accessorKey: 'updatedAt',
            header: renderSortableHeader('createdAt', 'Загружен', messengersParams),
            cell: ({row}) => {
                return new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }
        },
    ]

    return {
        callsColumns,
        liveColumns,
        messangerColumns
    }
}
