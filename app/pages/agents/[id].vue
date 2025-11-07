<script setup lang="ts">
// imports
import {computed, h, reactive,} from 'vue'
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import {storeToRefs} from "pinia";
import {format} from 'date-fns'
import {UBadge, UButton, UDropdownMenu} from "#components";
import {type CallStatus, useCallStore} from "~~/stores/call.store";
import type {TableColumn} from "#ui/components/Table.vue";
import {type CreateLivePayload, type Live, type UpdateLivePayload} from '~~/stores/live.store'
import {renderSortableHeader, type SortableField, toggleSort} from "~/app_helpers/sort-helper";
import {useLiveStore} from "~~/stores/live.store";
import {LiveValidator} from "~~/validators/live.validator";
import type {Agent, Calls} from "@prisma/client";
import {messangerValidator} from "~~/validators/messanger.validator";
import {type CreateMessangerPayload, type UpdateMessangerPayload, useMessangerStore} from "~~/stores/messanger.store";
import {useAgentStore} from "~~/stores/agent.store";

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

// reactive variables
const startDate = ref<string | undefined>(undefined)
const endDate = ref<string | undefined>(undefined)
const activeTab = ref<'calls' | 'live' | 'messengers'>('calls')
const showCreateLiveForm = ref<boolean>(false)
const showUpdateLiveForm = ref<boolean>(false)
const showCreateMessangerForm = ref<boolean>(false)
const showUpdateMessangerForm = ref<boolean>(false)

// hooks
const route = useRoute()
const router = useRouter()
const agentId = Number(route.params.id as string)
const agent = ref<Agent>({})

// stores
// -- agentStore
const {data: agents} = storeToRefs(useAgentStore())
const {getAll: getAgents, getById: getAgentById} = useAgentStore()

// -- call store
const {getAll: getCalls, remove: deleteCall} = useCallStore()
const {data: calls, count: callsCount, params: callsParams} = storeToRefs(useCallStore())

// -- live store
const {getAll: getLive, create: createLive, update: updateLive, remove: deleteLive} = useLiveStore()
const {data: live, count: liveCount, params: liveParams} = storeToRefs(useLiveStore())

// -- messanger store
const {
  getAll: getMessangers,
  create: createMessanger,
  update: updateMessanger,
  remove: deleteMessanger,
} = useMessangerStore()
const {data: messangers, count: messengersCount, params: messengersParams} = storeToRefs(useMessangerStore())

// reactive variables

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

// const page = ref(1)
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

// table actions
function callActions(row: any) {
  const callId = row.original?.id
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        try {
          await deleteCall(callId)
        } catch (e) {
          console.error(e)
        }
      }
    }
  ]]
}

function liveActions(row: any) {
  const liveId: number = row.original?.id
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        try {
          await deleteLive(liveId)
        } catch (e) {
          console.error(e)
        }
      }
    },
    {
      label: 'Редактировать',
      icon: 'ix:edit-document',
      onSelect: () => {
        try {
          liveUpdateForm.id = liveId
          liveUpdateForm.geo = row.original.geo
          liveUpdateForm.count = row.original.count
          liveUpdateForm.date = row.original.date
          showUpdateLiveForm.value = true
        } catch (e) {
          console.error(e)
        }
      }
    },
  ]]
}

function messangerActions(row: any) {
  const messangerId: number = row.original?.id
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        try {
          await deleteMessanger(messangerId)
        } catch (e) {
          console.error(e)
        }
      }
    },
    {
      label: 'Редактировать',
      icon: 'ix:edit-document',
      onSelect: () => {
        try {
          messangerUpdateForm.id = messangerId
          messangerUpdateForm.type = row.original.type
          messangerUpdateForm.count = row.original.count
          messangerUpdateForm.price = row.original.price
          messangerUpdateForm.date = row.original.date
          messangerUpdateForm.isRecovery = row.original.isRecovery
          showUpdateMessangerForm.value = true
        } catch (e) {
          console.error(e)
        }
      }
    },
  ]]
}

