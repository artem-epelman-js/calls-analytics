import {useAppStore} from "~~/stores/app.store";

export default defineNuxtPlugin(() => {
    const appConfig = useAppConfig()
    const app = useAppStore()
    // склонируем, чтобы не мутировать readonly объект
    app.$patch({
        ui: { ...appConfig.ui },
        company: { ...appConfig.company },
    })
})