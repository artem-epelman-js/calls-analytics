<script setup lang="ts">

import type {TableColumn} from "#ui/components/Table.vue";
import type {Live} from "@prisma/client";

const page = defineModel<number>('page')
const take = defineModel<number>('take')
const search = defineModel<string>('search')
const emit = defineEmits<{
  penisSosal: number,
  pisyDrochil: [id: string, payload: { name: string }]
}>()
emit('penisSosal', 20)
defineProps<{
  items: Live[],
  count: number,
  columns: TableColumn<Live>[]
}>()



</script>

<template>
  <div>

    <UCard class="rounded-2xl shadow-sm mt-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-medium">История внесений</h3>
        <span class="text-sm text-gray-500">Всего: {{ count }}</span>
      </div>
      <UTable
          :data="items || []"
          :columns="columns"
      />
    </UCard>


    <UPagination
        class="flex justify-center mt-4"
        size="xl"
        v-model:page="page"
        :items-per-page="take"
        :total="count"/>
  </div>
</template>

<style scoped>

</style>