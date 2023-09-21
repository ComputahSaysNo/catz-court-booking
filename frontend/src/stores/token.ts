import {defineStore} from "pinia"
import {computed, ref} from "vue";

export const useTokenStore = defineStore('token', ()=> {
    const token = ref<string|null>(null)
    const header = computed<string|null>(()=>token.value ? `Token ${token.value}` : null)

    return {token, header}
})