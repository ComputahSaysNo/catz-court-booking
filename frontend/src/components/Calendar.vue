<script setup lang="ts">
import {useQuery} from "@vue/apollo-composable"
import {ALL_BOOKINGS, ALL_COURTS} from "@/queries";
import {Temporal} from "temporal-polyfill";
import {getMonday, getWeek, isToday, getTimeString} from "@/utils/datetime";
import {computed, ref, watch} from "vue";
import type {Court, Booking} from "@/types"
import BookingModal from "@/components/BookingModal.vue"
import {useUserStore} from "@/stores/user";
import {useNewBookingStore} from "@/stores/newBooking";

const userStore = useUserStore()
const newBooking = useNewBookingStore()

const display24hr = true
const today = Temporal.Now.plainDateISO()

const q1 = useQuery(ALL_COURTS).result
const allCourts = computed<Court[]>(() => q1.value?.allCourts ?? [])
const activeCourtId = ref<number>(1)
const activeCourt = computed(() => {
  if (allCourts) {
    return allCourts.value.find(obj => obj.id === activeCourtId.value) ?? null
  } else {
    return null
  }
})
watch(allCourts, () => {
  activeCourtId.value = allCourts.value[0].id
})


const firstDisplayedDay = ref<Temporal.PlainDate>(getMonday(today))
const displayedWeek = computed<Temporal.PlainDate[]>(() => {
  return getWeek(firstDisplayedDay.value)
})

const q2 = useQuery(ALL_BOOKINGS).result
const allBookings = computed<Booking[]>(() => q2.value?.allBookings ?? [])
const displayedBookings = computed<Booking[]>(() => {
  return allBookings.value.filter((obj) => {
    if (obj.court.id !== activeCourtId.value) {
      return false
    }
    let d = Temporal.PlainDate.from(obj.date)
    return Temporal.PlainDate.compare(displayedWeek.value[0], d) <= 0 && Temporal.PlainDate.compare(displayedWeek.value[6], d) >= 0
  })
})


const now = ref<Temporal.PlainTime>(Temporal.Now.plainTimeISO())

function shiftViewByNumDays(n: number): void {
  firstDisplayedDay.value = firstDisplayedDay.value.add({days: n})
}

function jumpViewToThisWeek(): void {
  firstDisplayedDay.value = getMonday(today)
}

function isVLineHighlighted(d: Temporal.PlainDate): Boolean {
  return (isToday(d)) && Temporal.PlainDate.compare(firstDisplayedDay.value, today) <= 0
}

const startTime = computed<Temporal.PlainTime>(() => {
  if (activeCourt.value) {
    return Temporal.PlainTime.from(activeCourt.value?.openingTime)
  } else {
    return new Temporal.PlainTime(6, 0)
  }
})

const endTime = computed<Temporal.PlainTime>(() => {
  if (activeCourt.value) {
    return Temporal.PlainTime.from(activeCourt.value?.closingTime)
  } else {
    return new Temporal.PlainTime(22, 0)
  }
})


const timeLabels = computed<Temporal.PlainTime[]>(() => {
      let t: Temporal.PlainTime[] = [startTime.value]
      for (let i = startTime.value.hour + 1; i <= endTime.value.hour; i++) {
        t.push(new Temporal.PlainTime(i, 0))
      }
      if (endTime.value.minute !== 0) {
        t.push(endTime.value)
      }
      return t
    }
)

watch(activeCourtId, () => {
  newBooking.reset()
  newBooking.court = activeCourt.value
})

const newBookingEndLimit = computed<Temporal.PlainTime>(() => {
  if (newBooking.state === 'idle') {
    return endTime.value
  } else {
    let earliestLimit = endTime.value
    for (let booking of displayedBookings.value) {
      const bookingStartTime = Temporal.PlainTime.from(booking.startTime)
      if (booking.date === newBooking.date?.toString()) {
        if (Temporal.PlainTime.compare(bookingStartTime, newBooking.startTime!) > 0) {
          if (Temporal.PlainTime.compare(bookingStartTime, earliestLimit) < 0) {
            earliestLimit = Temporal.PlainTime.from(booking.startTime)
          }
        }
      }
    }
    return earliestLimit
  }
})

// Display stuff
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const hourGapPx = 80
const initialOffsetPx = 120
const lineOverlap = 40