// tables
const callsColumns: TableColumn<Calls>[] = [
  {
    id: 'action',
    header: 'Действие',
    cell: ({row}) =>
        h(
            UDropdownMenu,
            {content: {align: 'end'}, items: callActions(row)},
            () => h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              variant: 'subtle',
              size: 'xl',
              class: 'cursor-pointer'
            })
        )
  },
  {
    accessorKey: 'date',
    header: renderSortableHeader('date', 'Дата', callsParams),

    cell: ({row}) => {

      return new Date(row.getValue('date')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'phone',
    header: 'Номер',

  },
  {
    accessorKey: 'duration',
    header: renderSortableHeader('duration', 'Длительность', callsParams),
    cell: ({row}) => {
      const sec = Number(row.getValue('duration') ?? 0)
      return new Date(sec * 1000).toISOString().slice(11, 19)
    }
  },
  {
    accessorKey: 'price',
    header: renderSortableHeader('price', 'Цена', callsParams),

    // cell: ({row}) => {
    //   const price = Number.parseFloat(row.getValue('price'))
    //
    //   const formatted = new Intl.NumberFormat('en-US', {
    //     style: 'currency',
    //     currency: 'EUR'
    //   }).format(price)
    //
    //   return h('div', {class: 'text-right font-medium'}, formatted)
    // }
  },
  {
    accessorKey: 'status',
    header: renderSortableHeader('status', 'Статус', callsParams),

    cell: ({row}) => {
      const color = <CallStatus>{
        'Вызов завершен': 'success' as const,
        'Занято': 'success' as const,
        'Временно недоступен': 'secondary' as const,
        'Сервис недоступен': 'secondary' as const,
        'Таймаут запроса': 'secondary' as const,
        'Отклонить': 'warning' as const,
        'Отменено': 'warning' as const,
        'Disconnected': 'error' as const,
        'Forbidden': 'error' as const,
        'Internal Server Error': 'error' as const,
        'No Rates Found for Account 23': 'error' as const,
        'Неверный набор или несуществующий номер': 'error' as const,
        'Temporarily unavailable': 'neutral' as const,
      }[row.getValue('status') as string]

      return h(UBadge, {class: 'capitalize', variant: 'subtle', color}, () => // todo дописать в конец color
          row.getValue('status')
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Изменен',
    cell: ({row}) => {
      return new Date(row.getValue('createdAt')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'updatedAt',
    header: 'Загружен',
    cell: ({row}) => {
      return new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
]
const liveColumns = [
  {id: 'id', header: 'ID', accessorKey: 'id'},
  {
    id: 'action',
    header: 'Действие',
    cell: ({row}) =>
        h(
            UDropdownMenu,
            {content: {align: 'end'}, items: liveActions(row)},
            () => h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              variant: 'subtle',
              size: 'xl',
              class: 'cursor-pointer'
            })
        )
  },
  {
    id: 'count',
    header: renderSortableHeader('count', 'Колличество', liveParams),
    accessorKey: 'count'
  },
  {
    accessorKey: 'date',
    header: renderSortableHeader('date', 'Дата', liveParams),

    cell: ({row}) => {
      return new Date(row.getValue('date')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    id: 'geo',
    header: renderSortableHeader('geo', 'Гео', liveParams),
    accessorKey: 'geo'
  },
  {
    accessorKey: 'updatedAt',
    header: renderSortableHeader('createdAt', 'Загружен', liveParams),
    cell: ({row}) => {
      return new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
]
const messangerColumns = [
  {id: 'id', header: 'ID', accessorKey: 'id'},
  {
    id: 'action',
    header: 'Действие',
    cell: ({row}) =>
        h(
            UDropdownMenu,
            {content: {align: 'end'}, items: messangerActions(row)},
            () => h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              variant: 'subtle',
              size: 'xl',
              class: 'cursor-pointer'
            })
        )
  },
  {id: 'count', header: renderSortableHeader('count', 'Колличество', messengersParams), accessorKey: 'count'},
  {
    accessorKey: 'date',
    header: renderSortableHeader('date', 'Дата', messengersParams),

    cell: ({row}) => {
      return new Date(row.getValue('date')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {id: 'type', header: renderSortableHeader('type', 'Тип', messengersParams), accessorKey: 'type'},
  {
    id: 'isRecovery', header: renderSortableHeader('isRecovery', 'Рекавери', messengersParams),
    accessorKey: 'isRecovery'
  },
  {
    id: 'price', header: renderSortableHeader('price', 'Цена', messengersParams),
    accessorKey: 'price'
  },
  {
    accessorKey: 'updatedAt',
    header: renderSortableHeader('createdAt', 'Загружен', messengersParams),
    cell: ({row}) => {
      return new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
]

// async functions
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

async function handleLiveCreate() {
  try {
    await createLive({...liveCreateForm})
    showCreateLiveForm.value = false
  } catch (e) {
    console.error('Create live failed:', e)
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

watch([startDate, endDate], ([s, e], [os, oe]) => {
  // реагируем на изменения дат
  callsParams.value.date__gte = s || undefined
  callsParams.value.date__lte = e || undefined

  messengersParams.value.date__gte = s
  messengersParams.value.date__lte = e

  liveParams.value.date__gte = s || undefined
  liveParams.value.date__lte = e || undefined
})

// lifecycle hooks
onMounted(async () => {
  callsParams.value.agentId = agentId
  messengersParams.value.agentId = agentId
  liveParams.value.agentId = agentId
  agent.value = await getAgentById(agentId)
  await getAgents()
  await getCalls()
  await getLive()
  await getMessangers()
})

const agentsOptions = computed(() =>
    (agents.value ?? []).map(a => ({
      label: a.stage,
      value: a.id
    })))

function onAgentChange(id: number) {
  if (agentId === undefined) return
  router.push(`/agents/${id}`)
  console.log('select')
}

</script>
<template>
  <UContainer class="flex flex-col gap-6">
    <!--  Agent Info Card-->
    <agent-info @change="onAgentChange" :agents-options="agentsOptions" :agent="agent"/>

    <UCard>
      <!--Data Container-->
      <div class="grid grid-cols-1 gap-6">

        <!--Date Card-->
        <div class="flex justify-between w-150">
          <div>
            <UFormField label="Начальная дата">
              <UInput
                  size="xl"
                  type="date" v-model="startDate"/>
            </UFormField>
          </div>
          <div class="flex">
            <UFormField label="Конечная дата">
              <UInput size="xl" type="date" v-model="endDate"/>
            </UFormField>
          </div>
        </div>

        <!--      Tabs Container  -->
        <UTabs v-model="activeTab" :items="tabs" class="w-full">

          <!--          Calls Template -->
          <template #calls>

            <!--         upload form card   -->
            <UCard class="rounded-2xl shadow-sm">
              <div class="flex gap-x-4 justify-end">
                <UFileUpload v-model="file" size="sm" variant="button"/>
                <UButton @click="uploadCalls">
                  Отправить выгрузку
                </UButton>
              </div>
            </UCard>

            <agent-calls-block
                v-model:page="callsParams.page"
                v-model:take="callsParams.take"
                v-model:search="callsParams.search"

                :columns="callsColumns"
                :items="calls"
                :count="callsCount"
            />
          </template>

          <!--          Live Template -->
          <template #live>
            <!--       liveForm card    -->
            <UCard class="rounded-2xl shadow-sm">
              <div class="flex justify-end">
                <UButton
                    :label="showCreateLiveForm ? 'Скрыть форму' : 'Добавить лайв'"
                    :icon="showCreateLiveForm ? 'i-lucide-minus' : 'i-lucide-plus'"
                    @click="showCreateLiveForm = !showCreateLiveForm"
                />
              </div>

              <UForm v-if="showCreateLiveForm"
                     :state="liveCreateForm"
                     @submit.prevent=handleLiveCreate
              >
                <div class="flex justify-start gap-4">
                  <UFormField label="Дата" name="date">
                    <UInput v-model="liveCreateForm.date" type="date"/>
                  </UFormField>

                  <UFormField label="Колл-во" name="count">
                    <UInput v-model.number="liveCreateForm.count"
                            type="number"
                            min="0"/>
                  </UFormField>

                  <UFormField label="Гео" name="geo">
                    <USelect
                        v-model="liveCreateForm.geo"
                        :items="liveGeo"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Выбери гео"
                    />
                  </UFormField>
                  <UButton type="submit"
                           variant="ghost"
                           size="lg"
                           class="rounded-xl px-6">
                    Сохранить
                  </UButton>
                </div>

              </UForm>
              <UForm v-if="showUpdateLiveForm"
                     :shema="LiveValidator"
                     :state="liveUpdateForm"
                     @submit="handleLiveUpdate"
              >
                <div class="flex justify-start gap-4">
                  <UFormField label="Дата" name="date">
                    <UInput v-model="liveUpdateForm.date" type="date"/>
                  </UFormField>

                  <UFormField label="Колл-во" name="count">
                    <UInput v-model.number="liveUpdateForm.count"
                            type="number"
                            min="0"/>
                  </UFormField>

                  <UFormField label="Гео" name="geo">
                    <USelect
                        v-model="liveUpdateForm.geo"
                        :items="liveGeo"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Выбери гео"
                    />
                  </UFormField>

                  <UButton type="submit"
                           variant="ghost"
                           size="lg"
                           class="rounded-xl px-6">
                    Сохранить
                  </UButton>
                  <UButton type="button"
                           variant="ghost"
                           size="lg"
                           @click="showUpdateLiveForm = false"
                           color="error"
                           class="rounded-xl px-6">
                    Отмена
                  </UButton>
                </div>
              </UForm>
            </UCard>
            <agent-live-block
                v-model:page="liveParams.page"
                v-model:take="liveParams.limit"

                :columns="liveColumns"
                :count="liveCount"
                :items="live"
                @penis-sosal="getCalls"
            />
          </template>

          <!--          Messangers Template -->
          <template #messanger>

            <!--       messangers card    -->
            <UCard class="rounded-2xl shadow-sm">
              <div class="flex justify-end">
                <UButton
                    :label="showCreateMessangerForm ? 'Скрыть форму' : 'Добавить мессенджер'"
                    :icon="showCreateMessangerForm ? 'i-lucide-minus' : 'i-lucide-plus'"
                    @click="showCreateMessangerForm = !showCreateMessangerForm"
                />
              </div>

              <UForm v-if="showCreateMessangerForm"
                     :state="messangerCreateForm"
                     @submit.prevent=handleMessangerCreate
              >
                <div class="flex justify-start gap-4">
                  <UFormField label="Дата" name="date">
                    <UInput v-model="messangerCreateForm.date" type="date"/>
                  </UFormField>

                  <UFormField label="Колл-во" name="count">
                    <UInput v-model.number="messangerCreateForm.count"
                            type="number"
                            min="0"/>
                  </UFormField>

                  <UFormField label="Тип" name="type">
                    <USelect
                        v-model="messangerCreateForm.type"
                        :items="messangerTypes"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Выбери тип"
                    />
                  </UFormField>
                  <UFormField label="Рекавери" name="isRecovery">
                    <USelect
                        v-model="messangerCreateForm.isRecovery"
                        :items="isRecovery"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Рекавери"
                    />
                  </UFormField>
                  <UButton type="submit"
                           variant="ghost"
                           size="lg"
                           class="rounded-xl px-6">
                    Сохранить
                  </UButton>
                </div>

              </UForm>
              <UForm v-if="showUpdateMessangerForm"
                     :shema="messangerValidator"
                     :state="messangerUpdateForm"
                     @submit="handleMessangerUpdate"
              >
                <div class="flex justify-start gap-4">
                  <UFormField label="Дата" name="date">
                    <UInput v-model="messangerUpdateForm.date" type="date"/>
                  </UFormField>

                  <UFormField label="Колл-во" name="count">
                    <UInput v-model.number="messangerUpdateForm.count"
                            type="number"
                            min="0"/>
                  </UFormField>

                  <UFormField label="Тип" name="geo">
                    <USelect
                        v-model="messangerUpdateForm.type"
                        :items="messangerTypes"
                        option-attribute="label"
                        value-attribute="value"
                        placeholder="Выбери тип"
                    />
                  </UFormField>

                  <UButton type="submit"
                           variant="ghost"
                           size="lg"
                           class="rounded-xl px-6">
                    Сохранить
                  </UButton>
                  <UButton type="button"
                           variant="ghost"
                           size="lg"
                           @click="showUpdateMessangerForm = false"
                           color="error"
                           class="rounded-xl px-6">
                    Отмена
                  </UButton>
                </div>
              </UForm>
            </UCard>
            <agent-messengers-block

                v-model:page="messengersParams.page"
                v-model:take="messengersParams.limit"

                :columns="messangerColumns"
                :count="messengersCount"
                :items="messangers"
            />

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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity .22s ease, transform .22s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>