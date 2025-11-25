import { reactive, ref } from "vue";
import { useRoute } from 'vue-router'
import { type CreateLivePayload, type UpdateLivePayload, useLiveStore } from "~~/stores/live.store";

export function useLiveHandlers() {
    const route = useRoute();
    const {create, update } = useLiveStore();

    const agentId = Number(route.params.id);

    const showCreateLiveFormData = ref(false);
    const showUpdateLiveFormData = ref(false);

    const liveCreateFormData = reactive<CreateLivePayload>({
        agentId,
        geo: '',
        count: null,
        date: '',
    });

    const liveUpdateFormData = reactive<UpdateLivePayload>({
        id: null,
        geo: '',
        count: null,
        date: '',
    });

    async function handleLiveCreate() {
        try {
            await create({ ...liveCreateFormData });
        } catch (e) {
            console.error('Create live failed:', e);
        }
    }

    async function handleLiveUpdate() {
        if (!liveUpdateFormData.id) return

        await update(liveUpdateFormData.id, {
            count: liveUpdateFormData.count ?? undefined,
            geo: liveUpdateFormData.geo ?? undefined,
            date: liveUpdateFormData.date || undefined,
        })
    }

    return {
        liveCreateFormData,
        liveUpdateFormData,
        handleLiveCreate,
        handleLiveUpdate,
        showCreateLiveFormData,
        showUpdateLiveFormData,
    };
}
