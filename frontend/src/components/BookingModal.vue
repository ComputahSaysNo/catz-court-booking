<script setup lang="ts">
import type {Booking} from "@/types";
import {computed, ref, watch} from "vue";
import {Temporal} from "temporal-polyfill";

const dateFormatUK = (date: Date) => {
  return `${date.getDate().toLocaleString('en-us', {minimumIntegerDigits: 2})}/${date.getMonth().toLocaleString('en-us', {minimumIntegerDigits: 2})}/${date.getFullYear()}`
}

const props = defineProps<{
  newBooking: {
    date: Temporal.PlainDate
    startTime: Temporal.PlainTime
    endTime: Temporal.PlainTime
    court: number
  }
}>()

const tempDate = ref(new Date(props.newBooking.date.toString()))

watch(props.newBooking, () => tempDate.value = new Date(props.newBooking.date.toString()))

</script>

<template>
  <div class="modal fade">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5">Create booking</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form>
            <div class="form-floating">
              <VueDatePicker v-model="tempDate" :enable-time-picker="false" :format="dateFormatUK"
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