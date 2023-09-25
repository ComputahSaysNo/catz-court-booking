<script setup lang="ts">

// external dependencies
import {useQuery} from "@vue/apollo-composable"
import {computed, ref, watch} from "vue";
import {Temporal} from "temporal-polyfill";

// src utils
import {ALL_BOOKINGS, ALL_COURTS} from "@/queries";
import {getMonday, getWeek, isToday, getTimeString} from "@/utils/datetime";
import type {Court, Booking} from "@/types"


// stores
import {useUserStore} from "@/stores/user";
import {useNewBookingStore} from "@/stores/newBooking";
import {useSettingsStore} from "@/stores/settings";

const currentUser = useUserStore()
const newBooking = useNewBookingStore()
const settings = useSettingsStore()

// useful consts
const today = Temporal.Now.plainDateISO()
const now = Temporal.Now.plainTimeISO()
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


// graphics options
const hourGapPx = 100 // height of one hour

const vLineOverflowPx = 40 // the amount the vertical lines extend past the top and bottom


// TODO: move both of these to per-court parameters
// TODO: add max booking length
const minBooking = Temporal.Duration.from({hours: 0, minutes: 60})
const maxBooking = Temporal.Duration.from({hours: 3, minutes: 0})
const increment = Temporal.Duration.from({hours: 0, minutes: 30})

// Queries =============================================================================================================
// These are executed on component load


// 1. Courts
const q1 = useQuery(ALL_COURTS).result
const allCourts = computed<Court[]>(() => q1.value?.allCourts ?? []) // is [] until the list loads from server


// 2. Bookings
const q2 = useQuery(ALL_BOOKINGS).result
const allBookings = computed<Booking[]>(() => q2.value?.allBookings ?? [])

const displayedBookings = computed<Booking[]>(() => { // bookings on the screen (saves some compute time to have this preloaded)
  return allBookings.value.filter((obj) => {
    if (obj.court.id !== activeCourtId.value) {
      return false
    }
    let d = Temporal.PlainDate.from(obj.date)
    return Temporal.PlainDate.compare(displayedWeek.value[0], d) <= 0 && Temporal.PlainDate.compare(displayedWeek.value[6], d) >= 0
  })
})


// Refs and interactivity===============================================================================================

// 1. Active court
const activeCourtId = ref(1) // v-model into dropdown

const activeCourt = computed<Court | null>(() => {
  if (allCourts) {
    return allCourts.value.find(obj => obj.id === activeCourtId.value) ?? null
  } else {
    return null
  }
})

watch(allCourts, () => {
  activeCourtId.value = allCourts.value[0].id
})

// since the Court type stores times as ISO strings rather than Temporal.PlainTime, define these two computeds
// to avoid having to convert them all the time

const activeCourtOpeningTime = computed<Temporal.PlainTime>(() => {
  if (activeCourt.value) {
    return Temporal.PlainTime.from(activeCourt.value?.openingTime)
  } else {
    return new Temporal.PlainTime(7, 0) // default opening time before court info loads
  }
})

const activeCourtClosingTime = computed<Temporal.PlainTime>(() => {
  if (activeCourt.value) {
    return Temporal.PlainTime.from(activeCourt.value?.closingTime)
  } else {
    return new Temporal.PlainTime(22, 0) // default closing time before court info loads
  }
})

watch(activeCourtId, () => {
  // reset any temp booking we've made if the selected court changes
  newBooking.reset()
  newBooking.court = activeCourt.value
})

// 2. Current week in calendar

const firstDisplayedDay = ref<Temporal.PlainDate>(getMonday(today)) // the leftmost displayed day (initialise to the monday of this week)
const displayedWeek = computed<Temporal.PlainDate[]>(() => { // rest of the week
  return getWeek(firstDisplayedDay.value)
})

function shiftViewByNumDays(n: number): void {
  firstDisplayedDay.value = firstDisplayedDay.value.add({days: n})
}

function jumpViewToThisWeek(): void {
  firstDisplayedDay.value = getMonday(today)
}

// 3. Time labels

const timeLabels = computed<Temporal.PlainTime[]>(() => { // list (of Temporal.PlainTimes) of the values to go down the side
      let t: Temporal.PlainTime[] = [activeCourtOpeningTime.value] // always start at the opening time, even if it's not a whole hour
      for (let i = activeCourtOpeningTime.value.hour + 1; i <= activeCourtClosingTime.value.hour; i++) { // add every whole hour up to closing
        t.push(new Temporal.PlainTime(i, 0))
      }
      if (activeCourtClosingTime.value.minute !== 0) {
        t.push(activeCourtClosingTime.value) // manually add closing time if it's not a whole hour
      }
      return t
    }
)


