<script setup lang="ts">

import {UButton} from "#components";
import {ref} from "vue";
import {storeToRefs} from "pinia";
import {useCallStore} from "~~/stores/call.store";
import {useTabsColumns} from "~/services/tableColumns";

import {useRoute} from "#vue-router";

const activeTab = ref<'calls' | 'live' | 'messanger'>('calls')
const tabs = [
  {
    label: 'Звонки',
    icon: 'solar:phone-bold',
    slot: 'calls',
    value: 'calls'
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






const { callsColumns} = useTabsColumns({
  callActions: rowActions.callActions,
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
  </UTabs>
</template>

<style scoped>

</style>