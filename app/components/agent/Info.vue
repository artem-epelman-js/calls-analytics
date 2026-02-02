<script setup lang="ts">
import {UBadge} from "#components";

import type {Agent} from "@prisma/client";
import {format} from "date-fns";
import {ref} from "vue";
import {SelectItem} from "@nuxt/ui/components/Select.vue";

const props = defineProps<{
  agent: Agent,
  agentsOptions: SelectItem[]
}>()
const emit = defineEmits<{
  change:[id:number]
}>()

const router = useRouter()

const selected = ref<number | null>(null)

watch(props, () => {
  selected.value = props.agent.id
})


watch(() => selected.value, () => {
  if (!selected.value) return
  emit('change', selected.value)
}, {immediate: false})



</script>

<template>
  <UCard class="mt-10 w-[50%]">
    <div>
      <USelect v-if="agent.id" click
               v-model="selected"
               class="w-40"
               :items="agentsOptions"
      />
    </div>
    <div class="flex items-center justify-between gap-4 border-b pb-4">
      <div class="flex items-center gap-2">
      </div>
    </div>
    <div class="grid grid-cols-3 gap-6 pt-4">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Номер</p>
        <p class="mt-2 text-base font-medium">{{ agent.id }}</p>
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
