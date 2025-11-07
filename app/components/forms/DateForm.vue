<script setup lang="ts">
const startDate = ref(null)
const endDate = ref(null)

defineProps({
  startDate:Date,
  endDate:Date,
})
</script>

<template>
  <UCard>
    <div>
      <UFormField label="Начальная дата">
        <UInput
            size="xl"
            type="date" :v-model="startDate"/>
      </UFormField>
    </div>
    <div class="flex">
      <UFormField label="Конечная дата">
        <UInput size="xl" type="date" :v-model="endDate"/>
      </UFormField>

    </div>
  </UCard>
</template>

<style scoped>

</style>