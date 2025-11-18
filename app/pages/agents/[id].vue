<script setup lang="ts">
// imports
import {computed, h, reactive,} from 'vue'
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import {storeToRefs} from "pinia";
import {useCallStore} from "~~/stores/call.store";
import {type CreateLivePayload, type UpdateLivePayload} from '~~/stores/live.store'
import {useLiveStore} from "~~/stores/live.store";
import type {Agent} from "@prisma/client";
import {type CreateMessangerPayload, type UpdateMessangerPayload, useMessangerStore} from "~~/stores/messanger.store";
import {useAgentStore} from "~~/stores/agent.store";
import {useTabsColumns} from "~/services/tableColumns";
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
const {callsColumns, liveColumns, messangerColumns} = useTabsColumns()

// reactive variables
const startDate = ref<string | undefined>(undefined)
const endDate = ref<string | undefined>(undefined)
const activeTab = ref<'calls' | 'live' | 'messengers'>('calls')
const activeAnalyticsTab = ref<'callsAnalytics' | 'liveAnalytics' | 'messangersAnalytics'>('callsAnalytics')
const showCreateLiveForm = ref<boolean>(false)
const showUpdateLiveForm = ref<boolean>(false)
const showCreateMessangerForm = ref<boolean>(false)
const agent = ref<Agent>({})
const showUpdateMessangerForm = ref<boolean>(false)
const analyticsData = ref<any | null>(null)
const file = ref<File | null>(null)
const liveCreateForm = reactive<CreateLivePayload>({
  agentId: agentId,
  geo: '',
  count: null,
  date: '',
})
const liveUpdateForm = reactive<UpdateLivePayload>({
  id: null,
  geo: '',
  count: null,
  date: '',
})
const messangerCreateForm = reactive<CreateMessangerPayload>({
  agentId: agentId,
  type: '',
  count: null,
  date: '',
  price: null,
  isRecovery: false,

})
const messangerUpdateForm = reactive<UpdateMessangerPayload>({
  id: null,
  type: '',
  count: null,
  date: '',
  price: null,
  isRecovery: false,
})


// stores
// -- agentStore
const agentsStore = useAgentStore()
const {data: agents, analytics, params} = storeToRefs(agentsStore)
const {getAll: getAgents, getAnalytics, getById: getAgentById} = agentsStore

// -- call store
const callsStore = useCallStore()
const {getAll: getCalls, remove: deleteCall} = callsStore
const {data: calls, count: callsCount, params: callsParams} = storeToRefs(callsStore)

// -- live store
const liveStore = useLiveStore()
const {getAll: getLive, create: createLive, update: updateLive, remove: deleteLive} = liveStore
const {data: live, count: liveCount, params: liveParams} = storeToRefs(liveStore)

// -- messanger store
const messangerStore = useMessangerStore()

const {
  getAll: getMessangers,
  create: createMessanger,
  update: updateMessanger,
} = messangerStore
const {data: messangers, count: messengersCount, params: messengersParams} = storeToRefs(messangerStore)

// base const
const tabs = [
  {
    label: 'Звонки',
    icon: 'solar:phone-bold',
    slot: 'calls',
    value: 'calls'
  },
  {
    label: 'Лайв',
    icon: 'solar:user-rounded-bold',
    slot: 'live',
    value: 'live'
  },
  {
    label: 'Мессенджеры',
    icon: 'solar:wheel-angle-bold',
    slot: 'messanger',
    value: 'messanger'

  },
]
const analyticsTabs = [
  {
    label: 'Звонки',
    icon: 'solar:phone-bold',
    slot: 'callsAnalytics',
    value: 'callsAnalytics'
  },
  {
    label: 'Лайв',
    icon: 'solar:phone-bold',
    slot: 'liveAnalytics',
    value: 'liveAnalytics'
  },
  {
    label: 'Мессенджеры',
    icon: 'solar:phone-bold',
    slot: 'messangersAnalytics',
    value: 'messangersAnalytics'
  },
]
const liveGeo = [
  {
    label: 'KZ',
    value: 'KZ',
  },
  {
    label: 'KG',
    value: 'KG',
  },
  {
    label: 'BY',
    value: 'BY',
  },
  {
    label: 'UZ',
    value: 'UZ',
  },

]
const messangerTypes = [
  {
    label: 'WHATSAPP',
    value: 'WHATSAPP',
  },
  {
    label: 'TELEGRAM',
    value: 'TELEGRAM',
  },
]
const isRecovery = [
  {
    label: 'true',
    value: true,
  },
  {
    label: 'false',
    value: false,
  },
]


