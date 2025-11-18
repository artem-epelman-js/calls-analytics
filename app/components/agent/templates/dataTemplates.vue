<script setup lang="ts">

import {messangerValidator} from "~~/validators/messanger.validator";
import {UButton} from "#components";
import {reactive, ref} from "vue";
import {storeToRefs} from "pinia";
import {useCallStore} from "~~/stores/call.store";
import {type CreateLivePayload, type UpdateLivePayload, useLiveStore} from "~~/stores/live.store";
import {useTabsColumns} from "~/services/tableColumns";
import {type CreateMessangerPayload, type UpdateMessangerPayload, useMessangerStore} from "~~/stores/messanger.store";
import {useRoute} from "#vue-router";
const activeTab = ref<'calls' | 'live' | 'messengers'>('calls')
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
const {data: calls, count: callsCount, params: callsParams} = storeToRefs(useCallStore())

const showCreateLiveForm = ref<boolean>(false)
const showUpdateLiveForm = ref<boolean>(false)

const liveCreateForm = reactive<CreateLivePayload>({
  agentId: agentId,
  geo: '',
  count: null,
  date: '',
})
async function handleLiveCreate() {
  try {
    await createLive({...liveCreateForm})
    showCreateLiveForm.value = false
  } catch (e) {
    console.error('Create live failed:', e)
  }
}
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
const {data: live, update, count: liveCount, params: liveParams} = storeToRefs(useLiveStore())

const {callsColumns, liveColumns, messangerColumns} = useTabsColumns()
const liveUpdateForm = reactive<UpdateLivePayload>({
  id: null,
  geo: '',
  count: null,
  date: '',
})
async function handleLiveUpdate() {
  if (!liveUpdateForm.id) return // на всякий случай
  await update(liveUpdateForm.id, {
    count: liveUpdateForm.count ?? undefined,
    geo: liveUpdateForm.geo ?? undefined,
    date: liveUpdateForm.date || undefined,
  })
  showUpdateLiveForm.value = false
}



const {getAll: getCalls, remove: deleteCall} = useCallStore()


const showCreateMessangerForm = ref<boolean>(false)
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
async function handleMessangerCreate() {
  try {
    console.log(messangerCreateForm)
    await createMessanger(messangerCreateForm)
    showCreateMessangerForm.value = false
  } catch (e) {
    console.error('Create messanger failed:', e)
  }
}

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

const showUpdateMessangerForm = ref<boolean>(false)
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
const {data: messangers, count: messengersCount, params: messengersParams} = storeToRefs(useMessangerStore())

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
</template>

<style scoped>

</style>