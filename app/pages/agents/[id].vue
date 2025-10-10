<script setup lang="ts">

import {formatCurrency} from "~/app_helpers/formt_helper";

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

import {ref, reactive, computed, onMounted, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {format, formatDuration} from 'date-fns'
import {useFetch} from '#app'
import {callValidator} from '~~/validators/call.validator'

const route = useRoute()
const router = useRouter()
const agentId = Number(route.params.id as string)

const calls = ref<any | null>(null)
const live = ref<any[]>([])
const messanger = ref<any[]>([])
const agents = ref<any[]>([])
const agent = ref<any | null>(null)

const page = ref(1)
const file = ref<File | null>(null)
const isLoading = ref(false)
const selectedStage = ref<number | null>(null)

const totalLeaveByAgentId = ref<{ totalLeads: number; totalPriceLead: number } | null>(null)
const totalMessangerByAgentId = ref<{ totalMessanger: number; totalPriceMessanger: number } | null>(null)

const tabs = [
  {
    label: 'Звонки',
    icon: 'i-lucide-user',
    slot: 'calls'
  },
  {
    label: 'Лайв',
    icon: 'i-lucide-lock',
    slot: 'live'
  },
  {
    label: 'Мессенджеры',
    icon: 'i-lucide-lock',
    slot: 'messangers'
  },
  {
    label: 'Аналитика',
    icon: 'i-lucide-lock',
    slot: 'analytics'
  }
]

const state = reactive({
  skip: 0,
  take: 20,
  orderBy: 'id',
  sortOrder: 'desc',
  status: undefined as string | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
})

async function getLive() {

  live.value = await $fetch(`/api/live/${agentId}`, {
    params: {
      page: page.value,
      take: state.take,
      orderBy: state.orderBy,
      sortOrder: state.sortOrder,
      status: state.status,
      startDate: state.startDate,
      endDate: state.endDate
    }
  })
}

async function getMessanger() {

  messanger.value = await $fetch(`/api/messanger/${agentId}`, {
    params: {
      page: page.value,
      take: state.take,
      orderBy: state.orderBy,
      sortOrder: state.sortOrder,
      status: state.status,
      startDate: state.startDate,
      endDate: state.endDate
    }
  })}

async function getTotalLeaveByAgentId() {
  const res = await $fetch(`/api/live/${agentId}`)
  totalLeaveByAgentId.value = {totalLeads: res.totalLeads ?? 0, totalPriceLead: res.totalPriceLead ?? 0}
}

async function getTotalMessangerByAgentId() {
  const res = await $fetch(`/api/messanger/${agentId}`)
  totalMessangerByAgentId.value = {
    totalMessanger: res.totalMessanger ?? 0,
    totalPriceMessanger: res.totalPriceMessanger ?? 0
  }
}

async function getAgents() {
  agents.value = await $fetch('/api/agents')
}

async function getAgentById() {
  agent.value = await $fetch(`/api/agents/${agentId}`)
  selectedStage.value = agent.value?.id ? Number(agent.value.id) : null
}

async function getCalls() {
  calls.value = await $fetch(`/api/calls/${agentId}`, {
    params: {
      page: page.value,
      take: state.take,
      orderBy: state.orderBy,
      sortOrder: state.sortOrder,
      status: state.status,
      startDate: state.startDate,
      endDate: state.endDate
    }
  })
}

async function saveCalls() {
  await useFetch(`/api/calls/${agentId}`, {
    params: {startDate: state.startDate, endDate: state.endDate}
  })
  await getCalls()
}

async function upload() {
  if (!file.value) {
    alert('Пожалуйста, выберите файл.')
    return
  }
  isLoading.value = true
  const formitems = new FormData()
  formitems.append('file', file.value)
  formitems.append('agentId', String(agentId))

  try {
    const resp = await fetch('/api/upload', {method: 'POST', body: formitems})
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data?.statusMessage || 'Ошибка при загрузке файла.')
    alert('Файл успешно загружен!')
    await getCalls()
    file.value = null
  } catch (e: any) {
    console.error(e)
    alert(e.message || 'Upload error')
  } finally {
    isLoading.value = false
  }
}

const agentsOptions = computed(() => {
  console.log(agents.value)
  return (agents.value?.data ?? []).map((a: any) => ({
    label: a.stage,  // что показываем
    value: Number(a.id) // что кладем в v-model
  }))
})

const expensesByLive = computed(() => formatCurrency(totalLeaveByAgentId.value?.totalPriceLead))

const expensesByMessanger = computed(() => formatCurrency(totalMessangerByAgentId.value?.totalPriceMessanger))