// base funcs
function onAgentChange(id: number) {
  if (agentId === undefined) return
  router.push(`/agents/${id}`)
  console.log('select')
}

// async funcs
async function uploadCalls() {
  if (!file.value) {
    alert('Пожалуйста, выберите файл.')
    return
  }

  const formitems = new FormData()
  formitems.append('file', file.value)
  formitems.append('agentId', Number(agentId))

  try {
    const resp = await fetch('/api/calls/', {method: 'POST', body: formitems})
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data?.statusMessage || 'Ошибка при загрузке файла.')
    alert('Файл успешно загружен!')
    await getCalls()
    file.value = null
  } catch (e: any) {
    console.error(e)
    alert(e.message || 'Upload error')
  } finally {
  }
}
async function handleMessangerCreate() {
  try {
    console.log(messangerCreateForm)
    await createMessanger(messangerCreateForm)
    showCreateMessangerForm.value = false
  } catch (e) {
    console.error('Create messanger failed:', e)
  }
}
async function handleLiveUpdate() {
  if (!liveUpdateForm.id) return // на всякий случай
  await updateLive(liveUpdateForm.id, {
    count: liveUpdateForm.count ?? undefined,
    geo: liveUpdateForm.geo ?? undefined,
    date: liveUpdateForm.date || undefined,
  })
  showUpdateLiveForm.value = false
}
async function handleMessangerUpdate() {
  if (!messangerUpdateForm.id) return // на всякий случай
  await updateMessanger(messangerUpdateForm.id, {
    type: messangerUpdateForm.type || undefined,
    price: messangerUpdateForm.price || undefined,
    isRecovery: messangerUpdateForm.isRecovery || undefined,
    count: messangerUpdateForm.count ?? undefined,
    date: messangerUpdateForm.date || undefined,
  })
  showUpdateLiveForm.value = false
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

watch(messengersParams, () => {
  getMessangers()
}, {deep: true})

watch(liveParams, () => {
  getLive()
}, {deep: true, immediate: true})

watch(params, async () => {
  analyticsData.value = await getAnalytics(agentId)
}, {deep: true, immediate: true})

watch([startDate, endDate], ([s, e], [os, oe]) => {
  // реагируем на изменения дат
  callsParams.value.date__gte = s || undefined
  callsParams.value.date__lte = e || undefined

  messengersParams.value.date__gte = s
  messengersParams.value.date__lte = e

  liveParams.value.date__gte = s || undefined
  liveParams.value.date__lte = e || undefined

  params.value.date__gte = s || undefined
  params.value.date__lte = e || undefined


})

// lifecycle hooks
onMounted(async () => {
  callsParams.value.agentId = agentId
  messengersParams.value.agentId = agentId
  liveParams.value.agentId = agentId

  analyticsData.value = await getAnalytics(agentId)
  agent.value = await getAgentById(agentId)
  await getAgents()
  await getCalls()
  await getLive()
  await getMessangers()

  console.log('analytics value = ', analytics.value)
})

onUnmounted(() => {
  agentsStore.resetParams()
  liveStore.resetParams()
  callsStore.resetParams()
  messangerStore.resetParams()
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
                      type="date"
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