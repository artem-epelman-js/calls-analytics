import { computed } from 'vue'
import {useAppStore} from "~~/stores/app.store";

const clean = <T extends Record<string, any>>(obj?: T) =>
    Object.fromEntries(Object.entries(obj ?? {}).filter(([, v]) => v != null)) as Partial<T>

export const useUiConfig = () => {
    const base = useAppConfig() // данные из app.config.ts
    const app = useAppStore()   // твой Pinia store

    const ui = computed(() => ({
        ...base.ui,
        ...clean(app.ui),
    }))

    const company = computed(() => ({
        ...base.company,
        
    }))

    return { ui, company }
}