// Calendar display helper functions ===================================================================================
// These enable click-and-drag event creation

// Pass this as the top: parameter in CSS to set an event at the right height
function getTimeOffsetPx(time: Temporal.PlainTime): number {
  return hourGapPx * ((time.hour - activeCourtOpeningTime.value.hour) + (time.minute - activeCourtOpeningTime.value.minute) / 60)
}

// Given an OffsetY (coord within parent element, easy to get from MouseEvent), works out the corresponding time
// Also rounds to the given increment

function getTimeFromOffsetY(offsetY: number, round: number = increment.minutes): Temporal.PlainTime {
  let hourFractional = ((offsetY - vLineOverflowPx) / hourGapPx) + activeCourtOpeningTime.value.hour
  let hourInt = Math.floor(hourFractional)
  let minutes = Math.round(((60 * (hourFractional - hourInt)) / round)) * round
  if (minutes === 60) {
    minutes = 0;
    hourInt++
  }
  return new Temporal.PlainTime(hourInt, minutes)
}

const totalHeight = computed<number>(() => getTimeOffsetPx(activeCourtClosingTime.value))

const modalOpen = ref(false)


// Booking logic =======================================================================================================

// For a given start time and day, find the latest that booking could end
// It's not super optimal to call this on every MouseMove since limit won't change until the start time changes
// But hopefully the user isn't spamming bookings enough that this is an issue

function getLatestEndTime(startTime: Temporal.PlainTime, day: Temporal.PlainDate): Temporal.PlainTime {

  // initialise to the court's closing time
  let limit = activeCourtClosingTime.value

  // replace limit by the EARLIEST START TIME of any bookings on this day WHICH START AFTER OURS, if any

  for (let booking of displayedBookings.value) {
    const existingBookingStartTime = Temporal.PlainTime.from(booking.startTime) // Type Booking stores times as strings! (Apollo query result)
    // Check date
    if (booking.date === day.toString()) {
      // Check this booking starts after ours
      if (Temporal.PlainTime.compare(existingBookingStartTime, startTime) > 0) {
        // update limit if it's just moved earlier
        if (Temporal.PlainTime.compare(existingBookingStartTime, limit) < 0) {
          limit = existingBookingStartTime
        }
      }
    }
  }

  return limit
}


// Given a certain start time and day, validate an end time

function isValidEndTime(endTime: Temporal.PlainTime, startTime: Temporal.PlainTime, day: Temporal.PlainDate): boolean {

  // 1. return false if the end time is after closing
  if (Temporal.PlainTime.compare(endTime, activeCourtClosingTime.value) > 0) {
    return false
  }

  // 2. return false if the booking is too long
  if (Temporal.Duration.compare(startTime.until(endTime), maxBooking) > 0) {
    return false
  }

  // 3. return false if the resultant booking is shorter than the minimum booking
  if (Temporal.Duration.compare(startTime.until(endTime), minBooking) < 0) {
    return false
  }

  // 4. work out when the latest the end time could be is
  const limit = getLatestEndTime(startTime, day)

  // 5. return false if the end time is past this limit
  if (Temporal.PlainTime.compare(endTime, limit) > 0) {
    return false
  }

  // 6. otherwise, we're good
  return true

}

// Validate a start time (needs to account for when it could end according to minBooking)
function isValidStartTime(startTime: Temporal.PlainTime, day: Temporal.PlainDate): boolean {
  // return false if start time is before court opening
  if (Temporal.PlainTime.compare(activeCourtOpeningTime.value, startTime) > 0) {
    return false
  }

  // return false if start time is inside another booking
  for (let booking of displayedBookings.value) {
    if (booking.date === day.toString()) {
      if (Temporal.PlainTime.compare(Temporal.PlainTime.from(booking.startTime), startTime) <= 0 && Temporal.PlainTime.compare(Temporal.PlainTime.from(booking.endTime), startTime) > 0) {
        return false
      }
    }
  }
  // return false if start time + min booking duration is not a valid end time (inside a booking or after closing)
  if (!isValidEndTime(startTime.add(minBooking), startTime, day)) {
    return false
  }

  // otherwise, we're good
  return true
}


// Event handlers ======================================================================================================

