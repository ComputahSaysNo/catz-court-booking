import {ref, computed} from "vue";
import {defineStore} from "pinia";

export const useSettingsStore = defineStore('settings', ()=>{
    const timeFormat24h = ref<boolean>(true)

    return {timeFormat24h}
})