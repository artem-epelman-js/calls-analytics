<script setup lang="ts">

import {UBadge} from "#components";
import type {Agent} from "@prisma/client";
import {format} from "date-fns";

defineProps<{
  agentId: number,
  agent: Agent,
}>()
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between gap-4 border-b pb-4">
      <div class="flex items-center gap-2">
      </div>
    </div>
    <div class="grid grid-cols-3 gap-6 pt-4">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Номер</p>
        <p class="mt-2 text-base font-medium">{{ agentId }}</p>
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
</template>

<style scoped>

</style>