import {Temporal} from "temporal-polyfill";

// Selection of utils for the calendar component
// ALl date/time objects are using the experimental Temporal module which is set to replace JS's Date object soon
// No time zone support yet since all the courts are UK-based (and nobody is booking courts during DST changes)

// Get (as PlainDate) the MOnday of a week containing a given Date
// Returns self if date is a Monday
export function getMonday(date: Temporal.PlainDate): Temporal.PlainDate {
    return date.subtract({days: date.dayOfWeek - 1})
}

export function getWeek(date: Temporal.PlainDate): Temporal.PlainDate[] {
    let week: Temporal.PlainDate[] = []
    let d = date
    for (let i = 0; i < 7; i++) {
        week.push(d)
        d = d.add({days: 1})
    }
    return week
}

export function isToday(date: Temporal.PlainDate, today = Temporal.Now.plainDateISO()): Boolean {
    return today.equals(date)
}

export function getTimeString(time: Temporal.PlainTime, format24h: boolean = true): string {
    if (format24h) {
        return time.toString().slice(0, -3) // remove seconds
    } else {
        let ending = time.hour < 12 ? "AM" : "PM"
        let h = (time.hour > 12 ? (time.hour - 12) : time.hour).toString()
        return `${h}:${time.minute.toLocaleString('en-us', {minimumIntegerDigits: 2})} ${ending}`
    }
}