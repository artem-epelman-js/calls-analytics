
import {useCallStore} from '~~/stores/call.store'


export function useRowActions(options = {}) {
    const { remove: deleteCall } = useCallStore()
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

    return {
        callActions,
    }
}