function calendarMouseDown(day: Temporal.PlainDate, e: MouseEvent) {
  if (!currentUser.isAuthenticated) {
    return
  } // must be logged in to make bookings
  const proposedStartTime = getTimeFromOffsetY(e.offsetY)
  if (isValidStartTime(proposedStartTime, day)) {
    newBooking.state = "mouse-down"
    newBooking.startTime = proposedStartTime
    newBooking.endTime = proposedStartTime.add(minBooking)
    newBooking.date = day
    bookingStartIndicator.value.visible = false
  }
}

function calendarMouseUp() {
  if (newBooking.state === "mouse-down") {
    newBooking.state = "in-form"
    modalOpen.value = true
  }
}

const bookingStartIndicator = ref({day: today, time: activeCourtOpeningTime.value, visible: false})

function calendarMouseMove(day: Temporal.PlainDate, e: MouseEvent) {
  const newTime = getTimeFromOffsetY(e.offsetY)

  // if user is making a new booking, try to update the end time
  if (newBooking.state === "mouse-down") {

    // skip if we've not moved the end time (which, due to time increment rounding to 30 min, is true for the majority of mouse events)
    if (newTime.equals(newBooking.endTime!)) {
      return
    }

    if (isValidEndTime(newTime, newBooking.startTime!, newBooking.date!)) {
      newBooking.endTime = newTime
    }
  }

  // otherwise update the start time indicator
  if (newBooking.state === "idle" && currentUser.isAuthenticated) {
    if (isValidStartTime(newTime, day)) {
      if (!bookingStartIndicator.value.visible || !bookingStartIndicator.value.time.equals(newTime) || !bookingStartIndicator.value.day.equals(day)) {
        bookingStartIndicator.value.time = newTime
        bookingStartIndicator.value.day = day
        bookingStartIndicator.value.visible = true
      }
    }
  }
}

document.addEventListener('keyup', (e) => {
  if (e.key === "Escape") {
    newBooking.state = 'idle'
  }
})

</script>

