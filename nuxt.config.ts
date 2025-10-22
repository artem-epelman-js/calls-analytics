export default defineNuxtConfig({
  modules: ['@nuxt/ui', "@prisma/nuxt", '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  ssr: false,
    pinia: {
    },

    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
        layoutTransition: { name: 'layout', mode: 'out-in' },
    },
})