let route = useRoute();
const agentId = route.params.id as string

const salesService = {

    getAllSales: async () => {
        await useFetch('/api/sales')
    },
    getSaleById: async () => {
        await useFetch(`/api/sales/${agentId}`)
    },
    createSale: async (payload:{stage:string; isActive: boolean|undefined}) => {
        await $fetch('/api/sales', { method: 'POST', body: payload })
    },
}

export default salesService