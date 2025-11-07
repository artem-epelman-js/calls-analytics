<script setup lang="ts">

import type {Messanger} from "~~/stores/messanger.store";
import type {TableColumn} from "#ui/components/Table.vue";

const page = defineModel<number>('page')
const take = defineModel<number>('take')

defineProps<{
  items: Messanger[],
  count: number,
  columns : TableColumn<Messanger>[]
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