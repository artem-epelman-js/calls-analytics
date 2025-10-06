let route = useRoute();
const agentId = route.params.id as string

const agentsService = {

    getAllAgents: async () => {
        await useFetch('/api/agents')
    },
    getAgentById: async () => {
        await useFetch(`/api/agents/${agentId}`)
    },
    createAgent: async (payload:{stage:string; isActive: boolean|undefined}) => {
        await $fetch('/api/agents', { method: 'POST', body: payload })
    },
}

export default agentsService