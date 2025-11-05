<script setup lang="ts">
import { computed, h, reactive, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { UButton, UDropdownMenu } from '#components'
import LiveForm from '~/components/forms/LiveForm.vue'
import { useLiveStore, type Live, type UpdateLivePayload } from '~~/stores/live.store'
import { useAgentStore } from '~~/stores/agent.store'
import { useMessangerStore, type CreateMessangerPayload, type UpdateMessangerPayload } from '~~/stores/messanger.store'
import { renderSortableHeader } from '~/app_helpers/sort-helper'

// --- reactive flags
const showCreateLiveForm = ref(false)              // <<< добавлено
const showUpdateMessangerForm = ref(false)         // <<< добавлено

const route = useRoute()
const agentId = Number(route.params.id as string)

// --- stores
const { data: agents } = storeToRefs(useAgentStore())
const { getAll: getAgents } = useAgentStore()

const liveStore = useLiveStore()
const { getAll: getLive, update,  remove: deleteLive } = liveStore
const { data: live, count: liveCount, params: liveParams } = storeToRefs(liveStore)

const messangerStore = useMessangerStore()
const { getAll: getMessangers, remove: deleteMessanger } = messangerStore
const { data: messangers, count: messengersCount, params: messengersParams } = storeToRefs(messangerStore)

// --- forms

const messangerCreateForm = reactive<CreateMessangerPayload>({
  agentId,
  type: '',
  count: null,
  date: '',
  price: null,
  isRecovery: false
})

const messangerUpdateForm = reactive<UpdateMessangerPayload>({
  id: null,
  type: '',
  count: null,
  date: '',
  price: null,
  isRecovery: false
})

// --- constants
const liveGeo = [
  { label: 'KZ', value: 'KZ' },
  { label: 'KG', value: 'KG' },
  { label: 'BY', value: 'BY' },
  { label: 'UZ', value: 'UZ' },
]

const liveFormRef = ref<InstanceType<typeof LiveForm> | null>(null)

// --- row actions
function liveActions(row: { original: Live }) {
  const rec = row.original
  return [[
    {
      label: 'Редактировать',
      icon: 'ix:edit-document',
      onSelect: () => {
        // Используем метод, expose-нутый из LiveForm.vue
        liveFormRef.value?.edit(rec)
      }
    },
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        await deleteLive(rec.id)
        await getLive()
      }
    },
  ]]
}

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
  {id: 'count',  header: renderSortableHeader('count', 'Колличество', messengersParams), accessorKey: 'count'},
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
  {id: 'type',  header: renderSortableHeader('type', 'Тип', messengersParams), accessorKey: 'type'},
  {id: 'isRecovery',     header: renderSortableHeader('isRecovery', 'Рекавери', messengersParams),
    accessorKey: 'isRecovery'},
  {id: 'price',     header: renderSortableHeader('price', 'Цена', messengersParams),
    accessorKey: 'price'},
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

function messangerActions(row: any) {
  const messangerId: number = row.original?.id
  return [[
    {
      label: 'Удалить',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: async () => {
        if (!messangerId) return
        await deleteMessanger(messangerId)
        await getMessangers()
      }
    },
    {
      label: 'Редактировать',
      icon: 'ix:edit-document',
      onSelect: () => {
        messangerUpdateForm.id = messangerId
        messangerUpdateForm.type = row.original.type
        messangerUpdateForm.count = row.original.count
        messangerUpdateForm.date = row.original.date
        messangerUpdateForm.isRecovery = row.original.isRecovery
        showUpdateMessangerForm.value = true
      }
    },
  ]]
}

// --- table columns
const liveColumns = [
  { id: 'id', header: 'ID', accessorKey: 'id' },
  {
    id: 'action',
    header: 'Действие',
    cell: ({ row }: any) =>
        h(
            UDropdownMenu,
            { content: { align: 'end' }, items: liveActions(row) },
            () => h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              variant: 'subtle',
              size: 'xl',
              class: 'cursor-pointer'
            })
        )
  },
  { id: 'count', header: renderSortableHeader('count', 'Колличество', liveParams), accessorKey: 'count' },
  {
    accessorKey: 'date',
    header: renderSortableHeader('date', 'Дата', liveParams),
    cell: ({ row }: any) =>
        new Date(row.getValue('date')).toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
  },
  { id: 'geo', header: renderSortableHeader('geo', 'Гео', liveParams), accessorKey: 'geo' },
  {
    accessorKey: 'updatedAt',
    header: renderSortableHeader('updatedAt', 'Загружен', liveParams), // <<< было 'createdAt'
    cell: ({ row }: any) =>
        new Date(row.getValue('updatedAt')).toLocaleString('en-US', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
  },
]

