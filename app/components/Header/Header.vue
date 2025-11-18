<script setup lang="ts">
const route = useRoute()

</script>

<template>
  <div>
    <UButton v-if="route.path!=='/agents'" class="ml-8 mt-4" icon="mdi-account" to="/agents">
      Агенты
    </UButton>
  </div>
</template>