const expensesByVoip = computed(() => {
  if (!calls.value) return
  return new Intl.NumberFormat('ru-RU', {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((calls?.value?.callAgregation?._sum?.duration / 60) * 0.25)
})

const totalExpenses = computed(() => {
  const msg = Number(totalMessangerByAgentId.value?.totalPriceMessanger || 0)
  const live = Number(totalLeaveByAgentId.value?.totalPriceLead || 0)
  return formatCurrency(msg + live + (calls?.value?.callAgregation?._sum?.duration / 60) * 0.25)
})

const totalDuration = computed(() => formatDuration(calls.value?.callAgregation?._sum?.duration))

watch([page, () => state.take, () => state.status, () => state.startDate, () => state.endDate], () => {
  getCalls()
})

watch(selectedStage, (val) => {
  if (val == null) return
  const id = Number(val)
  router.push({path: `/agents/${id}`})
  getCalls(id)
  getLive(id)
  getMessanger(id)
})

onMounted(async () => {
  await Promise.all([
    getCalls(),
    getLive(),
    getAgents(),
    getAgentById(),
    getMessanger(),
    getTotalLeaveByAgentId(),
    getTotalMessangerByAgentId()
  ])
})
</script>

<template>
  <UContainer class="flex flex-col gap-6">
    <UCard>
      <div class="flex items-center justify-between gap-4 border-b pb-4">
        <div class="flex items-center gap-2">
          <USelect
              class="w-50"
              v-model="selectedStage"
              :items="agentsOptions"
              size="xl"
              placeholder="Выбери агента"
              :loading="!agents?.data?.length"
          />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6 pt-4">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Номер</p>
          <p class="mt-2 text-base font-medium">{{ agent?.id }}</p>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</p>
          <div class="flex items-center gap-2 mt-2">
            <UBadge :color="agent?.isActive ? 'primary' : 'error'" variant="subtle">
              {{ agent?.isActive ? 'Активен' : 'Неактивен' }}
            </UBadge>
          </div>
        </div>

        <div v-if="agent?.createdAt">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Добавлен</p>
          <p class="mt-2 text-base font-medium">
            {{ format(new Date(agent?.createdAt || ''), 'dd.MM.yy') }}
          </p>
        </div>
      </div>
    </UCard>


    <UCard>
      <div class="grid grid-cols-1 justify-between gap-6">

        <UForm
            @submit.prevent="saveCalls"
            :schema="callValidator"
            :state="state"
            class="flex justify-start flex-row flex-1"
        >
          <div class="flex-1">
            <UFormField label="Начальная дата">
              <USeparator class="py-5 w-40"/>
              <UInput size="xl" type="date" v-model="state.startDate"/>
            </UFormField>
          </div>
          <div class="flex-1">
            <UFormField label="Конечная дата">
              <USeparator class="py-5 w-40"/>
              <UInput size="xl" type="date" v-model="state.endDate"/>
            </UFormField>
          </div>
        </UForm>

        <UTabs :items="tabs" class="w-full">


          <template #calls>

            <UCard class="mt-10">
              <UTable :data="calls?.call"/>


            </UCard>

          </template>

          <template #live>
            <UCard class="mt-10">
              <UTable :data="live?.live"/>

            </UCard>
          </template>

          <template #messangers>
            <UCard class="mt-10">
              <UTable :data="messanger?.messanger"/>
            </UCard>
          </template>


          <template #analytics>
            <UCard>
              <div class="grid grid-cols-2 gap-4">
                <div class="grid grid-cols-3">
                  <div class="grid grid-cols-2 w-200">
                    <div class="items-center grid grid-cols-2 w-80">
                      <p>Кол-во лайва:</p>
                      <p>{{ totalLeaveByAgentId?.totalLeads ?? 0 }}</p>
                      <p>Кол-во вц:</p>
                      <p>{{ totalMessangerByAgentId?.totalMessanger ?? 0 }}</p>
                      <p>Кол-во звонков:</p>
                      <p>{{ calls?.callAgregation?._count ?? 0 }}</p>
                      <p>Сек в звонках:</p>
                      <p>{{ calls?.callAgregation?._sum?.duration ?? 0 }}</p>
                      <p>Время на линии:</p>
                      <p>{{ totalDuration }}</p>
                    </div>
                    <div class="items-center grid grid-cols-2 w-80">
                      <p>Расход по лайву:</p>
                      <p>{{ expensesByLive }}</p>
                      <p>Расход по вц:</p>
                      <p>{{ expensesByMessanger }}</p>
                      <p>Расход по тел-и:</p>
                      <p>{{ expensesByVoip }}</p>
                      <p>Общий расход:</p>
                      <p>{{ totalExpenses }}</p>
                    </div>
                    <div class="mt-20 grid grid-cols-3 w-80">
                    </div>

                  </div>

                </div>

                <div class="flex flex-col justify-end">
                  <UFileUpload v-model="file" label="Загрузить файл" class="w-100 self-end"/>
                  <UButton @click="upload" :loading="isLoading" :disabled="!file" class="w-30 self-end mt-4">
                    Отправить выгрузку
                  </UButton>
                </div>
              </div>
            </UCard>
          </template>
        </UTabs>


      </div>
    </UCard>


  </UContainer>
</template>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.2s;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translate(50px, 0);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translate(-50px, 0);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translate(-50px, 0);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translate(50px, 0);
}
</style>
