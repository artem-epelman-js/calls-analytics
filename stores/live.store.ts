// stores/agent.store.ts
import {defineStore} from 'pinia'
import {reactive, ref} from 'vue'
import type {CreateAgentPayload} from "./agent.store";

export type Live = {
    id:number
    agentId:number
    date:string
    count:number
    price:number
    geo:string
    createdAt:string
    updatedAt:string
}

export type CreateLivePayload = {
    agentId: number
    geo: string
    count: number|null
    date:string
}

export type UpdateLivePayload = {
    id: number|null
    geo: string
    count: number|null
    date:string
}


export type LiveResponse = {
    data: Live[]
    count: number
    meta: {
        agentId: number
        page: number
        take: number
        total: number
        totalPages: number
        hasPrev: boolean
        hasNext: boolean
        orderBy: 'id' | 'date' | 'count' | 'price' | 'geo' | 'createdAt' | 'updatedAt'
        sortOrder: 'asc' | 'desc'
    }
}

const q = {
    agentId: undefined as number | undefined,
    page: 1 as number,
    limit: 2 as number,
    sortBy: 'geo' as string,
    count: undefined as number | undefined,
    price: undefined as number | undefined,
    geo: undefined as string | undefined,
    sortOrder: 'asc' as 'asc' | 'desc',
    search: undefined as string | undefined,
    date__gte: undefined as string | undefined,
    date__lte: undefined as string | undefined,
}

export const useLiveStore = defineStore('live', () => {
    // state
    const toast = useToast()
    const data = ref<Live[]>([])
    const count = ref<number>(0)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const params = reactive({...q})


    const resetParams = () => {
        return Object.assign(params, q)
    }

    async function create(payload: CreateLivePayload) {
        loading.value = true
        error.value = null
        try {
            await $fetch('/api/live', {method: 'POST', body: payload})
            await getAll()
            toast.add({
                title: `Лиды по гео ${payload.geo} успешно выданы агенту ${payload.agentId} в колличестве ${payload.count} шт.`,
                color: 'success',
                icon: "ix:add-user-filled"
            })
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to create live'
            toast.add({
                title: `Не удалось выдать лидов агенту ${payload.agentId}`,
                color: 'error',
                icon: "ix:error-filled"
            })
        } finally {
            loading.value = false
        }
    }

    async function getAll() {
        loading.value = true
        error.value = null
        try {
            const res = await $fetch<LiveResponse>('/api/live/', {query: params})
            data.value = res.data
            count.value = res.count
            // meta.value = res.meta
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get live'
        } finally {
            loading.value = false
        }
    }

    async function getById(id: number) {
        try {
            return await $fetch<Live>(`/api/live/${id}`)
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get live'
        }
    }

    async function update(id: number, payload: { geo?: string; count?: number; date?: string }) {
        try {

            await $fetch(`/api/live/${id}`, {
                method: 'PATCH',
                body:payload,
            });
            await getAll()
            toast.add({
                title: `Запись №${id} обновлена!`,
                color: 'secondary',
                icon: "ix:replace"
            })
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to create agent'
            toast.add({
                title: 'Не удалось обновить запись',
                color: 'error',
                icon: "ix:error-filled"
            })
        }
    }

    async function remove(id: any) {
        try {
            await $fetch(`/api/live/${id}`, {method: 'DELETE'})
            toast.add({
                title: `Запись №${id} удалена!`,
                color: 'secondary',
                icon: "ix:replace"
            })
            await getAll()
        } catch (e) {
            toast.add({
                title: `Не удалось удалить запись №${id}!`,
                color: 'error',
                icon: "ix:replace"
            })
            console.error(e)
        }
    }



// опционально: переключение статуса

    return {
        // state
        data, count, loading, error, params,
        // actions
        getAll, getById, create, update, remove, resetParams,
    }
})
