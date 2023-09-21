import {defineStore} from "pinia"
import {ref} from "vue";
import type {User} from "../types"

export const useUserStore = defineStore('user', () => {
    const user = ref<User | null>(null)
    const isAuthenticated = ref<boolean>(false)
    const token = ref<string | null>(null)

    return {user, isAuthenticated, token}
})