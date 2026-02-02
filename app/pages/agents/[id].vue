<script setup lang="ts">
// imports
import {computed} from 'vue'
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import {storeToRefs} from "pinia";
import {useCallStore} from "~~/stores/call.store";
import type {Agent} from "@prisma/client";
import {useAgentStore} from "~~/stores/agent.store";
import AnalyticsTemplates from "~/components/agent/templates/analyticsTemplates.vue";
import DataTemplates from "~/components/agent/templates/dataTemplates.vue";

// configs
definePageMeta({
  pageTransition: {
    name: 'slide-right',
    mode: 'out-in',
  },
  middleware(to, from) {
    if (to.meta.pageTransition && typeof to.meta.pageTransition !== 'boolean') {
      const a = Number(to.params.id)
      const b = Number(from.params?.id)
      to.meta.pageTransition.name = Number.isFinite(a) && Number.isFinite(b) && a > b ? 'slide-left' : 'slide-right'
    }
  }
})

// hooks
const route = useRoute()
const router = useRouter()
const agentId = Number(route.params.id as string)

// reactive variables
const startDate = ref<string | undefined>(undefined)
const endDate = ref<string | undefined>(undefined)

const agent = ref<Agent>()
const analyticsData = ref<any | null>(null)


// stores
// -- agentStore
const agentsStore = useAgentStore()
const {data: agents, params} = storeToRefs(agentsStore)
const {getAll: getAgents, getAnalytics, getById: getAgentById} = agentsStore

// -- call store
const callsStore = useCallStore()
const {getAll: getCalls} = callsStore
const {params: callsParams} = storeToRefs(callsStore)



// base const

// base funcs
function onAgentChange(id: number) {
  if (agentId === undefined) return
  router.push(`/agents/${id}`)
  console.log('select')
}



//computed funcs
const agentsOptions = computed(() => (agents.value ?? []).map(a => ({
      label: a.stage,
      value: a.id
    })))

// watchers
watch(callsParams, () => {
  getCalls()
}, {deep: true})


// watch(params, async () => {
//   analyticsData.value = await getAnalytics(agentId)
// }, {deep: true, immediate: true})

watch([startDate, endDate], ([s, e], [os, oe]) => {
  // реагируем на изменения дат
  callsParams.value.date__gte = s || undefined
  callsParams.value.date__lte = e || undefined

  params.value.date__gte = s || undefined
  params.value.date__lte = e || undefined


})

// lifecycle hooks
onMounted(async () => {
  callsParams.value.agentId = agentId


  analyticsData.value = await getAnalytics(agentId)
  agent.value = await getAgentById(agentId)
  await getAgents()
  await getCalls()
})



</script>
<template>
  <UContainer class="flex flex-col gap-6">
    <!--  Agent Info Card-->
    <div class="flex gap-x-4 justify-between">
      <agent-info
          @change="onAgentChange"
          :agents-options="agentsOptions"
          :agent="agent"/>
      <analytics-templates/>
    </div>

    <UCard>
      <!--Data Container-->
      <div class="grid grid-cols-1 gap-6">
        <!--Date Card-->
        <div class="flex justify-between w-150">
          <div>
            <UFormField label="Начальная дата">
              <UInput
                  size="xl"
                  type="date"
                  v-model="startDate"/>
            </UFormField>
          </div>
          <div class="flex">
            <UFormField label="Конечная дата">
              <UInput size="xl"
                      type="date"handleMessangerUpdate
                      v-model="endDate"/>
            </UFormField>
          </div>
        </div>

        <!--      Tabs Container  -->
       <data-templates/>
      </div>
    </UCard>
  </UContainer>
</template>