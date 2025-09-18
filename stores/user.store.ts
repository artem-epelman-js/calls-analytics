// import {defineStore} from "pinia";
//
// export type User = 'ADMIN' | 'USER';
// export const useUserStore = defineStore('user', () =>{
//     //state
//     const items = ref<User[]>([])
//     const total = ref<number>(0)
//     const page = ref<number>(1) //todo почему 1, дефолт минимум 1 страница?
//     const pageSize = ref<number>(20)
//     const q = ref<string>('')
//
//
//     //getters
//     const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
//     //todo немного не понял математику
//
//
//         //actions
//     const fetch = async () => {
//         const {$api} = useNuxtApp()// todo что оно делает?
//         const res = await $api<{
//             items: User[],
//
//         }
//     }
// })