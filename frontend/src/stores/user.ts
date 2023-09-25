import {defineStore} from "pinia"
import {computed, ref} from "vue";
import type {User} from "@/types"
import {useTokenStore} from "@/stores/token";

export const useUserStore = defineStore('user', () => {
    const tokenStore = useTokenStore()

    const user = ref<User|null>(null)
    const isAuthenticated = ref<boolean>(false)
    const groups = ref<string[]>([])

    return {user, isAuthenticated, groups}
})