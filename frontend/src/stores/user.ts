import {defineStore} from "pinia"
import {computed, ref} from "vue";
import type {User} from "../types"
import {useQuery, provideApolloClient} from "@vue/apollo-composable";
import {SESSION_INFO} from "@/queries";
import {apolloClient} from "@/main";
import {useTokenStore} from "@/stores/token";

export const useUserStore = defineStore('user', () => {
    const tokenStore = useTokenStore()

    const user = ref<User|null>(null)
    const isAuthenticated = ref<boolean>(false)

    return {user, isAuthenticated}
})