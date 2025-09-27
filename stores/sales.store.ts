import {defineStore} from 'pinia';
import {useNuxtApp, useRoute} from "nuxt/app";
import {useFetch} from "nuxt/app";
import {number} from "zod";

let route = useRoute()
const agentId = route.params.id as string

export type Sale = {
    id: number,
    stage: string,
    isActive: boolean,
    createdAt: string,
    updatedAt: string,
}


export const useSalesStore = defineStore('sales', () => {
    //state
    const items = ref<Sale[]>([])
    const total = ref(0)
    const page = ref(1)
    const pageSize = ref(20)
    const q = ref('')


    //getters
    const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))


    // actions
    const fetch = async () => {
        const {$api} = useNuxtApp()
        const res = await $api<{
            items: Sale[]
            total: number
            pages: number
            pageSize: number

        }>('/sales', {
            query: {q: q.value, page: page.value, pageSize: pageSize.value},
        })
        items.value = res.value
        total.value = res.total
        page.value = res.page
        pageSize.value = res.pageSize
    }
    const create = async (payload: Sale) => {
        const {$api} = useNuxtApp()
        await $api('/api/sales', {method: 'POST', body: payload})
        await fetch()
    }
    return {
        //state
        items,
        total,
        page,
        pageSize,
        q,
        // getters
        pages,
        //actions
        fetch,
        create,
    }
})