// показать/скрыть форму создания
const showCreateMessangerForm = ref(false)

// ref, чтобы дергать .edit(record)
let MessangerForm;
const messangerFormRef = ref<InstanceType<typeof MessangerForm> | null>(null)

// справочник типов для селекта внутри формы
const messangerTypeItems = [
  { label: 'Telegram', value: 'TELEGRAM' },
  { label: 'WhatsApp', value: 'WHATSAPP' }
]

// открыть форму на создание
function openCreateMessanger() {
  showCreateMessangerForm.value = true
}

// открыть форму на редактирование конкретной записи
function openEditMessanger(rec: any) {
  // форма сама включает режим edit и подставляет данные
  messangerFormRef.value?.edit(rec)
}

// --- watchers
watch(liveParams, () => { getLive() }, { deep: true })

// --- lifecycle
onMounted(async () => {
  liveParams.value.agentId = agentId
  messengersParams.value.agentId = agentId
  await Promise.all([getLive(), getAgents(), getMessangers()])
})

</script>

<template>
  <UContainer class="flex flex-col gap-6">
    <agent-header
        :agent="agent"
        :agentId="agentId"
    />

        <!--        <div class="flex justify-between w-150">-->
        <!--          <div>-->
        <!--            <UFormField label="Начальная дата">-->
        <!--              <UInput-->
        <!--                  size="xl"-->
        <!--                  type="date" v-model="startDate"/>-->
        <!--            </UFormField>-->
        <!--          </div>-->
        <!--          <div class="flex">-->
        <!--            <UFormField label="Конечная дата">-->
        <!--              <UInput size="xl" type="date" v-model="endDate"/>-->
        <!--            </UFormField>-->

        <!--          </div>-->
        <!--        </div>-->
        <!--        <UTabs v-model="activeTab" :items="tabs" class="w-full">-->
        <!--          <template #calls>-->
        <!--            <UCard class="mt-10">-->

        <!--              <UFormField>-->
        <!--                <UInput-->
        <!--                    v-model="callsParams.search"-->
        <!--                    placeholder="Поиск по номеру..."-->
        <!--                />-->
        <!--              </UFormField>-->
        <!--              <Transition name="fade-slide" mode="out-in">-->
        <!--                <UTable-->
        <!--                    :data="data || []"-->
        <!--                    :columns="callsColumns"-->
        <!--                />-->
        <!--              </Transition>-->
        <!--            </UCard>-->
        <!--            &lt;!&ndash;            {{ data?.data }}&ndash;&gt;-->
        <!--            <UPagination-->
        <!--                class="flex justify-center mt-4"-->
        <!--                size="xl"-->
        <!--                v-model:page="callsParams.page"-->
        <!--                :total="callsCount"-->
        <!--                :items-per-page="callsParams.take"-->

        <!--            />-->
        <!--          </template>-->


        <div>

          <div class="flex justify-end mb-4">
            <UButton
                :label="showCreateLiveForm ? 'Скрыть форму' : 'Добавить лайв'"
                :icon="showCreateLiveForm ? 'i-lucide-minus' : 'i-lucide-plus'"
                @click="showCreateLiveForm = !showCreateLiveForm"
            />
          </div>

          <LiveForm
              ref="liveFormRef"
              v-model:open="showCreateLiveForm"
              :geo-items="liveGeo"
          />

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
              :items-per-page="liveParams.limit"
              :total="liveCount"/>
        </div>

  </UContainer>
</template>


<!--          <template #messanger>-->
<!--            <UCard class="rounded-2xl shadow-sm">-->
<!--              <div class="flex justify-end">-->
<!--                <UButton-->
<!--                    :label="showCreateMessangerForm ? 'Скрыть форму' : 'Добавить мессенджер'"-->
<!--                    :icon="showCreateMessangerForm ? 'i-lucide-minus' : 'i-lucide-plus'"-->
<!--                    @click="showCreateMessangerForm = !showCreateMessangerForm"-->
<!--                />-->
<!--              </div>-->

<!--              <UForm v-if="showCreateMessangerForm"-->
<!--                     :state="messangerCreateForm"-->
<!--                     @submit.prevent=handleMessangerCreate-->
<!--              >-->
<!--                <div class="flex justify-start gap-4">-->
<!--                  <UFormField label="Дата" name="date">-->
<!--                    <UInput v-model="messangerCreateForm.date" type="date"/>-->
<!--                  </UFormField>-->

