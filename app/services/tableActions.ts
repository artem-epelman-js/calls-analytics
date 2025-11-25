// composables/useRowActions.ts
import {useCallStore} from '~~/stores/call.store'
import {useLiveStore} from '~~/stores/live.store'
import {useMessangerStore} from '~~/stores/messanger.store'

// ⬇️ добавь export
export type UseRowActionsOptions = {
    onLiveEdit?: (row: any) => void
    onMessangerEdit?: (row: any) => void
}

export function useRowActions(options: UseRowActionsOptions = {}) {
    const { remove: deleteCall } = useCallStore()
    const { remove: deleteLive } = useLiveStore()
    const { remove: deleteMessanger } = useMessangerStore()



    function callActions(row: any) {
        const callId = row.original?.id
        return [[
            {
                label: 'Удалить',
                icon: 'i-heroicons-trash-20-solid',
                onSelect: async () => {
                    try {
                        await deleteCall(callId)
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
        ]]
    }

    function liveActions(row: any) {
        const liveId: number = row.original?.id
        return [[
            {
                label: 'Удалить',
                icon: 'i-heroicons-trash-20-solid',
                onSelect: async () => {
                    try {
                        await deleteLive(liveId)
                    } catch (e) {
                        console.error(e)
                    }
                }
            },
            {
                label: 'Редактировать',
                icon: 'ix:edit-document',
                onSelect: () => {
                    options.onLiveEdit?.(row)
                    console.log(options.onLiveEdit)
                }
            },
        ]]
    }

    function messangerActions(row: any) {
        const messangerId: number = row.original?.id
        return [[
            {
                label: 'Удалить',
                icon: 'i-heroicons-trash-20-solid',
                onSelect: async () => {
                    try {
                        await deleteMessanger(messangerId)
                    } catch (e) {
                        console.error(e)
                    }
                }
            },
            {
                label: 'Редактировать',
                icon: 'ix:edit-document',
                onSelect: () => {
                    options.onMessangerEdit?.(row)
                    console.log(options.onMessangerEdit)
                }
            },
        ]]
    }

    return {
        callActions,
        liveActions,
        messangerActions,
    }
}