<template>
  <div class="outerWrapper container-fluid card pb-5 px-0 my-4" @mouseup="calendarMouseUp">

    <!-- Sticky top section with calendar controls and date labels -->
    <div class="top bg-white mb-2">

      <div class="controls container-fluid card bg-light my-5">

        <div class="row justify-content-end">

          <div class="col-4 my-auto">
            <div class="input-group">
              <span class="input-group-text text-bg-dark">Court: </span>
              <select class="form-select form-control" v-model="activeCourtId" style="max-width: 250px">
                <option v-for="court in allCourts" :value="court.id">{{ court.name }}</option>
              </select>
            </div>
          </div>

          <div class="col-4 text-center">
            <div class="btn-group mx-0">
              <button class="btn" @click="shiftViewByNumDays(-7)">
                <i class="bi bi-chevron-left fs-3"></i>
              </button>
              <button class="btn fs-5 fw-bold" style="min-width: 200px">
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
                <i class="bi bi-chevron-right fs-3"></i>
              </button>
            </div>
          </div>

          <div class="col-4 my-auto">
            <button v-if="!(firstDisplayedDay.equals(getMonday(today)))" class="btn btn-primary float-end"
                    @click="jumpViewToThisWeek">Jump to this week
            </button>
          </div>

        </div>

      </div>


      <div class="dayLabels container-fluid">

        <div class="row g-0">

          <div class="col-1"></div>

          <div class="col" v-for="day in displayedWeek">
            <div class="dayLabel position-relative text-center"
                 :class="{'text-danger': isToday(day), 'fw-bold': isToday(day)}">
              <span class="fs-6">{{ daysShort[day.dayOfWeek - 1].toUpperCase() }} </span>
              <p class="fs-3 mb-0">{{ day.day }}</p></div>
          </div>

          <div class="col-1"></div>

        </div>

      </div>

    </div>

    <!-- Calendar body-->
    <div class="main container-fluid" :style="{height: totalHeight + hourGapPx + 'px'}"
         @mouseout="()=>{bookingStartIndicator.visible=false}">

      <!-- Everything is in this row, with structure col-1 | (col) x 7 | col-1 -->
      <div class="row g-0">

        <!-- Horizontal lines-->
        <div class="hLine" v-for="time in timeLabels" :style="{top: getTimeOffsetPx(time) + 'px'}"></div>

        <!-- Time labels-->
        <div class="col-1">
          <div class="timeLabel" v-for="time in timeLabels" :style="{top: getTimeOffsetPx(time) + 'px'}">
            {{ getTimeString(time, settings.timeFormat24h) }}
          </div>
        </div>

        <!-- Column containing bookings. Borders provide the vertical lines and can be highlighted for current day -->
        <div class="col dayColumn" v-for="(columnDay, index) in displayedWeek">

          <div class="inner"
               @mousedown="calendarMouseDown(columnDay, $event)"
               @mousemove="calendarMouseMove(columnDay, $event)"
               @mouseup="calendarMouseUp()"
               :style="{top: `${-vLineOverflowPx}px`, height: `${totalHeight + 2 * vLineOverflowPx}px`,
                        cursor: !currentUser.isAuthenticated ? 'default' : newBooking.state === 'mouse-down' ? 'ns-resize' : newBooking.state === 'idle' ? 'grab' : 'default'}"
               :class="{borderHighlight: isToday(columnDay), last: index===7-1}">
          </div> <!--overflows a bit past totalHeight to make the vertical lines extend past the top a little -->

          <!-- Bookings. Set height and vertical position using the functions in <script>, based on its start/end time -->
          <div class="bookingContainer px-1"
               v-for="booking in displayedBookings.filter(b => Temporal.PlainDate.from(b.date).equals(columnDay))"
               :style="{top: `${getTimeOffsetPx(Temporal.PlainTime.from(booking.startTime))}px`,
                        height: `${getTimeOffsetPx(Temporal.PlainTime.from(booking.endTime)) - getTimeOffsetPx(Temporal.PlainTime.from(booking.startTime))}px`}">

            <div class="booking card"
                 :class="currentUser.user?.id === booking.user.id ? 'bg-success-subtle' : 'bg-dark-subtle'">

              <div class="card-body p-1 d-flex flex-column justify-content-between">

                <div> <!-- At the top of the card: Time, description, close button -->

                  <div class="mb-1">

                    <span class="fw-bold">
                      {{ getTimeString(Temporal.PlainTime.from(booking.startTime), settings.timeFormat24h) }}
                      -
                      {{ getTimeString(Temporal.PlainTime.from(booking.endTime), settings.timeFormat24h) }}
                    </span>

                    <!-- Delete button IF this is the logged in user's booking (action will also be validated in backend) -->
                    <button v-if="currentUser.user?.id === booking.user.id"
                            class="deleteButton btn-close float-end">
                    </button>
                  </div>

                  <p class="mb-0">{{ booking.description }}</p>

                </div>

                <!-- At the bottom: name, email -->
                <div style="font-size: 9pt; line-height: 1em;">

                  <p class="mb-1 fst-italic">

                    <i class="bi bi-person-fill"></i>
                    {{ booking.user.firstName + " " + booking.user.lastName }}
                    <span class="font-monospace fst-normal text-primary">
                      ({{ currentUser.user?.id === booking.user.id ? 'you' : booking.user.email.split('@')[0] }})
                    </span>

                  </p>

                </div>

              </div>

            </div>

          </div>

          <!-- New booking indicator. Calculate height/position in the same way as the actual bookings -->
          <div class="bookingContainer px-1"
               v-if="newBooking.state !== 'idle' && newBooking.date!.equals(columnDay)"
               :style="{top: getTimeOffsetPx(newBooking.startTime!) + 'px',
                        height: getTimeOffsetPx(newBooking.endTime!) - getTimeOffsetPx(newBooking.startTime!) + 'px'}">

            <div class="newBooking card bg-warning-subtle py-0 px-1 is-bold  border-dash-animation">

              <div class="card-body py-1 px-0 d-flex flex-column justify-content-between">

                <!-- Top -->
                <div class="fw-bold fs-6 text-center">
                  <!-- Ok to non-null assert these due to the v-if in bookingContainer -->
                  {{ getTimeString(newBooking.startTime!, settings.timeFormat24h) }}
                  -
                  {{ getTimeString(newBooking.endTime!, settings.timeFormat24h) }}
                  <p v-if="Temporal.Duration.compare(newBooking.duration!, maxBooking)===0 && newBooking.state==='mouse-down'" class="small text-danger">
                    max booking length: {{maxBooking.hours}}h<span v-if="maxBooking.minutes!==0">{{maxBooking.minutes}}m</span>
                  </p>
                </div>

                <!-- Bottom -->
                <div class="align-self-center text-center fw-bold" v-if="newBooking.state==='mouse-down'">

                  <p class="mb-0">drag down to set time </p>
                  <p class="mb-2">or hit <span class="text-danger bg-light p-1 rounded">esc</span> to cancel</p>
                </div>


                <!-- Confirmation dialog after user releases mouse -->
                <div v-if="newBooking.state==='in-form'">
                  <div class="confirmButtons d-flex justify-content-evenly px-0 mb-2 rounded">
                    <button class="bi bi-check2 fs-4 bg-success rounded px-2 text-white"></button>
                    <button class="bi bi-x-lg fs-4 bg-danger rounded px-2 text-white"
                            @click="newBooking.reset()"></button>
                  </div>

                </div>

              </div>

            </div>

            <div v-if="newBooking.state==='in-form'" class="descriptionInput mt-1 border border-3 border-dark rounded"
                 style="">
                    <textarea v-model="newBooking.description" type="text" class="form-control form-control-sm"
                              placeholder="Description (optional)"
                              style="z-index:40;position:relative;font-size:10pt;">
                    </textarea>
            </div>

          </div>

          <!-- indicator displaying the current time on the calendar area. Currently ISN'T reactive to reduce performance impact -->
          <div class="currTimeLine"
               v-if="isToday(columnDay) && Temporal.PlainTime.compare(activeCourtOpeningTime, now) <= 0 && Temporal.PlainTime.compare(activeCourtClosingTime, now) >= 0"
               :style="{top: getTimeOffsetPx(now) + 'px'}">
          </div>

          <!-- shows if the user can make a booking from where their cursor is currently -->
          <div class="startBookingLine text-center"
               v-if="currentUser.isAuthenticated && bookingStartIndicator.visible && newBooking.state==='idle' && columnDay.equals(bookingStartIndicator.day)"
               :style="{top: getTimeOffsetPx(bookingStartIndicator.time) + 'px'}">
            <i class="bi bi-arrow-down position-relative fs-2" style="top: 0;"></i>
          </div>

        </div>

        <!-- Right-hand time labels -->
        <div class="col-1">

          <div class="timeLabel" v-for="time in timeLabels" :style="{top: getTimeOffsetPx(time) + 'px'}">
            {{ getTimeString(time, settings.timeFormat24h) }}
          </div>

        </div>

      </div>

    </div>

  </div>

