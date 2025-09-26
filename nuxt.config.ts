export default defineNuxtConfig({
  modules: ['@nuxt/ui', "@prisma/nuxt"],
  css: ['~/assets/css/main.css'],
  ssr: false,
    routeRules: {
        // ⚠️ Указывать только страницы, где допустимо 12 ч без обновления
        '/sales/**': { headers: { 'Cache-Control': 'public, max-age=43200' } },
        '/sales': { swr: 3200 }, // 12 часов
        '/about':    { headers: { 'Cache-Control': 'public, max-age=43200' } },

        // ассеты Nuxt
        '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
        '/images/**':{ headers: { 'Cache-Control': 'public, max-age=604800' } }
    },
})