<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import {useQuery} from "@vue/apollo-composable";
import {BOOKINGS_BY_USER} from "@/queries";
import {computed} from "vue";
import type {Booking} from "@/types";
import {Temporal} from "temporal-polyfill";
import {getMonday} from "@/utils/datetime";


const userStore = useUserStore()

const {result, loading} = useQuery(BOOKINGS_BY_USER, {userId: userStore.user?.id})
const userBookings = computed<Booking[]>(() => result.value?.bookingsByUser.sort() ?? [])

</script>

<template>
  <div v-if="userStore.user" class="container card mt-4 bg-white p-3 rounded">
    <div class="d-flex mb-4">
      <span class="fs-3 me-2">Hello, {{ userStore.user?.firstName }}</span>
      <span class="badge bg-primary mx-1 fs-6 align-self-center font-monospace" v-for="group of userStore.groups">{{ group }}</span>
    </div>


    <div v-if="userBookings.length > 0">
      <p class="fs-5">Your upcoming bookings: </p>
      <div class="d-flex flex-row flex-wrap gap-3 justify-content-center">
        <div class="p-2 card bg-light" style="line-height: 0.5em; min-width: 200px" v-for="booking in userBookings">
          <div>
            <span class="badge bg-danger fs-6">{{ booking.court.name }}</span>
            <button class="btn-close float-end"></button>
          </div>
          <p class="mt-3 fw-bold">{{
              Temporal.PlainDate.from(booking.date).toLocaleString('en-GB', {
                weekday: "long",
                day: "numeric",
                month: "numeric"
              }).replace(',', '')
            }}</p>
          <p>{{ booking.startTime.slice(0, -3) }} to {{ booking.endTime.slice(0, -3) }}</p>
        </div>

      </div>
    </div>

    <p v-else class="fs-5">You have no upcoming bookings. Click on the calendar below to make one: </p>
  </div>
</template>

<style scoped>

</style>