<script setup lang="ts">

// imports
import {computed, h, reactive,} from 'vue'
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import {storeToRefs} from "pinia";
import {format} from 'date-fns'
import {UBadge, UButton, UDropdownMenu} from "#components";
import {useCallStore} from "~~/stores/call.store";
import type {TableColumn} from "#ui/components/Table.vue";
import {type CreateLivePayload, type Live, type UpdateLivePayload} from '~~/stores/live.store'
import {type SortableField, toggleSort} from "~/app_helpers/sort-helper";
import {useLiveStore} from "~~/stores/live.store";
import {useAgentStore} from "~~/stores/agent.store";
import {LiveValidator} from "~~/validators/live.validator";
import type {Messanger} from "@prisma/client";
import {messangerValidator} from "~~/validators/messanger.validator";
import {type CreateMessangerPayload, type UpdateMessangerPayload, useMessangerStore} from "~~/stores/messanger.store";


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

// types
type CallStatus =
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

// reactive variables
const startDate = ref<string | undefined>(undefined)
const endDate = ref<string | undefined>(undefined)
const activeTab = ref<'calls' | 'live' | 'messengers' | 'analytics'>('calls')
const selectedStage = ref<number | null>(null)
const showCreateLiveForm = ref<boolean>(false)
const showUpdateLiveForm = ref<boolean>(false)
const showCreateMessangerForm = ref<boolean>(false)
const showUpdateMessangerForm = ref<boolean>(false)

// hooks
const route = useRoute()
const agentId = Number(route.params.id as string)
const selectedAgent = computed(() => data.value.find(s => s.id === (selectedStage.value ?? -1)) ?? null)


watch([startDate, endDate], ([s, e], [os, oe]) => {
  // реагируем на изменения дат
  if (activeTab.value === 'calls') {
    callsParams.value.date__gte = s || undefined
    callsParams.value.date__lte = e || undefined
  }
})

// base functions
function renderSortableHeader(field: SortableField, label: string) {
  return () =>
      h(
          UButton,
          {
            variant: 'ghost',
            size: 'xs',
            class: 'px-2',
            onClick: (e: MouseEvent) => {
              e.stopPropagation()
              toggleSort(callsParams.value as any, field)
            }
          },
          () =>
              `${label} ${
                  callsParams.value.sortBy === field && callsParams.value.sortOrder === 'asc' ? '↑' : '↓'
              }`
      )
}

// stores
// -- agentStore
const {data: agents, agentsList} = storeToRefs(useAgentStore())
const {getAll: getAgents} = useAgentStore()


// -- call store
const {getAll: getCalls, remove: deleteCall} = useCallStore()
const {data, count: callsCount, params: callsParams} = storeToRefs(useCallStore())

// -- live store
const {getAll: getLive, create: createLive, update: updateLive, remove: deleteLive} = useLiveStore()
const {data: live, count: liveCount, params: liveParams} = storeToRefs(useLiveStore())

// -- messanger store
const {getAll: getMessangers, create: createMessanger, update: updateMessanger, remove: deleteMessanger} = useMessangerStore()
const {data: messengers, count: messengersCount, params: messengersParams} = storeToRefs(useMessangerStore())


// reactive variables
const agent = ref<any | null>(null)

