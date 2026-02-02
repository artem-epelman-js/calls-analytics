// stores/agent.store.ts
import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

export type Agent = {
    id: number
    stage: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type Analytics = {
    calls: any[]
}

export type AnalyticsResponse = {
    data: Analytics
    callsCount: number
}

export type AgentsResponse = {
    data: Agent[]
    count: number
    meta: {
        page: number
        take: number
        total: number
        totalPages: number
        hasPrev: boolean
        hasNext: boolean
        orderBy: 'id' | 'stage' | 'isActive' | 'createdAt' | 'updatedAt'
        sortOrder: 'asc' | 'desc'
    }
}


export type CreateAgentPayload = {
    stage: string
    isActive: boolean
}

const q = {
    agentId: undefined as number | undefined,
    page: 1 as number,
    take: 10 as number,
    orderBy: 'stage' as string,
    sortOrder: 'asc' as 'asc' | 'desc',
    search: undefined as string | undefined,
    isActive: undefined as boolean | undefined,
    date__gte: undefined as string | undefined,
    date__lte: undefined as string | undefined,
}


const toast = useToast()
const selectedStage = ref<number | null>(null)


export const useAgentStore = defineStore('agents', () => {
    // state
    const data = ref<Agent[]>([])
    const count = ref<number>(0)
    const callsCount = ref(0)

    const analytics = ref<Analytics | null>(null)
    const meta = ref<AgentsResponse['meta'] | null>(null)
    const loading = ref(false)
    const agentId = ref<number | null>(null)
    const error = ref<string | null>(null)
    const params = reactive({...q})


    const resetParams = () => {
        return Object.assign(params, q)
    }

    async function getAll() {
        loading.value = true
        error.value = null
        try {
            const res = await $fetch<AgentsResponse>('/api/agents', {query: params})
            data.value = res.data
            count.value = res.count
            meta.value = res.meta
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get agents'
        } finally {
            loading.value = false
        }
    }

    async function getAnalytics(agentId: number) {
        loading.value = true
        error.value = null
        try {
            return await $fetch<AnalyticsResponse>(`/api/agents/${agentId}/analytics`, {query: params})
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get analytics'
        } finally {
            loading.value = false
        }
    }
    async function getById(id: number) {
        try {
            const res = await $fetch<Agent>(`/api/agents/${id}`)
            return res
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get agent'
        }
    }

    async function update(selectedId: number) {
        try {
            agentId.value = selectedId
            const agent = data.value.find(s => s.id === selectedId)
            if (!agent) return

            const newStatus = !agent.isActive
            await $fetch(`/api/agents/${selectedId}`, {
                method: 'PATCH',
                body: {isActive: newStatus}
            });

            agent.isActive = newStatus
            toast.add({
                title: 'Пользователь обновлен!',
                color: 'secondary',
                icon: "ix:replace"
            })
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to create agent'
            toast.add({
                title: 'Не удалось обновить пользователя',
                color: 'error',
                icon: "ix:error-filled"
            })
        } finally {
            agentId.value = null
        }
    }

    async function create(payload: CreateAgentPayload) {
        loading.value = true
        error.value = null
        try {
            await $fetch('/api/agents', {method: 'POST', body: payload})
            await getAll()
            toast.add({
                title: 'Пользователь успешно создан',
                color: 'success',
                icon: "ix:add-user-filled"
            })
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to create agent'
            toast.add({
                title: 'Не удалось создать пользователя',
                color: 'error',
                icon: "ix:error-filled"
            })
        } finally {
            loading.value = false
        }
    }

    const agentsList = computed(() => (data.value ?? []).map(s => ({
        label: s.stage,
        value: s.id,
        class: s.isActive ? 'text-green-700' : 'text-red-700',
    })))

    const selectedAgent = computed(() => data.value.find(s => s.id === (selectedStage.value ?? -1)) ?? null)

    return {
        // state
        data, agentsList, analytics, selectedAgent, count, meta, loading, error, params,
        // actions
        getAll, getById, create, update, resetParams,
    }
})