const minBooking = Temporal.Duration.from({hours: 0, minutes: 60})
const increment = Temporal.Duration.from({hours: 0, minutes: 30})

function getTimeOffsetPx(time: Temporal.PlainTime): number {
  return hourGapPx * ((time.hour - startTime.value.hour) + (time.minute - startTime.value.minute) / 60) + initialOffsetPx
}

function getTimeFromOffsetY(offsetY: number, round: number = increment.minutes): Temporal.PlainTime {
  let hourFractional = ((offsetY - lineOverlap) / hourGapPx) + startTime.value.hour
  let hourInt = Math.floor(hourFractional)
  let minutes = Math.round(((60 * (hourFractional - hourInt)) / round)) * round
  if (minutes === 60) {
    minutes = 0;
    hourInt++
  }
  return new Temporal.PlainTime(hourInt, minutes)
}


const totalHeight = computed<number>(() => getTimeOffsetPx(endTime.value))

function mouseDown(day: Temporal.PlainDate, e: MouseEvent) {
  let t = getTimeFromOffsetY(e.offsetY)
  newBooking.state = "mouse-down"
  newBooking.startTime = getTimeFromOffsetY(e.offsetY)
  newBooking.endTime = getTimeFromOffsetY(e.offsetY + (minBooking.minutes / 60) * hourGapPx)
  newBooking.date = day
  for (let booking of displayedBookings.value) {
    if (booking.date === day.toString()) {
      if (Temporal.PlainTime.compare(Temporal.PlainTime.from(booking.startTime), newBooking.startTime) <= 0 && Temporal.PlainTime.compare(Temporal.PlainTime.from(booking.endTime), newBooking.startTime) > 0) {
        newBooking.reset()
        return
      }
    }
  }
  if (Temporal.Duration.compare(t.until(newBookingEndLimit.value), minBooking) < 0 || Temporal.PlainTime.compare(t, startTime.value) < 0) {
    newBooking.reset()
    return
  }
}

function mouseUp(day: Temporal.PlainDate, e: MouseEvent) {
  if (newBooking.state === "mouse-down") {
    newBooking.state = "in-form"
    modalOpen.value = true
  }
}

function mouseMove(day: Temporal.PlainDate, e: MouseEvent) {
  if (newBooking.state === "mouse-down") {
    let newEnd = getTimeFromOffsetY(e.offsetY)

    if (Temporal.Duration.compare(newBooking.startTime!.until(newEnd), minBooking) >= 0) {

      if (Temporal.PlainTime.compare(newBookingEndLimit.value, newEnd) >= 0) {
        newBooking.endTime = newEnd
      } else {
        newBooking.endTime = newBookingEndLimit.value
      }
    }
  }
}

const modalOpen = ref(false)


</script>

