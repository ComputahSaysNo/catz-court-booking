import {ref, computed} from "vue";
import {defineStore} from "pinia";
import type {Court, User} from "@/types";
import {Temporal} from "temporal-polyfill";

export const useNewBookingStore = defineStore('newBooking', () => {
    const startTime = ref<Temporal.PlainTime | null>(null)
    const endTime = ref<Temporal.PlainTime | null>(null)
    const date = ref<Temporal.PlainDate | null>(null)
    const court = ref<Court | null>(null)
    const description = ref<string>("")
    const state = ref<"idle" | "mouse-down" | "in-form">("idle")

    const duration = computed<Temporal.Duration | null>(() => {
        if (state.value !== 'idle') {
            return startTime.value!.until(endTime.value!)
        } else {
            return null
        }
    })

    function reset() {
        startTime.value = endTime.value = date.value = court.value = null
        description.value = ""
        state.value = "idle"
    }

    return {startTime, endTime, date, state, description, court, duration, reset}
})