<script setup lang="ts">
import {useQuery} from "@vue/apollo-composable"
import {ALL_BOOKINGS, ALL_COURTS} from "@/queries";
import {Temporal} from "temporal-polyfill";
import {getMonday, getWeek, isToday, getTimeString} from "@/utils/datetime";
import {computed, ref, watch} from "vue";
import type {Court, Booking} from "@/types"
import BookingModal from "@/components/BookingModal.vue"

const display24hr = true
const today = Temporal.Now.plainDateISO()

const q1 = useQuery(ALL_COURTS).result
const allCourts = computed<any[]>(() => q1.value?.allCourts ?? [])
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
const allBookings = computed<any[]>(() => q2.value?.allBookings ?? [])
const displayedBookings = computed<any[]>(() => {
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
  tempBooking.value = {
    startTime: new Temporal.PlainTime(10, 0),
    endTime: new Temporal.PlainTime(12, 0),
    date: today,
    court: activeCourtId.value
  }
  tempBookingState.value = 0
})

// Display stuff
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Magic numbers :/
const hourGapPx = 75
const initialOffsetPx = 100
const lineOverlap = 30

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
  if (Temporal.Duration.compare(t.until(endTime.value), minBooking) >= 0 && Temporal.PlainTime.compare(t, startTime.value) >= 0) {
    tempBookingState.value = 1
    tempBooking.value.startTime = getTimeFromOffsetY(e.offsetY)
    tempBooking.value.endTime = getTimeFromOffsetY(e.offsetY + (minBooking.minutes / 60) * hourGapPx)
    tempBooking.value.date = day
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
    if (Temporal.Duration.compare(tempBooking.value.startTime.until(newEnd), minBooking) >= 0 && Temporal.PlainTime.compare(endTime.value, newEnd) >= 0) {
      tempBooking.value.endTime = newEnd
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
  <div class="wrapper bg-white py-5"> <!-- stops highlighting if buttons are spammed -->
    <!-- actions bar -->
    <div class="container-fluid card px-5 py-2">
      <div class="row justify-content-end">
        <div class="col-4 my-auto">
          <div class="row">
            <div class="col-7">
              <div class="input-group">
                <span class="input-group-text text-bg-dark">Court: </span>
                <select class="form-select" v-model="activeCourtId">
                  <option v-for="court in allCourts" :value="court.id">{{ court.name }}</option>
                </select>
              </div>
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
          <div class="dayLabel text-center" :class="{'text-danger': isToday(day), 'fw-bold': isToday(day)}">
            <span class="fs-6">{{ daysShort[day.dayOfWeek - 1].toUpperCase() }}</span>
            <p class="fs-3">{{ day.day }}</p></div>
          <div class="vLine bookingArea" @mousedown="mouseDown(day, $event)" @mousemove="mouseMove(day, $event)"
               @mouseup="mouseUp(day, $event)"
               :style="{top: initialOffsetPx - lineOverlap + 'px', height: totalHeight - initialOffsetPx + 4 * lineOverlap + 'px'}"></div>
          <div class="vLine"
               :style="{top: initialOffsetPx - lineOverlap + 'px', height: totalHeight - initialOffsetPx + 2 * lineOverlap + 'px'}"
               :class="{vLineHighlight: isVLineHighlighted(day)}"></div>
          <div class="booking-container py-1"
               v-for="booking in displayedBookings.filter(b => Temporal.PlainDate.from(b.date).equals(day))"
               :style="{top: getTimeOffsetPx(Temporal.PlainTime.from(booking.startTime)) + 'px', height: getTimeOffsetPx(Temporal.PlainTime.from(booking.endTime)) - getTimeOffsetPx(Temporal.PlainTime.from(booking.startTime)) + 'px'}">
            <div class="booking text-bg-info card">
              <div class="card-body p-2">
                <p class="fw-bold">{{ getTimeString(booking.startTime, display24hr) }} -
                  {{ getTimeString(booking.endTime, display24hr) }}</p>
                <p class="fst-italic">{{ booking.description }}</p>
                <p>{{ `${booking.user.firstName} ${booking.user.lastName} ${booking.user.email}` }}</p>
              </div>
            </div>
          </div>
          <div class="booking-container p-1"
               v-if="tempBookingState !== 0 && tempBooking.date.equals(day)"
               :style="{top: getTimeOffsetPx(tempBooking.startTime) + 'px', height: getTimeOffsetPx(tempBooking.endTime) - getTimeOffsetPx(tempBooking.startTime) + 'px'}">
            <div class="tempBooking card bg-info-subtle py-0 px-1 is-bold  border-4 border-primary">
              <div class="card-body px-1 py-0">
                <p class="fw-bold fs-6">{{ getTimeString(tempBooking.startTime, display24hr) }} -
                  {{ getTimeString(tempBooking.endTime, display24hr) }}</p>
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
    <div class="container-fluid my-3">
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#bookingModal">
        Launch demo modal
      </button>
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
  width: calc(100% * 10 / 12 + 2vw);
  left: calc(100% / 12 - 1vw);
}

.vLine {
  position: absolute;
  border-left: 1px solid grey;
  border-right: none;
  z-index: 10;
  width: calc(100% * (10 / (12 * 7)));
}

.end {
  width: auto;
}

.bookingArea {
  border: none;
  z-index: 20;
}

.vLineHighlight {
  border-right: solid;
  border-color: hsl(348, 100%, 61%);
  border-width: 3px;
  z-index: 11;
  width: calc(100% * (10 / (12 * 7)));
}

.timeLabel {
  position: absolute;
  transform: translate(0, -0.7em);
  text-align: center;
  width: calc(100% / 12);
}

.dayLabel {
  position: relative;
  top: 1.5em;
}

.booking {
  height: 100%;
  font-size: 10pt;
  line-height: 1em;
}

.booking-form {
  max-width: 400px;
}

.tempBooking {
  height: 100%;
  border-radius: 5px;
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
  z-index: 1;
}

.outer-container {
  position: relative;
}

.booking-container {
  position: absolute;
  width: calc(100% * (10 / (12 * 7)) - 2px);
  z-index: 9;
}

.wrapper {
  user-select: none;
}

</style>