// base const
const tabs = [
  {
    label: 'Звонки',
    icon: 'i-lucide-user',
    slot: 'calls',
    value: 'calls'
  },
  {
    label: 'Лайв',
    icon: 'i-lucide-lock',
    slot: 'live',
    value: 'live'
  },
  {
    label: 'Мессенджеры',
    icon: 'i-lucide-lock',
    slot: 'messanger',
    value: 'messanger'

  },
  {
    label: 'Аналитика',
    icon: 'i-lucide-lock',
    slot: 'analytics',
    value: 'analytics'

  }
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

// const page = ref(1)
const file = ref<File | null>(null)
const liveCreateForm = reactive<CreateLivePayload>({
  agentId: agentId,
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
const liveUpdateForm = reactive<UpdateLivePayload>({
  id: null,
  geo: '',
  count: null,
  date: '',
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
  const liveId:number = row.original?.id
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
  const messangerId:number = row.original?.id
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
const callsColumns: TableColumn<Messanger>[] = [
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
  {
    accessorKey: 'date',
    header: renderSortableHeader('date', 'Дата'),

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
    header: renderSortableHeader('duration', 'Длительность'),
    cell: ({row}) => {
      const sec = Number(row.getValue('duration') ?? 0)
      return new Date(sec * 1000).toISOString().slice(11, 19)
    }
  },
  {
    accessorKey: 'price',
    header: renderSortableHeader('price', 'Цена'),

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
    header: renderSortableHeader('status', 'Статус'),

    cell: ({row}) => {
      const color = {
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
  {id: 'count', header: 'Колл-во', accessorKey: 'count'},
  {
    id: 'date',
    header: 'Дата выдачи',
    accessorFn: (row) => row?.date,
    cell: ({row}) => format(new Date(row.original.date), 'dd-MM'),
  },
  {id: 'geo', header: 'Гео', accessorKey: 'geo'},
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
  {id: 'count', header: 'Колл-во', accessorKey: 'count'},
  {
    id: 'date',
    header: 'Дата выдачи',
    accessorFn: (row) => row?.date,
    cell: ({row}) => format(new Date(row.original.date), 'dd-MM'),
  },
  {id: 'type', header: 'Тип', accessorKey: 'type'},
  {id: 'isRecovery', header: 'Рекавери', accessorKey: 'isRecovery'},
  {id: 'price', header: 'Цена', accessorKey: 'price'},
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
    console.error('Create agent failed:', e)
  }
}
async function handleMessangerCreate() {
  try {
    await createMessanger({...messangerCreateForm})
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
    date:  liveUpdateForm.date || undefined,
  })
  showUpdateLiveForm.value = false
}

async function handleMessangerUpdate() {
  if (!messangerUpdateForm.id) return // на всякий случай
  await updateMessanger(messangerUpdateForm.id, {
    type:   messangerUpdateForm.type || undefined,
    price:   messangerUpdateForm.price || undefined,
    isRecovery:   messangerUpdateForm.isRecovery || undefined,
    count: messangerUpdateForm.count ?? undefined,
    date:  messangerUpdateForm.date || undefined,
  })
  showUpdateLiveForm.value = false
}


// computed

// watchers
watch(callsParams, () => {
  getCalls()
}, {deep: true})

watch(messengersParams, () => {
  getMessangers()
}, {deep: true})


watch(liveParams, () => {
  getLive()
}, {deep: true})


// lifecycle hooks
onMounted(async () => {
  [liveParams.value.agentId, callsParams.value.agentId, messengersParams.value.agentId,] = [agentId, agentId, agentId]
  await getCalls()
  await getLive()
  await getAgents()
  await getMessangers()
})


</script>
<template>
  <UContainer class="flex flex-col gap-6">
    <UCard>
      <div class="flex items-center justify-between gap-4 border-b pb-4">
        <div class="flex items-center gap-2">

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
      <div class="grid grid-cols-1 gap-6">
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
        <UTabs v-model="activeTab" :items="tabs" class="w-full">
          <template #calls>
            <UCard class="mt-10">

              <UFormField>
                <UInput
                    v-model="callsParams.search"
                    placeholder="Поиск по номеру..."
                />
              </UFormField>
              <Transition name="fade-slide" mode="out-in">
                <UTable
                    :data="data || []"
                    :columns="callsColumns"
                />
              </Transition>
            </UCard>
            <!--            {{ data?.data }}-->
            <UPagination
                class="flex justify-center mt-4"
                size="xl"
                v-model:page="callsParams.page"
                :total="callsCount"/>
          </template>


          <template #live>
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
                </div>


              </UForm>
            </UCard>

            <UCard class="rounded-2xl shadow-sm mt-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-medium">История внесений</h3>
                <span class="text-sm text-gray-500">Всего: {{ live.length }}</span>
              </div>
              <UTable
                  :data="live"
                  :columns="liveColumns"
              />
            </UCard>

            <UPagination
                class="flex justify-center mt-4"
                size="xl"
                v-model:page="liveParams.page"
                :total="liveCount"/>

          </template>

          <template #messanger>
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
                        :items="messangerTypes"
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
                </div>


              </UForm>
            </UCard>

            <UCard class="rounded-2xl shadow-sm mt-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-medium">История внесений</h3>
              </div>
              <UTable
                  :data="messengers"
                  :columns="messangerColumns"
              />
            </UCard>

            <UPagination
                class="flex justify-center mt-4"
                size="xl"
                v-model:page="messengersParams.page"
                :total="messengersCount"/>

          </template>


          <!--                    <template #messangers>-->
          <!--                      <UCard class="mt-10">-->
          <!--                        <UTable :data="messanger?.messanger"/>-->
          <!--                      </UCard>-->
          <!--                    </template>-->
          <template #analytics>
            <UCard>
              <div class="grid grid-cols-2 gap-4">
                <div class="grid grid-cols-3">
                  <div class="grid grid-cols-2 w-200">
                    <div class="items-center grid grid-cols-2 w-80">
                      <!--                      <p>Кол-во лайва:</p>-->
                      <!--                      <p>{{ totalLeaveByAgentId?.totalLeads ?? 0 }}</p>-->
                      <!--                      <p>Кол-во вц:</p>-->
                      <!--                      <p>{{ totalMessangerByAgentId?.totalMessanger ?? 0 }}</p>-->
                      <!--                      <p>Кол-во звонков:</p>-->
                      <!--                      <p>{{ calls?.callAgregation?._count ?? 0 }}</p>-->
                      <!--                      <p>Сек в звонках:</p>-->
                      <!--                      <p>{{ calls?.callAgregation?._sum?.duration ?? 0 }}</p>-->
                      <!--                      <p>Время на линии:</p>-->
                      <!--                      <p>{{ totalDuration }}</p>-->
                    </div>
                    <div class="items-center grid grid-cols-2 w-80">
                      <!--                      <p>Расход по лайву:</p>-->
                      <!--                      <p>{{ expensesByLive }}</p>-->
                      <!--                      <p>Расход по вц:</p>-->
                      <!--                      <p>{{ expensesByMessanger }}</p>-->
                      <!--                      <p>Расход по тел-и:</p>-->
                      <!--                      <p>{{ expensesByVoip }}</p>-->
                      <!--                      <p>Общий расход:</p>-->
                      <!--                      <p>{{ totalExpenses }}</p>-->
                    </div>
                    <div class="mt-20 grid grid-cols-3 w-80">
                    </div>
                  </div>
                </div>
                <div class="flex flex-col justify-end">
                  <UFileUpload v-model="file" label="Загрузить файл" class="w-100 self-end"/>
                  <UButton @click="uploadCalls" class="w-30 self-end mt-4">
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
