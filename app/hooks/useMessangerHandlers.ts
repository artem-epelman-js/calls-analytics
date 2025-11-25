import {reactive, ref} from "vue";
import {type CreateMessangerPayload, type UpdateMessangerPayload, useMessangerStore} from "~~/stores/messanger.store";
import {useRowActions} from "~/services/tableActions";


export function useMessangerHandlers() {
    const route = useRoute()
    const {update, create} = useMessangerStore()

    const agentId = Number(route.params.id as string)


    const showCreateMessangerFormData = ref<boolean>(false)
    const showUpdateMessangerFormData = ref<boolean>(false)


    const messangerCreateFormData = reactive<CreateMessangerPayload>({
        agentId: agentId,
        type: '',
        count: null,
        date: '',
        price: null,
        isRecovery: false,

    })

    const messangerUpdateFormData = reactive<UpdateMessangerPayload>({
        id: null,
        type: '',
        count: null,
        date: '',
        price: null,
        isRecovery: false,
    })

    async function handleMessangerCreate() {
        try {
            console.log(messangerCreateFormData)
            await create(messangerCreateFormData)
            showCreateMessangerFormData.value = false
        } catch (e) {
            console.error('Create messanger failed:', e)
        }
    }

    async function handleMessangerUpdate() {
        if (!messangerUpdateFormData.id) return
        await update(messangerUpdateFormData.id, {
            type: messangerUpdateFormData.type || undefined,
            price: messangerUpdateFormData.price || undefined,
            isRecovery: messangerUpdateFormData.isRecovery || undefined,
            count: messangerUpdateFormData.count ?? undefined,
            date: messangerUpdateFormData.date || undefined,
        })
        showUpdateMessangerFormData.value = false
    }
    return {
        messangerCreateFormData,
        messangerUpdateFormData,
        handleMessangerUpdate,
        handleMessangerCreate,

        showCreateMessangerFormData,
        showUpdateMessangerFormData,
    }
}