<template>
  <div class="wrapper my-4 container-fluid bg-white py-5 card px-0" @keydown.esc="newBooking.reset()" tabindex="0">
    <!-- actions bar -->
    <div class="controls container-fluid card bg-light border-2 p-2">
      <div class="row justify-content-end">
        <div class="col-4 my-auto">
          <div class="row">
            <div class="col-7">
              <select class="form-select text-bg-white" v-model="activeCourtId">
                <option v-for="court in allCourts" :value="court.id">{{ court.name }}</option>
              </select>
            </div>
            <div class="col-5">
              <button v-if="!firstDisplayedDay.equals(getMonday(today))" class="btn btn-outline-primary"
                      @click="jumpViewToThisWeek">Jump to today
              </button>
            </div>
          </div>

        </div>
        <div class="col-4 text-center">
          <div class="btn-group mx-0">
            <button class="btn" @click="shiftViewByNumDays(-7)">
              <i class="bi bi-chevron-left"></i>
            </button>
            <button class="btn fs-5" style="min-width: 200px">
                <span v-if="displayedWeek[0].month ===  displayedWeek[6].month">
                {{ months[firstDisplayedDay.month - 1] }}
              </span>
              <span v-else>
                {{ monthsShort[firstDisplayedDay.month - 1] }}
                <span v-if="displayedWeek[0].year !== displayedWeek[6].year">{{ displayedWeek[0].year }}</span>
                - {{ monthsShort[displayedWeek[6].month - 1] }}
              </span>
              <span> {{ " " + displayedWeek[6].year }}</span>
            </button>
            <button class="btn" @click="shiftViewByNumDays(7)">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>

        </div>
        <div class="col-4 my-auto">
          <button class="btn btn-danger float-end" data-bs-toggle="modal"
                  data-bs-target="#bookingModal">New booking
          </button>
        </div>
      </div>
    </div>

    <!-- calendar -->
    <div class="outer-container container-fluid" :style="{height: totalHeight + hourGapPx + 'px'}">

      <div class="row g-0">
        <div class="hLine" v-for="time in timeLabels" :style="{top: getTimeOffsetPx(time) + 'px'}"></div>
        <div class="col-1">
          <div class="timeLabel" v-for="time in timeLabels" :style="{top: getTimeOffsetPx(time) + 'px'}">
            {{ getTimeString(time, display24hr) }}
          </div>
        </div>
        <div class="col" v-for="day in displayedWeek">
          <div class="position-relative text-center" :class="{'text-danger': isToday(day), 'fw-bold': isToday(day)}"
               :style="{top: `calc( ${initialOffsetPx}px - 100%)`}">
            <span class="fs-6">{{ daysShort[day.dayOfWeek - 1].toUpperCase() }} </span>
            <p class="fs-3">{{ day.day }}</p></div>
          <div class="vLine bookingArea" @mousedown="mouseDown(day, $event)" @mousemove="mouseMove(day, $event)"
               @mouseup="mouseUp(day, $event)"
               :style="{top: initialOffsetPx - lineOverlap + 'px', height: totalHeight - initialOffsetPx + 4 * lineOverlap + 'px', cursor: newBooking.state === 'mouse-down' ? 'ns-resize' : newBooking.state === 'idle' ? 'grab' : 'default'}"></div>
          <div class="vLine"
               :style="{top: initialOffsetPx - lineOverlap + 'px', height: totalHeight - initialOffsetPx + 2 * lineOverlap + 'px'}"
               :class="{vLineHighlight: isVLineHighlighted(day)}"></div>
          <div class="booking-container px-1"
               @mouseup="mouseUp(day, $event)"
               @mousemove="mouseMove(day, $event)"
               v-for="booking in displayedBookings.filter(b => Temporal.PlainDate.from(b.date).equals(day))"
               :style="{top: getTimeOffsetPx(Temporal.PlainTime.from(booking.startTime)) + 'px', height: getTimeOffsetPx(Temporal.PlainTime.from(booking.endTime)) - getTimeOffsetPx(Temporal.PlainTime.from(booking.startTime)) + 'px'}">
            <div class="booking card"
                 :class="userStore.user?.id == booking.user.id ? 'bg-success-subtle' : 'bg-dark-subtle'">
              <div class="card-body p-1 d-flex flex-column justify-content-between"
              >
                <div style="font-size: 11pt">
                  <div class="mb-1">
                    <span class="fw-bold">{{
                        getTimeString(Temporal.PlainTime.from(booking.startTime), display24hr)
                      }} - {{ getTimeString(Temporal.PlainTime.from(booking.endTime), display24hr) }}</span>
                    <button v-if="userStore.user?.id === booking.user.id" class="btn-close float-end"
                            style="font-size: 10pt;"></button>
                  </div>
                  <p class="mb-0">{{ booking.description }}</p>
                </div>
                <div style="font-size: 9pt; line-height: 1em;">
                  <p class="mb-1 fst-italic"><i class="bi bi-person-fill"></i>
                    {{ booking.user.firstName + " " + booking.user.lastName }} <span
                        class="font-monospace fst-normal text-primary">({{
                        userStore.user?.id === booking.user.id ? 'you' : booking.user.email.split('@')[0]
                      }})</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="booking-container px-1"
               v-if="newBooking.state !== 'idle' && newBooking.date!.equals(day)"
               :style="{top: getTimeOffsetPx(newBooking.startTime!) + 'px', height: getTimeOffsetPx(newBooking.endTime!) - getTimeOffsetPx(newBooking.startTime!) + 'px'}">
            <div class="tempBooking card bg-info-subtle py-0 px-1 is-bold  border-test">
              <div class="card-body p-1 d-flex flex-column justify-content-between">
                <div class="fw-bold fs-6 text-center">{{ getTimeString(newBooking.startTime!, display24hr) }} -
                  {{ getTimeString(newBooking.endTime!, display24hr) }}
                </div>
                <div class="align-self-center text-center fw-bold" v-if="newBooking.state==='mouse-down'">
                  <p class="mb-0">release to confirm</p>
                  <p>hit <span class="text-danger bg-light p-1 rounded">esc</span> to cancel</p>
                  <i class="bi bi-arrow-down fs-3" style="line-height: 0;"></i>
                </div>
                <div class="align-self-center" v-if="newBooking.state==='in-form'">
                  <div class="confirmButtons mb-2">
                    <i class="bi bi-check2 fs-4 bg-success rounded px-1 mx-2 text-white"></i>
                    <i class="bi bi-x-lg fs-4 bg-danger rounded px-1 mx-2 text-white" @click="newBooking.reset()"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="currTimeLine"
               v-if="isToday(day) && Temporal.PlainTime.compare(startTime, now) <= 0 && Temporal.PlainTime.compare(endTime, now) >= 0"
               :style="{top: getTimeOffsetPx(now) + 'px'}">
          </div>
        </div>
        <div class="col-1">
          <div class="vLine end"
               :style="{top: initialOffsetPx - lineOverlap + 'px', height: totalHeight - initialOffsetPx + 2 * lineOverlap + 'px'}"></div>
          <div class="timeLabel" v-for="time in timeLabels" :style="{top: getTimeOffsetPx(time) + 'px'}">
            {{ getTimeString(time, display24hr) }}
          </div>
        </div>
      </div>
    </div>
    <BookingModal id="bookingModal"></BookingModal>
  </div>
