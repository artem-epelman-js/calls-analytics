<script setup lang="ts">

import {messangerValidator} from "~~/validators/messanger.validator";
import {UButton} from "#components";
import {ref} from "vue";
import {storeToRefs} from "pinia";
import {useCallStore} from "~~/stores/call.store";
import {useLiveStore} from "~~/stores/live.store";
import {useTabsColumns} from "~/services/tableColumns";
import {useMessangerStore} from "~~/stores/messanger.store";

import {useRoute} from "#vue-router";
import {useRowActions} from "~/services/tableActions";
import {useMessangerHandlers} from "~/hooks/useMessangerHandlers";
import {useLiveHandlers} from "~/hooks/useLiveHandlers";

const activeTab = ref<'calls' | 'live' | 'messanger'>('calls')
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
const file = ref<File | null>(null)
const route = useRoute()
const agentId = Number(route.params.id as string)




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

const callsStore = useCallStore()
const {getAll: getCalls} = callsStore
const {data: calls, count: callsCount, params: callsParams} = storeToRefs(callsStore)




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
const {data: live, count: liveCount, params: liveParams} = storeToRefs(useLiveStore())
const {data: messangers, count: messengersCount, params: messengersParams} = storeToRefs(useMessangerStore())

const liveHandlers = useLiveHandlers()
const messangerHandlers = useMessangerHandlers()

const rowActions = useRowActions({
  onLiveEdit: (row) => {
    liveHandlers.showUpdateLiveFormData.value = true
    liveHandlers.liveUpdateFormData.id = row.original.id
    liveHandlers.liveUpdateFormData.date = row.original.date
    liveHandlers.liveUpdateFormData.geo = row.original.geo
    liveHandlers.liveUpdateFormData.count = row.original.count
  },
  onMessangerEdit: (row) => {
    messangerHandlers.showUpdateMessangerFormData.value = true
    messangerHandlers.messangerUpdateFormData.id = row.original.id
    messangerHandlers.messangerUpdateFormData.date = row.original.date
    messangerHandlers.messangerUpdateFormData.isRecovery = row.original.isRecovery
    messangerHandlers.messangerUpdateFormData.count = row.original.count
    messangerHandlers.messangerUpdateFormData.price = row.original.price
    messangerHandlers.messangerUpdateFormData.type = row.original.type
  },
})

const { callsColumns, liveColumns, messangerColumns } = useTabsColumns({
  callActions: rowActions.callActions,
  liveActions: rowActions.liveActions,
  messangerActions: rowActions.messangerActions
})


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


</script>

<template>
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
              :label="liveHandlers.showCreateLiveFormData.value ? 'Скрыть форму' : 'Добавить лайв'"
              :icon="liveHandlers.showCreateLiveFormData.value ? 'i-lucide-minus' : 'i-lucide-plus'"
              @click="liveHandlers.showCreateLiveFormData.value = !liveHandlers.showCreateLiveFormData.value"
          />
        </div>

        <UForm v-show="liveHandlers.showCreateLiveFormData.value"
               :state="liveHandlers.liveCreateFormData"
               @submit.prevent=liveHandlers.handleLiveCreate
        >
          <div class="flex justify-start gap-4">
            <UFormField label="Дата" name="date">
              <UInput v-model="liveHandlers.liveCreateFormData.date" type="date"/>
            </UFormField>

            <UFormField label="Колл-во" name="count">
              <UInput v-model.number="liveHandlers.liveCreateFormData.count"
                      type="number"
                      min="0"/>
            </UFormField>

            <UFormField label="Гео" name="geo">
              <USelect
                  v-model="liveHandlers.liveCreateFormData.geo"
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

        <UForm v-show="liveHandlers.showUpdateLiveFormData.value"
               :state="liveHandlers.liveUpdateFormData"
               @submit="liveHandlers.handleLiveUpdate"
        >

          <div class="flex justify-start gap-4">
            <UFormField label="Дата" name="date">
              <UInput v-model="liveHandlers.liveUpdateFormData.date" type="date"/>
            </UFormField>

            <UFormField label="Колл-во" name="count">
              <UInput v-model.number="liveHandlers.liveUpdateFormData.count"
                      type="number"
                      min="0"/>
            </UFormField>

            <UFormField label="Гео" name="geo">
              <USelect
                  v-model="liveHandlers.liveUpdateFormData.geo"
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
                     @click="liveHandlers.showUpdateLiveFormData.value = false"
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

        <template #messanger>

          <!--       messangers card    -->
          <UCard class="rounded-2xl shadow-sm">
            <div class="flex justify-end">
              <UButton
                  :label="messangerHandlers.showCreateMessangerFormData.value ? 'Скрыть форму' : 'Добавить мессенджер'"
                  :icon="messangerHandlers.showCreateMessangerFormData.value ? 'i-lucide-minus' : 'i-lucide-plus'"
                  @click="messangerHandlers.showCreateMessangerFormData.value = !messangerHandlers.showCreateMessangerFormData.value"
              />
            </div>

            <UForm v-if="messangerHandlers.showCreateMessangerFormData.value"
                   :state="messangerHandlers.messangerCreateFormData"
                   @submit.prevent=messangerHandlers.handleMessangerCreate
            >
              <div class="flex justify-start gap-4">
                <UFormField label="Дата" name="date">
                  <UInput v-model="messangerHandlers.messangerCreateFormData.date" type="date"/>
                </UFormField>

                <UFormField label="Колл-во" name="count">
                  <UInput v-model.number="messangerHandlers.messangerCreateFormData.count"
                          type="number"
                          min="0"/>
                </UFormField>

                <UFormField label="Тип" name="type">
                  <USelect
                      v-model="messangerHandlers.messangerCreateFormData.type"
                      :items="messangerTypes"
                      option-attribute="label"
                      value-attribute="value"
                      placeholder="Выбери тип"
                  />
                </UFormField>
                <UFormField label="Рекавери" name="isRecovery">
                  <USelect
                      v-model="messangerHandlers.messangerCreateFormData.isRecovery"
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
            <UForm v-if="messangerHandlers.showUpdateMessangerFormData.value"
                   :shcema="messangerValidator"
                   :state="messangerHandlers.messangerUpdateFormData"
                   @submit="messangerHandlers.handleMessangerUpdate"
            >

              <div class="flex justify-start gap-4">
                <UFormField label="Дата" name="date">
                  <UInput v-model="messangerHandlers.messangerUpdateFormData.date" type="date"/>
                </UFormField>

                <UFormField label="Колл-во" name="count">
                  <UInput v-model.number="messangerHandlers.messangerUpdateFormData.count"
                          type="number"
                          min="0"/>
                </UFormField>

                <UFormField label="Тип" name="type">
                  <USelect
                      v-model="messangerHandlers.messangerUpdateFormData.type"
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
                         color="error"
                         @click="messangerHandlers.showUpdateMessangerFormData.value = false"
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
</template>

<style scoped>

</style>