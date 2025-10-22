import {defineStore} from 'pinia'
import {reactive, ref} from 'vue'
import {useToast} from "../.nuxt/imports";

export type Messanger = {
    id:number
    agentId:number
    date:string
    count:number
    price:number
    type:string
    isRecovery:boolean
    createdAt:string
    updatedAt:string
}

export type CreateMessangerPayload = {
    agentId: number
    type:string
    isRecovery:boolean
    count: number|null
    date:string
}

export type UpdateMessangerPayload = {
    id: number|null
    type:string
    isRecovery:boolean
    count: number|null
    date:string
}


export type MessangerResponse = {
    data: Messanger[]
    count: number
    meta: {
        agentId: number
        page: number
        take: number
        total: number
        totalPages: number
        hasPrev: boolean
        hasNext: boolean
        orderBy: 'id' | 'date' | 'count' | 'price' | 'type' | 'createdAt' | 'updatedAt'| 'isRecovery'
        sortOrder: 'asc' | 'desc'
    }
}

const q = {
    agentId: undefined as number | undefined,
    page: 1 as number,
    limit: 2 as number,
    sortBy: 'type' as string,
    count: undefined as number | undefined,
    price: undefined as number | undefined,
    type: undefined as string | undefined,
    isRecovery: undefined as boolean | undefined,
    sortOrder: 'asc' as 'asc' | 'desc',
    search: undefined as string | undefined,
    date__gte: undefined as string | undefined,
    date__lte: undefined as string | undefined,
}

export const useMessangerStore = defineStore('messanger', () => {
    // state
    const toast = useToast()
    const data = ref<Messanger[]>([])
    const count = ref<number>(0)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const params = reactive({...q})


    const resetParams = () => {
        return Object.assign(params, q)
    }

    async function create(payload: CreateMessangerPayload) {
        loading.value = true
        error.value = null
        try {
            await $fetch('/api/messanger', {method: 'POST', body: payload})
            await getAll()
            toast.add({
                title: `Мессенджеры тип ${payload.type} успешно выданы агенту ${payload.agentId} в колличестве ${payload.count} шт.`,
                color: 'success',
                icon: "ix:add-user-filled"
            })
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to create messanger'
            toast.add({
                title: `Не удалось выдать мессенджеры агенту ${payload.agentId}`,
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
            const res = await $fetch<MessangerResponse>('/api/messanger/', {query: params})
            data.value = res.data
            count.value = res.count
            // meta.value = res.meta
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get messanger'
        } finally {
            loading.value = false
        }
    }

    async function getById(id: number) {
        try {
            return await $fetch<Messanger>(`/api/messanger/${id}`)
        } catch (e: any) {
            console.error(e)
            error.value = e?.message ?? 'Failed to get messanger'
        }
    }

    async function update(id: number, payload: { type?: string; isRecovery?: boolean; price?: number; count?: number; date?: string }) {
        try {
            await $fetch(`/api/messanger/${id}`, {
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
                title: 'Не удалось обновить пользователя',
                color: 'error',
                icon: "ix:error-filled"
            })
        }
    }

    async function remove(id: any) {
        try {
            await $fetch(`/api/messanger/${id}`, {method: 'DELETE'})
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
