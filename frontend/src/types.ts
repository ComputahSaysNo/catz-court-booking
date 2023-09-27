interface Court {
    id: number
    name: string
    openingTime: string
    closingTime: string
    minBookingLengthMinutes: number
    maxBookingLengthMinutes: number | null
    maxBookingDaysInAdvance: number | null
}

interface Booking {
    id: number
    court: Court
    date: string
    startTime: string
    endTime: string
    description: string
    user: User
}

interface User {
    id: number
    firstName: string
    lastName: string
    email: string
}

export type {Court, Booking, User}