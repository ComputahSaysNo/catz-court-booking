<script setup lang="ts">
import type {Booking} from "@/types";
import {computed, ref, watch} from "vue";
import {Temporal} from "temporal-polyfill";
import {useNewBookingStore} from "@/stores/newBooking";

const newBooking = useNewBookingStore()

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
          <form>
            <div class="form-floating">
              <VueDatePicker v-model="dateTemp" :enable-time-picker="false" :format="dateFormatUK"
                             :teleport="true" auto-apply :clearable="false"></VueDatePicker>
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