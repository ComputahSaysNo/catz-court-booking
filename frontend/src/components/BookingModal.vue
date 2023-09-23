<script setup lang="ts">
import type {Booking} from "@/types";
import {computed, ref, watch} from "vue";
import {Temporal} from "temporal-polyfill";
import {useNewBookingStore} from "@/stores/newBooking";
import {useSettingsStore} from "@/stores/settings";

const newBooking = useNewBookingStore()
const settings = useSettingsStore()

const dateFormatUK = (date: Date) => {
  return `${date.getDate().toLocaleString('en-us', {minimumIntegerDigits: 2})}/${date.getMonth().toLocaleString('en-us', {minimumIntegerDigits: 2})}/${date.getFullYear()}`
}


const dateTemp = computed({
  get() {
    return newBooking.date ? new Date(newBooking.date.toString()) : new Date()
  }, set(newValue) {
    newBooking.date = Temporal.PlainDate.from(newValue.toISOString().split("T")[0])
  }
})

interface vdpTime {
  hours: number,
  minutes: number
}

function vdpFromTemporal(t: Temporal.PlainTime): vdpTime {
  return {hours: t.hour, minutes: t.minute}
}

function temporalFromVdp(v: vdpTime): Temporal.PlainTime {
  return Temporal.PlainTime.from({hour: v.hours, minute: v.minutes})
}

function vdpFromString(s: string): vdpTime {
  return vdpFromTemporal(Temporal.PlainTime.from(s))
}

const startTimeTemp = computed({
  get() {
    return newBooking.startTime ? vdpFromTemporal(newBooking.startTime) : {hours: 12, minutes: 0}
  },
  set(newValue) {
    newBooking.startTime = temporalFromVdp(newValue)
  }
})

const endTimeTemp = computed({
  get() {
    return newBooking.endTime ? vdpFromTemporal(newBooking.endTime) : {hours: 14, minutes: 0}
  },
  set(newValue) {
    newBooking.endTime = temporalFromVdp(newValue)
  }
})

</script>

<template>
  <div class="modal fade">
    <div class="modal-dialog modal-dialog-centered" style="display: block">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5">Create booking</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <p class="badge bg-danger fs-5">Court: {{newBooking.court?.name}}</p>
          <form>
            <div>
              <label>Date</label>
              <VueDatePicker v-model="dateTemp" :enable-time-picker="false" :format="dateFormatUK"
                             :teleport="true" auto-apply :clearable="false"></VueDatePicker>
            </div>
            <div class="field" v-if="newBooking.court">
              <label class="label">Start time</label>
              <div class="control">
                <VueDatePicker v-model="startTimeTemp" time-picker :teleport="true" auto-apply
                               :is-24="settings.timeFormat24h" :minutes-increment="30"
                               no-minutes-overlay :min-time="vdpFromString(newBooking.court!.openingTime)"
                               :max-time="vdpFromString(newBooking.court!.closingTime)"
                               :clearable="false"></VueDatePicker>
              </div>
            </div>
            <div class="field" v-if="newBooking.court">
              <label class="label">End time</label>
              <div class="control">
                <VueDatePicker v-model="endTimeTemp" time-picker :teleport="true" auto-apply
                               :is-24="settings.timeFormat24h" :minutes-increment="30"
                               no-minutes-overlay :min-time="startTimeTemp"
                               :max-time="vdpFromString(newBooking.court!.closingTime)"
                               :clearable="false"></VueDatePicker>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>