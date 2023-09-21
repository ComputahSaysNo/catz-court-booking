import {defineStore} from "pinia"
import {ref} from "vue";
import type {User} from "../types"
import {useQuery} from "@vue/apollo-composable";
import {SESSION_INFO} from "@/queries";

export const useUserStore = defineStore('user', () => {
    const user = ref<User | null>(null)
    const isAuthenticated = ref<boolean>(false)
    const token = ref<string | null>(null)

    function loginWithToken(new_token: string) {
        token.value = new_token
        const q = useQuery(SESSION_INFO).result
        console.log(q)
    }

    return {user, isAuthenticated, token, loginWithToken}
})