</template>

<style scoped lang="scss">
$highlightColor: hsl(348, 100%, 61%);
$dayColumnWidth: calc(100% * (10 / (12 * 7)));

.outerWrapper {
  user-select: none;
  max-width: 1500px;
  min-width: 1000px;

  .top {
    position: sticky;
    top: 0;
    z-index: 50;
    border-radius: 5px;

    .controls {
      max-width: calc(min(96vw, 1200px));

    }

  }

  .main {
    position: relative;

    .timeLabel {
      position: absolute;
      transform: translate(0, -0.7em);
      text-align: center;
      width: calc(100% / 12);
    }

    .hLine {
      position: absolute;
      border-bottom: 1px dashed #c1c1c1;
      width: calc(100% * 10 / 12 + 1vw);
      left: calc(100% / 12 - 0.5vw);
    }


    .dayColumn {
      .inner {
        position: absolute;
        width: $dayColumnWidth;
        border-left: 1px solid grey;
        z-index: 10;


      }

      .last {
        border-right: 1px solid grey;
      }

      .borderHighlight {
        border-left: 3px solid $highlightColor;
        border-right: 3px solid $highlightColor;
        z-index: 20;
      }

      .bookingContainer {
        position: absolute;
        width: calc($dayColumnWidth - 2px);

        .booking {
          height: 100%;
          line-height: 0.9em;
          font-size: 11pt;

          .deleteButton {
            position: relative;
            z-index: 40;
            font-size: 10pt;
          }
        }

        .newBooking {
          height: 100%;
          font-size: 10pt;


          .confirmButtons {
            position: relative;
            z-index: 40;
          }

        }
      }

      .currTimeLine {
        width: calc(100% * (10 / (12 * 7)));
        position: absolute;
        z-index: 0;
        border-bottom: 4px solid $highlightColor;
      }

      .startBookingLine {
        width: calc($dayColumnWidth - 2px);
        position: absolute;
        border-top: 2px solid black;
      }
    }


  }

}


.border-dash-animation {
  background-image: linear-gradient(90deg, black 50%, transparent 50%), linear-gradient(90deg, black 50%, transparent 50%), linear-gradient(0deg, black 50%, transparent 50%), linear-gradient(0deg, black 50%, transparent 50%);
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