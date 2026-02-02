// composables/useTabsColumns.ts
import type {Calls} from "@prisma/client"
import {h} from "vue"
import {UBadge, UButton, UDropdownMenu} from "#components"
import {renderSortableHeader} from "~/app_helpers/sort-helper"
import {type CallStatus, useCallStore} from "~~/stores/call.store"

export function useTabsColumns({
                                   callActions,

                               }: {
    callActions: any,
}) {

    const {callsParams} = useCallStore()

    // --- CALLS ---
    const callsColumns: TableColumn<Calls>[] = [
        {
            id: "action",
            header: "Действие",
            cell: ({row}) =>
                h(
                    UDropdownMenu,
                    {content: {align: "end"}, items: callActions(row)},
                    () =>
                        h(UButton, {
                            icon: "i-lucide-ellipsis-vertical",
                            variant: "subtle",
                            size: "xl",
                            class: "cursor-pointer"
                        })
                )
        },
        {
            accessorKey: "date",
            header: renderSortableHeader("date", "Дата", callsParams),
            cell: ({row}) =>
                new Date(row.getValue("date")).toLocaleString("en-US", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                })
        },
        {
            accessorKey: "phone",
            header: "Номер"
        },
        {
            accessorKey: "duration",
            header: renderSortableHeader("duration", "Длительность", callsParams),
            cell: ({row}) => {
                const sec = Number(row.getValue("duration") ?? 0)
                return new Date(sec * 1000).toISOString().slice(11, 19)
            }
        },
        {
            accessorKey: "status",
            header: renderSortableHeader("status", "Статус", callsParams),
            cell: ({row}) => {
                const color = <CallStatus>{
                    "Вызов завершен": "success",
                    "Занято": "success",
                    "Временно недоступен": "secondary",
                    "Сервис недоступен": "secondary",
                    "Таймаут запроса": "secondary",
                    "Отклонить": "warning",
                    "Отменено": "warning",
                    "Disconnected": "error",
                    "Forbidden": "error",
                    "Internal Server Error": "error",
                    "No Rates Found for Account 23": "error",
                    "Неверный набор или несуществующий номер": "error",
                    "Temporarily unavailable": "neutral"
                }[row.getValue("status") as string]

                return h(
                    UBadge,
                    {class: "capitalize", variant: "subtle", color},
                    () => row.getValue("status")
                )
            }
        },
        {
            accessorKey: "createdAt",
            header: "Изменен",
            cell: ({row}) =>
                new Date(row.getValue("createdAt")).toLocaleString("en-US", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                })
        },
        {
            accessorKey: "updatedAt",
            header: "Загружен",
            cell: ({row}) =>
                new Date(row.getValue("updatedAt")).toLocaleString("en-US", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                })
        }
    ]

    return {
        callsColumns,
    }
}