</template>

<style scoped>
.hLine {
  position: absolute;
  border-bottom: 1px dashed grey;
  width: calc(100% * 10 / 12 + 1vw);
  left: calc(100% / 12 - 0.5vw);
}

.vLine {
  position: absolute;
  border-left: 1px solid grey;
  border-right: none;
  width: calc(100% * (10 / (12 * 7)));
}

.end {
  width: auto;
}

.bookingArea {
  border: none;
  z-index: 20;
  background: transparent;
}

.vLineHighlight {
  border-right: solid;
  border-color: hsl(348, 100%, 61%);
  border-width: 3px;
  width: calc(100% * (10 / (12 * 7)));
}

.timeLabel {
  position: absolute;
  transform: translate(0, -0.7em);
  text-align: center;
  width: calc(100% / 12);
}

.booking {
  height: 100%;
  line-height: 0.9em;
}

.booking-form {
  max-width: 400px;
}

.tempBooking {
  height: 100%;
  border-style: dashed;
  font-size: 10pt;
}

.is-bold {
  font-weight: bold;
}

.currTimeLine {
  width: calc(100% * (10 / (12 * 7)));
  position: absolute;
  border-bottom: 4px solid hsl(204, 86%, 53%);
}

.outer-container {
  position: relative;
}

.booking-container {
  position: absolute;
  width: calc(100% * (10 / (12 * 7)) - 2px);
}

.wrapper {
  user-select: none;
  max-width: 1500px;
  min-width: 1000px;
}

.btn-close {
  position: absolute;
  z-index: 50;
  top: 0.2em;
  right: 0.2em;
}

.confirmButtons {
  position: relative;
  z-index: 50;
  cursor: pointer;
}

.controls {
  position: sticky;
  top: 50px;
  z-index: 50;
  max-width: calc(min(100vw, 1200px));
  right: 0;
  left: 0;
}

.border-test {
  background-image: linear-gradient(90deg, #1350ef 50%, transparent 50%), linear-gradient(90deg, #1350ef 50%, transparent 50%), linear-gradient(0deg, #1350ef 50%, transparent 50%), linear-gradient(0deg, #1350ef 50%, transparent 50%);
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 30px 3px, 30px 3px, 3px 30px, 3px 30px;
  background-position: left top, right bottom, left bottom, right top;
  animation: border-dance 0.5s infinite linear;
}

@keyframes border-dance {
  0% {
    background-position: left top, right bottom, left bottom, right top;
  }
  100% {
    background-position: left 30px top, right 30px bottom, left bottom 30px, right top 30px;
  }
}
</style>