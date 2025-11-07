// stores/agent.store.ts
import {defineStore} from 'pinia'
import {reactive, ref} from 'vue'
import type {Calls} from "@prisma/client";

export type CallsResponse = {
    data: Calls[]
    count: number
    meta: {
        page: number
        take: number
        total: number
        totalPages: number
        hasPrev: boolean
        hasNext: boolean
        orderBy: 'id' | 'date' | 'phone' | 'duration' | 'price' | 'status' | 'createdAt' | 'updatedAt'
        sortOrder: 'asc' | 'desc'
    }
}

export type CallStatus =
    | 'Вызов завершен'
    | 'Занято'
    | 'Временно недоступен'
    | 'Неверный набор или несуществующий номер'
    | 'Отклонить'
    | 'Отменено'
    | 'Сервис недоступен'
    | 'Таймаут запроса'
    | 'Disconnected'
    | 'Forbidden'
    | 'Internal Server Error'
    | 'No Rates Found for Account 23'
    | 'Temporarily unavailable';

const q = {
    page: 1 as number,
    limit: 10 as number,
    sortBy: 'duration' as string,
    duration: undefined as number | undefined,
    price: undefined as number | undefined,
    agentId: undefined as number | undefined,
    sortOrder: 'asc' as 'asc' | 'desc',
    search: undefined as string | undefined,
    date__gte: undefined as string | undefined,
    date__lte: undefined as string | undefined,
}

export const useCallStore = defineStore('calls', () => {
    // state
    // const toast = useToast()
    const data = ref<Calls[]>([])
    const count = ref<number>(0)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const params = reactive({...q})


    const resetParams = () => {
        return Object.assign(params, q)
    }

    async function create() {
        await useFetch(`/api/calls/`, {
            // params: {startDate: state.startDate, endDate: state.endDate}
        })
        await getAll()
    }

    async function createMany() {

    }

    async function getAll() {
        loading.value = true
        error.value = null
        try {
            const res = await $fetch<CallsResponse>('/api/calls/', {query: params})
            data.value = res.data
            count.value = res.count
            // meta.value = res.meta
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get calls'
        } finally {
            loading.value = false
        }
    }

    async function getById(id: number) {
        try {
            return await $fetch<Calls>(`/api/calls/${id}`)
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get call'
        }
    }

    async function remove(id: any) {
        try {
            await $fetch(`/api/calls/${id}`, {method: 'DELETE'})
            await getAll()
        } catch (e) {
            console.error(e)
        }
    }



// опционально: переключение статуса

return {
    // state
    data, count, loading, error, params,
    // actions
    getAll, getById, create, remove, resetParams,
}
})
