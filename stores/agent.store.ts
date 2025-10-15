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

const toast = useToast()

export const useAgentStore = defineStore('agents', () => {
    // state
    const data = ref<Agent[]>([])
    const count = ref<number>(0)
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

    // опционально: переключение статуса

    return {
        // state
        data, count, meta, loading, error, params,
        // actions
        getAll, getById, create, update, resetParams,
    }
})
