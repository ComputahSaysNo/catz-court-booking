interface Court {
    id: number
    name: string
    openingTime: string
    closingTime: string
}

interface Booking {
    id: number
    court: number
    date: string
    startTime: string
    endTime: string
    description: string
    user: number
}

interface User {
    id: number
    firstName: string
    lastName: string
    email: string
}

export type {Court, Booking, User}