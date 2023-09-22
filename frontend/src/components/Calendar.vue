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
    return allCourts.value.find(obj => obj.id === activeCourtId.value)
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

const tempBooking = ref({
  startTime: new Temporal.PlainTime(10, 0),
  endTime: new Temporal.PlainTime(12, 0),
  date: today,
  court: activeCourtId.value
})
const tempBookingState = ref(0)

watch(activeCourtId, () => {
  newBooking.reset()
  newBooking.courtId = activeCourtId.value
  tempBooking.value = {
    startTime: new Temporal.PlainTime(10, 0),
    endTime: new Temporal.PlainTime(12, 0),
    date: today,
    court: activeCourtId.value
  }
  tempBookingState.value = 0
})

const tempBookingEndLimit = computed<Temporal.PlainTime>(() => {
  if (tempBookingState.value === 0) {
    return endTime.value
  } else {
    let earliestLimit = endTime.value
    for (let booking of displayedBookings.value) {
      const bookingStartTime = Temporal.PlainTime.from(booking.startTime)
      if (booking.date === tempBooking.value.date.toString()) {
        if (Temporal.PlainTime.compare(bookingStartTime, tempBooking.value.startTime) > 0) {
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
  tempBookingState.value = 1
  tempBooking.value.startTime = getTimeFromOffsetY(e.offsetY)
  tempBooking.value.endTime = getTimeFromOffsetY(e.offsetY + (minBooking.minutes / 60) * hourGapPx)
  tempBooking.value.date = day
  for (let booking of displayedBookings.value) {
    if (booking.date === day.toString()) {
      if (Temporal.PlainTime.compare(Temporal.PlainTime.from(booking.startTime), tempBooking.value.startTime) <= 0 && Temporal.PlainTime.compare(Temporal.PlainTime.from(booking.endTime), tempBooking.value.startTime) > 0) {
        tempBookingState.value = 0
        return
      }
    }
  }
  if (Temporal.Duration.compare(t.until(tempBookingEndLimit.value), minBooking) < 0 || Temporal.PlainTime.compare(t, startTime.value) < 0) {
    tempBookingState.value = 0
    return

  }
}

function mouseUp(day: Temporal.PlainDate, e: MouseEvent) {
  if (tempBookingState.value === 1) {
    tempBookingState.value = 2
    modalOpen.value = true
  }
}

function mouseMove(day: Temporal.PlainDate, e: MouseEvent) {
  if (tempBookingState.value === 1) {
    let newEnd = getTimeFromOffsetY(e.offsetY)

    if (Temporal.Duration.compare(tempBooking.value.startTime.until(newEnd), minBooking) >= 0) {

      if (Temporal.PlainTime.compare(tempBookingEndLimit.value, newEnd) >= 0) {
        tempBooking.value.endTime = newEnd
      } else {
        tempBooking.value.endTime = tempBookingEndLimit.value
      }
    }
  }
}

function mouseOut(day: Temporal.PlainDate, e: MouseEvent) {
  if (tempBookingState.value === 1) {
    tempBookingState.value = 0
  }
}

const modalOpen = ref(false)

function clearBooking() {
  tempBookingState.value = 0
  modalOpen.value = false
}

</script>

<template>
  <div class="wrapper bg-white py-5 m-4 card" @mouseleave="tempBookingState=0"  @keydown.esc="tempBookingState=0" tabindex="0" >
    <!-- actions bar -->
    <div class="container-xxl card bg-light border-2 p-2" style="position: sticky; top: 50px; z-index: 50">
      <div class="row justify-content-end">
        <div class="col-4 my-auto">
          <div class="row">
            <div class="col-7">
              <select class="form-select" v-model="activeCourtId">
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
          <div class="btn-group">
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
          <button v-if="userStore.isAuthenticated" class="btn btn-danger float-end" data-bs-toggle="modal"
                  data-bs-target="#bookingModal">New booking
          </button>
        </div>
      </div>
    </div>

    <!-- calendar -->
    <div class="outer-container container-fluid" :style="{height: totalHeight + hourGapPx + 'px'}" >

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
               :style="{top: initialOffsetPx - lineOverlap + 'px', height: totalHeight - initialOffsetPx + 4 * lineOverlap + 'px', cursor: tempBookingState === 1 ? 'ns-resize' : 'grab'}"></div>
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
              <div class="card-body py-1 px-1 d-flex flex-column justify-content-between"
              >
                <div style="font-size: 11pt">
                  <div class="mb-1">
                    <span class="fw-bold">{{
                        getTimeString(Temporal.PlainTime.from(booking.startTime), display24hr)
                      }} - {{ getTimeString(Temporal.PlainTime.from(booking.endTime), display24hr) }}</span>
                    <button v-if="userStore.user?.id === booking.user.id" class="btn-close float-end"
                            style="font-size: 10pt;"></button>
                  </div>
                  <p class="mb-2">{{ booking.description }}</p>
                </div>
                <div style="font-size: 9pt; line-height: 0.9em;">
                  <p class="mb-1">{{ booking.user.firstName + " " + booking.user.lastName }} <span
                      class="font-monospace text-primary">({{
                      userStore.user?.id === booking.user.id ? 'you' : booking.user.email.split('@')[0]
                    }})</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="booking-container px-1"
               v-if="tempBookingState !== 0 && tempBooking.date.equals(day)"
               :style="{top: getTimeOffsetPx(tempBooking.startTime) + 'px', height: getTimeOffsetPx(tempBooking.endTime) - getTimeOffsetPx(tempBooking.startTime) + 'px'}">
            <div class="tempBooking card bg-info-subtle py-0 px-1 is-bold  border-test">
              <div class="card-body p-1 d-flex flex-column justify-content-between">
                <div class="fw-bold fs-6 text-center">{{ getTimeString(tempBooking.startTime, display24hr) }} -
                  {{ getTimeString(tempBooking.endTime, display24hr) }}
                </div>
                <div class="align-self-center text-center font-monospace">
                  <p class="mb-0">release to confirm</p>
                  <p>press <span class="text-danger bg-light p-1 rounded">esc</span> to cancel</p>
                  <i class="bi bi-arrow-down fs-3" style="line-height: 0;"></i>
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
    <BookingModal :new-booking="tempBooking" id="bookingModal"></BookingModal>
    <!--    <div class="modal" :class="{'is-active': modalOpen}">-->
    <!--      <div class="modal-background" style="background-color: rgba(10, 10, 10, 0.5)" @click="clearBooking"></div>-->
    <!--      <div class="modal-card booking-form">-->
    <!--        <header class="modal-card-head has-background-dark">-->
    <!--          <p class="modal-card-title has-text-light">Create new booking</p>-->
    <!--        </header>-->
    <!--        <section class="modal-card-body">-->
    <!--          <div class="field">-->
    <!--            <label class="label">Date</label>-->
    <!--            <div class="control">-->
    <!--              <VueDatePicker v-model="tempBooking.date" :enable-time-picker="false" :format="dateFormatUK"-->
    <!--                             :teleport="true" auto-apply :clearable="false"></VueDatePicker>-->
    <!--            </div>-->
    <!--          </div>-->
    <!--          <div class="field">-->
    <!--            <label class="label">Start time</label>-->
    <!--            <div class="control">-->
    <!--              <VueDatePicker v-model="tempBooking.startTime" time-picker :teleport="true" auto-apply-->
    <!--                             :is-24="display24hr" :minutes-increment="incrementMinutes"-->
    <!--                             no-minutes-overlay :min-time="startTime" :max-time="tempBooking.endTime" :clearable="false"></VueDatePicker>-->
    <!--            </div>-->
    <!--          </div>-->
    <!--          <div class="field">-->
    <!--            <label class="label">End time</label>-->
    <!--            <div class="control">-->
    <!--              <VueDatePicker v-model="tempBooking.endTime" time-picker :teleport="true" auto-apply-->
    <!--                             :is-24="display24hr" :minutes-increment="incrementMinutes"-->
    <!--                             no-minutes-overlay :min-time="tempBooking.startTime" :max-time="endTime" :clearable="false"></VueDatePicker>-->
    <!--            </div>-->
    <!--          </div>-->
    <!--        </section>-->
    <!--        <footer class="modal-card-foot">-->
    <!--          <button class="button is-success" @click="confirmBooking">Confirm</button>-->
    <!--          <button class="button is-danger" @click="clearBooking">Cancel</button>-->
    <!--        </footer>-->
    <!--      </div>-->
    <!--    </div>-->
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
  z-index: 10;
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
}

.btn-close {
  position: relative;
  z-index: 50;
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