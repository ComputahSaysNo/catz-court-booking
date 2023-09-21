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
    // const {result, loading, refetch} = provideApolloClient(apolloClient)(()=>useQuery(SESSION_INFO))
    // const user = computed(()=>result.value?.user || null)
    // const isAuthenticated = computed(()=>result.value?.isAuthenticated || false)
    // const getInfo = ref(refetch)
    //
    // function completeLogin() {
    //     console.log(apolloClient)
    //     console.log(tokenStore.token)
    //     getInfo.value()
    // }

    return {user, isAuthenticated}
})