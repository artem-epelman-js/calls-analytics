<script setup lang="ts">

import {storeToRefs} from "pinia";
import {useAgentStore} from "~~/stores/agent.store";
import {ref} from "vue";
import {useRoute} from "#vue-router";

const {params} = storeToRefs(useAgentStore())
const {getAnalytics} = useAgentStore()
const analyticsData = ref<any | null>(null)
const route = useRoute()
const agentId = Number(route.params.id as string)
const activeAnalyticsTab = ref<'callsAnalytics' | 'liveAnalytics' | 'messangersAnalytics'>('callsAnalytics')
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


watch(params, async () => {
  analyticsData.value = await getAnalytics(agentId)
}, {deep: true, immediate: true})
</script>

<template>
  <UCard class="w-[50%] mt-10">
    <p class="mb-4">Общий расход: {{analyticsData?.totalPrice}} $</p>
    <UTabs v-model="activeAnalyticsTab" :items="analyticsTabs">

      <!--          Calls-->
      <template class="" #callsAnalytics>
        <div class="min-h-38">
          <div class="grid grid-cols-2">
            <div>
              <p class="mb-4">Колл-во</p>
              <p class="text-sm">Наборы - {{ analyticsData?.callsCount }}</p>
              <p class="text-sm">Время на линии - {{ analyticsData?.callsDuration }} с.</p>
            </div>
            <div>
              <p class="mb-4">Расход</p>
              <p class="text-sm">Расход по т-фонии - {{ Math.ceil(analyticsData?.callsDuration / 160) }} $</p>
            </div>
          </div>

        </div>

      </template>

      <!--            Messangers-->
      <template #messangersAnalytics>

        <div class="min-h-38 grid grid-cols-2">
          <div>
            <p class="mb-4">Колл-во</p>
            <p class="text-sm">Общее - {{ analyticsData?.allMessengersCount }}</p>
            <p class="text-sm">Рекавери - {{ analyticsData?.messangersIsRecoveryCount }}</p>
            <p class="text-sm">Не рекавери - {{ analyticsData?.messangersNonRecoveryCount }}</p>
          </div>
          <div class="">
            <p class="mb-4">Расход</p>
            <p class="text-sm">Общее - {{ analyticsData?.allMessengersPrice }} $</p>
            <p class="text-sm">Рекавери - {{ analyticsData?.messangersIsRecoveryPrice }} $</p>
            <p class="text-sm">Не рекавери - {{ analyticsData?.messangersNonRecoveryPrice }} $</p>
          </div>
        </div>
      </template>

      <!--          Live-->
      <template #liveAnalytics>
        <div class="min-h-38 grid grid-cols-2">
          <div>
            <p class="mb-4">Колл-во</p>
            <p class="text-sm">Общее- {{ analyticsData?.allLiveCount }}</p>
            <p class="text-sm">KZ - {{ analyticsData.liveByKZCount }}</p>
            <p class="text-sm">KG - {{ analyticsData.liveByKGCount }}</p>
            <p class="text-sm">BY - {{ analyticsData.liveByBYCount }}</p>
            <p class="text-sm">UZ - {{ analyticsData.liveByUZCount }}</p>
          </div>


          <div>
            <p class="mb-4">Расход</p>
            <p class="text-sm">Общее - {{ analyticsData?.allLivePrice }} $</p>
            <p class="text-sm">KZ - {{ analyticsData.liveByKZPrice }} $</p>
            <p class="text-sm">KG - {{ analyticsData.liveByKGPrice }} $</p>
            <p class="text-sm">BY - {{ analyticsData.liveByBYPrice }} $</p>
            <p class="text-sm">UZ - {{ analyticsData.liveByUZPrice }} $</p>
          </div>
        </div>

      </template>
    </UTabs>
  </UCard>

</template>

<style scoped>

</style>