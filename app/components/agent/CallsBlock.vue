<script setup lang="ts">
import type {Calls, Messanger} from "@prisma/client";
import type {TableColumn} from "#ui/components/Table.vue";

const page = defineModel<number>('page');
const take = defineModel<number>('take');
const search = defineModel<string>('search');

defineProps<{
  items: Calls[],
  count: number,
  columns: TableColumn<Calls>[],
}>()
</script>

<template>
  <div class="">
    <UCard class="mt-10">

      <UFormField>
        <UInput
            v-model="search"
            placeholder="Поиск по номеру..."
        />
      </UFormField>
      <Transition name="fade-slide" mode="out-in">
        <UTable
            :data="items || []"
            :columns="columns"
        />
      </Transition>
    </UCard>
    <!--            {{ data?.data }}-->
    <UPagination
        class="flex justify-center mt-4"
        size="xl"
        v-model:page="page"
        :total="count"
        :items-per-page="take"
    />
  </div>
</template>

<style scoped>

</style>