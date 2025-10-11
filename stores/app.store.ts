import {defineStore} from "pinia";

export const useAppStore = defineStore('app', () => {
    //state
    let ui =  {
        colors: {
           primary: null as string | null,
            neutral: null as string | null,
        }
    }

    function setPrimaryColor(t:string) {
        this.primary = t
    }

    function setWallpaperColor(t:string) {
        this.neutral = t
    }

    return {
        ui,
        setPrimaryColor,
        setWallpaperColor,
    }
})