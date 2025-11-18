// composables/useRowActions.ts
import {reactive, ref} from 'vue'
import {useCallStore} from '~~/stores/call.store'
import {useLiveStore, type UpdateLivePayload} from '~~/stores/live.store'
import {useMessangerStore, type UpdateMessangerPayload} from '~~/stores/messanger.store'

export function useRowActions() {
    const {remove: deleteCall} = useCallStore()
    const {remove: deleteLive} = useLiveStore()
    const {remove: deleteMessanger} = useMessangerStore()

    const messangerUpdateForm = reactive<UpdateMessangerPayload>({
        id: null,
        type: '',
        count: null,
        date: '',
        price: null,
        isRecovery: false,
    })

    const liveUpdateForm = reactive<UpdateLivePayload>({
        id: null,
        geo: '',
        count: null,
        date: '',
    })

    const showUpdateLiveForm = ref(false)
    const showUpdateMessangerForm = ref(false)

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
                    try {
                        liveUpdateForm.id = liveId
                        liveUpdateForm.geo = row.original.geo
                        liveUpdateForm.count = row.original.count
                        liveUpdateForm.date = row.original.date
                        showUpdateLiveForm.value = true
                    } catch (e) {
                        console.error(e)
                    }
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
                    try {
                        messangerUpdateForm.id = messangerId
                        messangerUpdateForm.type = row.original.type
                        messangerUpdateForm.count = row.original.count
                        messangerUpdateForm.price = row.original.price
                        messangerUpdateForm.date = row.original.date
                        messangerUpdateForm.isRecovery = row.original.isRecovery
                        showUpdateMessangerForm.value = true
                    } catch (e) {
                        console.error(e)
                    }
                }
            },
        ]]
    }

    return {
        callActions,
        liveActions,
        messangerActions,
        messangerUpdateForm,
        liveUpdateForm,
        showUpdateLiveForm,
        showUpdateMessangerForm,
    }
}
