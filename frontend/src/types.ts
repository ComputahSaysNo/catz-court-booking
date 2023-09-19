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

export type {Court, Booking}