<!--                  <UFormField label="Колл-во" name="count">-->
<!--                    <UInput v-model.number="messangerCreateForm.count"-->
<!--                            type="number"-->
<!--                            min="0"/>-->
<!--                  </UFormField>-->

<!--                  <UFormField label="Тип" name="type">-->
<!--                    <USelect-->
<!--                        v-model="messangerCreateForm.type"-->
<!--                        :items="messangerTypes"-->
<!--                        option-attribute="label"-->
<!--                        value-attribute="value"-->
<!--                        placeholder="Выбери тип"-->
<!--                    />-->
<!--                  </UFormField>-->
<!--                  <UFormField label="Рекавери" name="isRecovery">-->
<!--                    <USelect-->
<!--                        v-model="messangerCreateForm.isRecovery"-->
<!--                        :items="isRecovery"-->
<!--                        option-attribute="label"-->
<!--                        value-attribute="value"-->
<!--                        placeholder="Рекавери"-->
<!--                    />-->
<!--                  </UFormField>-->
<!--                  <UButton type="submit"-->
<!--                           variant="ghost"-->
<!--                           size="lg"-->
<!--                           class="rounded-xl px-6">-->
<!--                    Сохранить-->
<!--                  </UButton>-->

<!--                </div>-->


<!--              </UForm>-->
<!--              <UForm v-if="showUpdateMessangerForm"-->
<!--                     :shema="messangerValidator"-->
<!--                     :state="messangerUpdateForm"-->
<!--                     @submit="handleMessangerUpdate"-->
<!--              >-->
<!--                <div class="flex justify-start gap-4">-->
<!--                  <UFormField label="Дата" name="date">-->
<!--                    <UInput v-model="messangerUpdateForm.date" type="date"/>-->
<!--                  </UFormField>-->

<!--                  <UFormField label="Колл-во" name="count">-->
<!--                    <UInput v-model.number="messangerUpdateForm.count"-->
<!--                            type="number"-->
<!--                            min="0"/>-->
<!--                  </UFormField>-->

<!--                  <UFormField label="Тип" name="geo">-->
<!--                    <USelect-->
<!--                        v-model="messangerUpdateForm.type"-->
<!--                        :items="messangerTypes"-->
<!--                        option-attribute="label"-->
<!--                        value-attribute="value"-->
<!--                        placeholder="Выбери тип"-->
<!--                    />-->
<!--                  </UFormField>-->

<!--                  <UButton type="submit"-->
<!--                           variant="ghost"-->
<!--                           size="lg"-->
<!--                           class="rounded-xl px-6">-->
<!--                    Сохранить-->
<!--                  </UButton>-->
<!--                  <UButton type="button"-->
<!--                           variant="ghost"-->
<!--                           size="lg"-->
<!--                           @click="showUpdateMessangerForm = false"-->
<!--                           color="error"-->
<!--                           class="rounded-xl px-6">-->
<!--                    Отмена-->
<!--                  </UButton>-->
<!--                </div>-->


<!--              </UForm>-->
<!--            </UCard>-->

<!--            <UCard class="rounded-2xl shadow-sm mt-6">-->
<!--              <div class="flex items-center justify-between mb-3">-->
<!--                <h3 class="text-lg font-medium">История внесений</h3>-->
<!--              </div>-->
<!--              <UTable-->
<!--                  :data="messangers"-->
<!--                  :columns="messangerColumns"-->
<!--              />-->
<!--            </UCard>-->

<!--            <UPagination-->
<!--                class="flex justify-center mt-4"-->
<!--                size="xl"-->
<!--                v-model:page="messengersParams.page"-->
<!--                :items-per-page="messengersParams.limit"-->
<!--                :total="messengersCount"/>-->

<!--          </template>-->

              <template #messanger>

                <MessangerForm
                    ref="messangerFormRef"
                    v-model:open="showCreateMessangerForm"
                    :type-items="messangerTypeItems"
                />


                <UCard class="rounded-2xl shadow-sm mt-6">-->
                                <div class="flex items-center justify-between mb-3">
                                  <h3 class="text-lg font-medium">История внесений</h3>
                                </div>
                                <UTable
                                    :data="messangers"
                                    :columns="messangerColumns"
                                />
                              </UCard>

                              <UPagination
                                  class="flex justify-center mt-4"
                                  size="xl"
                                  v-model:page="messengersParams.page"
                                  :items-per-page="messengersParams.limit"
                                  :total="messengersCount"/>

              </template>
<!--        </UTabs>-->


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
