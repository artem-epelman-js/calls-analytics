<script setup lang="ts">

import {useAppStore} from "~~/stores/app.store";
import useUiConfig from "~/composables/useUiConfig";

const app = useAppStore()
const { ui, company } = useUiConfig() // <— теперь доступны в шаблоне

function makeDark() {
  app.setPrimaryColor?.('green')                 // если есть экшен для темы
  app.setWallpaperColor?.('zink')       // или 'green' — как реализовано у тебя
  app.setWallpaperColor?.('zinc')        // опечатка исправлена
}
</script>

<template>
  <UCard class="flex items-center justify-between px-8 mb-4 py-4">
    <h1>{{ company.name }}</h1>

    <nav class="flex gap-8 text-lg">
      <ULink to="/agents" active-class="text-primary font-semibold border-b-2 border-primary pb-1">
        Агенты
      </ULink>
      <ULink to="/live" active-class="text-primary font-semibold border-b-2 border-primary pb-1">
        Лайв
      </ULink>
      <ULink to="/messanger" active-class="text-primary font-semibold border-b-2 border-primary pb-1">
        Мессенджеры
      </ULink>
    </nav>
  </UCard>

  <div class="px-8">
    <p>Theme: {{ ui.theme }}, Primary: {{ ui.primary }}</p>
    <button @click="makeDark">Dark + Green</button>
  </div>
</template>
