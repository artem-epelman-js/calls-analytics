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
]


// watch(params, async () => {
//   analyticsData.value = await getAnalytics(agentId)
// }, {deep: true, immediate: true})
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
    </UTabs>
  </UCard>

</template>

<style scoped>

</style>