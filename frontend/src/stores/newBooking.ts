import {ref, computed} from "vue";
import {defineStore} from "pinia";
import type {Court, User} from "@/types";
import {Temporal} from "temporal-polyfill";

export const useNewBookingStore = defineStore('newBooking', ()=> {
    const startTime = ref<Temporal.PlainTime | null>(null)
    const endTime = ref<Temporal.PlainTime | null>(null)
    const date = ref<Temporal.PlainDate | null>(null)
    const court = ref<Court | null>(null)
    const state = ref<"idle" | "mouse-down" | "in-form">("idle")

    function reset() {
        startTime.value = endTime.value = date.value = court.value = null
        state.value = "idle"
    }

    return {startTime, endTime, date, state, court, reset}
})