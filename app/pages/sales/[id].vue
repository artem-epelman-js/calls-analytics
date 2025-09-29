<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { useFetch } from '#app'
import { callValidator } from '~~/validators/call.validator'

const route = useRoute()
const router = useRouter()
const agentId = Number(route.params.id as string)

const calls = ref<any|null>(null)
const live = ref<any[]>([])
const messanger = ref<any[]>([])
const sales = ref<any[]>([])
const sale = ref<any|null>(null)

const page = ref(1)
const file = ref<File | null>(null)
const isLoading = ref(false)
const selectedStage = ref<number | null>(null)

const totalLeaveByAgentId = ref<{ totalLeads:number; totalPriceLead:number } | null>(null)
const totalMessangerByAgentId = ref<{ totalMessanger:number; totalPriceMessanger:number } | null>(null)

const state = reactive({
  skip: 0,
  take: 20,
  orderBy: 'id',
  sortOrder: 'desc',
  status: undefined as string | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
})

function formatCurrency(amount: number | null | undefined, currency = 'USD') {
  const val = Number(amount ?? 0)
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val)
}

function formatDuration(totalSeconds?: number) {
  const s = Math.max(0, Number(totalSeconds || 0))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

async function getLive(id?: number | string) {
  const currentId = Number(id ?? selectedStage.value ?? agentId)
  live.value = await $fetch('/api/live', { params: { agentId: currentId, skip: state.skip, take: state.take } })
}

async function getMessanger(id?: number | string) {
  const currentId = Number(id ?? selectedStage.value ?? agentId)
  messanger.value = await $fetch('/api/messanger', { params: { agentId: currentId } })
}

async function getTotalLeaveByAgentId() {
  const res = await $fetch(`/api/live/${agentId}`)
  totalLeaveByAgentId.value = { totalLeads: res.totalLeads ?? 0, totalPriceLead: res.totalPriceLead ?? 0 }
}

async function getTotalMessangerByAgentId() {
  const res = await $fetch(`/api/messanger/${agentId}`)
  totalMessangerByAgentId.value = {
    totalMessanger: res.totalMessanger ?? 0,
    totalPriceMessanger: res.totalPriceMessanger ?? 0
  }
}

async function getSales() {
  sales.value = await $fetch('/api/sales')
}

async function getAgentByAgentId() {
  sale.value = await $fetch(`/api/sales/${agentId}`)
  selectedStage.value = sale.value?.id ?? null
}

async function getCalls(id?: number | string) {
  const currentId = Number(id ?? selectedStage.value ?? agentId)
  calls.value = await $fetch(`/api/calls/${currentId}`, {
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

async function sendDate() {
  await useFetch(`/api/calls/${agentId}`, {
    params: { startDate: state.startDate, endDate: state.endDate }
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
    const resp = await fetch('/api/upload', { method: 'POST', body: formitems })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data?.statusMessage || 'Ошибка при загрузке файла.')
    alert('Файл успешно загружен!')
    await getCalls()
    file.value = null
  } catch (e:any) {
    console.error(e)
    alert(e.message || 'Upload error')
  } finally {
    isLoading.value = false
  }
}

const stageOptions = computed(() =>
    (sales.value || []).map((s:any) => ({ label: s.stage, value: s.id })))

const expensesByLive = computed(() =>
    formatCurrency(totalLeaveByAgentId.value?.totalPriceLead)
)

const expensesByMessanger = computed(() =>
    formatCurrency(totalMessangerByAgentId.value?.totalPriceMessanger)
)

const expensesByVoip = computed(() => {
  if (!calls.value) return
  return new Intl.NumberFormat('ru-RU', {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((calls?.value?.callAgregation?._sum?.duration  / 60) * 0.25)
})

const totalExpenses = computed(() => {
  const msg = Number(totalMessangerByAgentId.value?.totalPriceMessanger || 0)
  const live = Number(totalLeaveByAgentId.value?.totalPriceLead || 0)
  return formatCurrency(msg + live + (calls?.value?.callAgregation?._sum?.duration  / 60) * 0.25)
})

const totalDuration = computed(() =>
    formatDuration(calls.value?.callAgregation?._sum?.duration)
)

watch(
    [page, () => state.take, () => state.status, () => state.startDate, () => state.endDate], () => { getCalls() })

watch(selectedStage, (val) => {
  if (!val) return
  router.push({ path: `/sales/${val}` })
  getCalls(val)
  getLive(val)
  getMessanger(val)
})

onMounted(async () => {
  await Promise.all([
    getCalls(),
    getLive(),
    getSales(),
    getAgentByAgentId(),
    getMessanger(),
    getTotalLeaveByAgentId(),
    getTotalMessangerByAgentId()
  ])
})
</script>

<template>
  <UContainer class="flex flex-col gap-6">
    <div class="mb-6 rounded-2xl p-6 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white">
      <h2 class="text-2xl font-semibold">Форма выгрузки звонков в базу</h2>
    </div>

    <UCard>
      <div class="flex items-center justify-between gap-4 border-b pb-4">
        <div class="flex items-center gap-2">
          <USelect
              class="w-50"
              v-model="selectedStage"
              :items="stageOptions"
              size="xl"
              placeholder="Выбери агента"
          />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6 pt-4">
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Номер</p>
          <p class="mt-2 text-base font-medium">{{ sale?.id }}</p>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</p>
          <div class="flex items-center gap-2 mt-2">
            <UBadge :color="sale?.isActive ? 'primary' : 'error'" variant="subtle">
              {{ sale?.isActive ? 'Активен' : 'Неактивен' }}
            </UBadge>
          </div>
        </div>

        <div v-if="sale?.createdAt">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Добавлен</p>
          <p class="mt-2 text-base font-medium">
            {{ format(new Date(sale?.createdAt || ''), 'dd.MM.yy') }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="grid grid-cols-2 gap-4">
        <div class="grid grid-cols-3">
          <div class="grid grid-cols-2 w-200">
            <div class="items-center grid grid-cols-2 w-80">
              <p>Кол-во лайва:</p><p>{{ totalLeaveByAgentId?.totalLeads ?? 0 }}</p>
              <p>Кол-во вц:</p><p>{{ totalMessangerByAgentId?.totalMessanger ?? 0 }}</p>
              <p>Кол-во звонков:</p><p>{{ calls?.callAgregation?._count ?? 0 }}</p>
              <p>Сек в звонках:</p><p>{{ calls?.callAgregation?._sum?.duration ?? 0 }}</p>
              <p>Время на линии:</p><p>{{ totalDuration }}</p>
            </div>
            <div class="items-center grid grid-cols-2 w-80">
              <p>Расход по лайву:</p><p>{{ expensesByLive }}</p>
              <p>Расход по вц:</p><p>{{ expensesByMessanger }}</p>
              <p>Расход по тел-и:</p><p>{{ expensesByVoip }}</p>
              <p>Общий расход:</p><p>{{ totalExpenses }}</p>
            </div>
          </div>

        </div>

        <div class="flex flex-col justify-end">
          <UFileUpload v-model="file" label="Загрузить файл" class="w-100 self-end" />
          <UButton @click="upload" :loading="isLoading" :disabled="!file" class="w-30 self-end mt-4">
            Отправить выгрузку
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <UForm
            @submit.prevent="sendDate"
            :schema="callValidator"
            :state="state"
            class="flex flex-col lg:flex-row gap-4 flex-1"
        >
          <div class="flex-1">
            <UFormField label="Начальная дата">
              <USeparator class="py-5 w-40" />
              <UInput size="xl" type="date" v-model="state.startDate" />
            </UFormField>
          </div>
          <div class="flex-1">
            <UFormField label="Конечная дата">
              <USeparator class="py-5 w-40" />
              <UInput size="xl" type="date" v-model="state.endDate" />
            </UFormField>
          </div>
        </UForm>

        <div class="w-40">
          <USelect v-model.number="state.take" :items="[10,20,30,40,50,100]" size="xl">
            Показать {{ state.take }} записей
          </USelect>
        </div>
      </div>
    </UCard>

    <UCard>
      <UTable :data="calls?.call" />
      <div v-if="(calls?.callAgregation?._count || 0) > state.take" class="mt-6 flex justify-center">
        <UPagination
            v-model:page="page"
            :total="calls?.callAgregation?._count || 0"
            :items-per-page="state.take"
        />
      </div>
    </UCard>
  </UContainer>
</template>
