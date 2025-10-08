export default defineNuxtConfig({
  modules: ['@nuxt/ui', "@prisma/nuxt", '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  ssr: false,
    pinia: {
        // опционально
        // storesDirs: ['~/stores'] // если нужна кастомная папка
    },
    routeRules: {
        // ⚠️ Указывать только страницы, где допустимо 12 ч без обновления
        '/agents/**': { headers: { 'Cache-Control': 'public, max-age=43200' } },
        '/agents': { swr: 3200 }, // 12 часов
        '/about':    { headers: { 'Cache-Control': 'public, max-age=43200' } },

        // ассеты Nuxt
        '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
        '/images/**':{ headers: { 'Cache-Control': 'public, max-age=604800' } }
    },
    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
        layoutTransition: { name: 'layout', mode: 'out-in' },
    },
})