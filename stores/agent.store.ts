// stores/agent.store.ts
import {defineStore} from 'pinia'
import {ref} from 'vue'

export type Agent = {
    id: number
    stage: string
    isActive: boolean
    createdAt: string
    updatedAt: string
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

export type AgentResponse = {
    data: Agent[]
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
    page: 1 as number,
    take: 10 as number,
    orderBy: 'stage' as string,
    sortOrder: 'asc' as 'asc' | 'desc',
    search: undefined as string | undefined,
    isActive: undefined as boolean | undefined,
}

export const useAgentStore = defineStore('agents', () => {
    // state
    const data = ref<Agent[]>([])
    const count = ref<number>(0)
    const meta = ref<AgentsResponse['meta'] | null>(null)
    const loading = ref(false)
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



    async function create(payload: CreateAgentPayload) {
        loading.value = true
        error.value = null
        try {
            await $fetch('/api/agents', {method: 'POST', body: payload})
            await getAll()
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to create agent'
        } finally {
            loading.value = false
        }
    }

    // опционально: переключение статуса
    async function toggleActive(id: number) {
        loading.value = true
        error.value = null
        try {
            await $fetch(`/api/agents/${id}/toggle`, {method: 'PATCH'})
            await getAll()
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to toggle agent'
        } finally {
            loading.value = false
        }
    }

    return {
        // state
        data, count, meta, loading, error, params,
        // actions
        getAll, create, toggleActive, resetParams,
    }
})
