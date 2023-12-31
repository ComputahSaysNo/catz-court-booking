<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import {useMutation, useQuery} from "@vue/apollo-composable";
import {ALL_BOOKINGS, DELETE_BOOKING} from "@/queries";
import {computed, ref, watch} from "vue";
import type {Booking} from "@/types";
import {Temporal} from "temporal-polyfill";
import {getMonday} from "@/utils/datetime";


const userStore = useUserStore()

const {result} = useQuery(ALL_BOOKINGS)
const userBookings = computed<Booking[]>(() => result.value?.allBookings?.filter((obj: Booking) => obj.user.id === userStore.user?.id) ?? [])

const deleteTarget = ref<string | number | null>(null)
const loading = ref(false)

interface readQueryType {
  allBookings: any[]
}

const {mutate: deleteBookingMutation} = useMutation(DELETE_BOOKING, () => ({
  update: (cache, deleteBookingMutation) => {
    let data: readQueryType = cache.readQuery({query: ALL_BOOKINGS})!
    data = {
      ...data,
      allBookings: [
        ...data.allBookings,
        deleteBookingMutation,
      ],
    }
    cache.writeQuery({query: ALL_BOOKINGS, data})
  }
}))

function deleteBooking(id: number | string): void {
  loading.value = true
  deleteTarget.value = id
  deleteBookingMutation({
    bookingID: id
  })

}

watch(userBookings, () => {
  deleteTarget.value = null
  loading.value = false
})

</script>

<template>
  <div v-if="userStore.user" class="container-fluid card mt-4 bg-white p-3 rounded" style="max-width: 1200px">
    <div class="d-flex mb-4">
      <span class="fs-3 me-2">Hello, {{ userStore.user?.firstName }}</span>
      <span class="badge bg-primary mx-1 fs-6 align-self-center font-monospace"
            v-for="group of userStore.groups">{{ group }}</span>
    </div>


    <div v-if="userBookings.length > 0">
      <p class="fs-5">Your upcoming bookings: </p>
      <div class="d-flex flex-row flex-wrap gap-3">
        <div class="p-2 card bg-light" style="line-height: 0.5em; min-width: 160px;" v-for="booking in userBookings">
          <div>
            <span class="badge bg-danger fs-6">{{ booking.court.name }}</span>
            <div v-if="loading && deleteTarget === booking.id" class="align-self-center float-end m-1">
              <div class="spinner-border" role="status" style="width: 20px; height: 20px;">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <button v-else class="btn-close float-end" @click="deleteBooking(booking.id)"></button>
          </div>
          <p class="mt-3 fw-bold">{{
              Temporal.PlainDate.from(booking.date).toLocaleString('en-GB', {
                weekday: "short",
                day: "numeric",
                month: "numeric"
              }).replace(',', '')
            }}</p>
          <p>{{ booking.startTime.slice(0, -3) }} to {{ booking.endTime.slice(0, -3) }}</p>
        </div>

      </div>
    </div>

    <div v-else class="fs-5"><p class="mb-0">You have no upcoming bookings.</p>
      <p>Use the calendar below to make one:</p></div>
  </div>
</template>

<style scoped>

</style>