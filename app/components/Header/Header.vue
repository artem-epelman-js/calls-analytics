<script setup lang="ts">
</script>

<template>
  <UCard class="flex items-center justify-between px-8 mb-4 py-4">
    <!-- Лого -->

    <!-- Навигация -->
    <nav class="flex gap-8 text-lg">
      <ULink

          to="/agents"
          active-class="text-primary font-semibold border-b-2 border-primary pb-1"
      >
        Агенты
      </ULink>

      <ULink
          to="/live"
          active-class="text-primary font-semibold border-b-2 border-primary pb-1"
      >
        Лайв
      </ULink>

      <ULink
          to="/messanger"
          active-class="text-primary font-semibold border-b-2 border-primary pb-1"
      >
        Мессенджеры
      </ULink>
    </nav>
  </UCard>
</template>

<style scoped>
</style>
