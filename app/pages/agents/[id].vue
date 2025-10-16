<script setup lang="ts">

// imports
import {h,} from 'vue'
import {ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {storeToRefs} from "pinia";
import {format} from 'date-fns'
import {UBadge, UButton, UDropdownMenu} from "#components";
import {useAgentStore} from "~~/stores/agent.store";
import {useCallStore} from "~~/stores/call.store";
import type {TableColumn} from "#ui/components/Table.vue";
import {callValidator} from "~~/validators/call.validator";
import {type SortableField, toggleSort} from "~/app_helpers/sort-helper";


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


type Calls = {
  id: number
  AgentId: number
  date: Date
  phone: string
  duration: number
  price: number
  status: CallStatus
  createdAt: Date
  updatedAt: Date
}


// hooks
const route = useRoute()
const router = useRouter()
const agentId = Number(route.params.id as string)

//
const startDate = ref<string | undefined>(undefined)
const endDate = ref<string | undefined>(undefined)
const activeTab = ref<'calls' | 'live' | 'messengers' | 'analytics'>('calls')

watch([startDate, endDate], ([s, e], [os, oe]) => {
  // реагируем на изменения дат
  if (activeTab.value === 'calls') {
    callsParams.value.date__gte = s || undefined
    callsParams.value.date__lte = e || undefined
    // если нужно сразу перегружать:
    // callStore.getAll()
  }
})

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
// -- call store
const {getAll: getCalls, create: createCalls, getById, remove: deleteCall, resetParams} = useCallStore()
const {data, count: callsCount, loading, error, params: callsParams} = storeToRefs(useCallStore())

// reactive variables
const agent = ref<any | null>(null)
// const page = ref(1)
const file = ref<File | null>(null)


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
    slot: 'messangers',
    value: 'messengers'

  },
  {
    label: 'Аналитика',
    icon: 'i-lucide-lock',
    slot: 'analytics',
    value: 'analytics'

  }
]


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

// tables
const callsColumns: TableColumn<Calls>[] = [
  // {
  //   accessorKey: 'id',
  //   header: 'ID',
  //   cell: ({row}) => `${row.getValue('id')}`
  // },
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


// async functions
// async function handleSubmit() {
//   await useFetch(`/api/calls/${agentId}`, {
//     params: {startDate: state.startDate, endDate: state.endDate}
//   })
//   await getCalls()
// }
async function upload() {
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

// computed

// watchers
watch(callsParams, () => {
  getCalls()
}, {deep: true})

// watch(selectedStage, (val) => {
//   if (val == null) return
//   const id = Number(val)
//   router.push({path: `/agents/${id}`})
//   getCalls(id)
//   getLive(id)
//   getMessanger(id)
// })


// lifecycle hooks

onMounted(async () => {
  await getCalls()
})


</script>
<template>
  <UContainer class="flex flex-col gap-6">
    <UCard>
      <div class="flex items-center justify-between gap-4 border-b pb-4">
        <div class="flex items-center gap-2">
          <!--          <USelect-->
          <!--              class="w-50"-->
          <!--              v-model="selectedStage"-->
          <!--              :items="agentsList"-->
          <!--              size="xl"-->
          <!--              placeholder="Выбери агента"-->
          <!--              :loading="!agents?.data?.length"-->
          <!--          />-->
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
                    :key="tableTransitionKey"
                    :data="data || []"
                    :columns="callsColumns"
                />
              </Transition>
            </UCard>
            {{ data?.data }}
            <UPagination
                class="flex justify-center mt-4"
                size="xl"
                v-model:page="callsParams.page"
                :total="callsCount"/>
          </template>
          <!--          <template #live>-->
          <!--            <UCard class="mt-10">-->
          <!--              <UTable :data="live?.live"/>-->
          <!--            </UCard>-->
          <!--          </template>-->
          <!--          <template #messangers>-->
          <!--            <UCard class="mt-10">-->
          <!--              <UTable :data="messanger?.messanger"/>-->
          <!--            </UCard>-->
          <!--          </template>-->
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
                  <UButton @click="upload" class="w-30 self-end mt-4">
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
