import gql from "graphql-tag"

export const SITE_INFO = gql`
    query {
        site {
            name
            description
            logo
        }
    }
`

export const ALL_BOOKINGS = gql `
    query {
        allBookings {
            id
            court {
                id
                name
            }
            date
            startTime
            endTime
            description
            user {
                id
                firstName
                lastName
                email
            }
        }
    }
`

export const ALL_COURTS = gql`
    query {
        allCourts {
            id
            name
            openingTime
            closingTime
            minBookingLengthMinutes
            maxBookingLengthMinutes
            maxBookingDaysInAdvance
        }
    }
`


export const SESSION_INFO = gql`
    query {
        sessionInfo {
            isAuthenticated
            user {
                id
                firstName
                lastName
                email
            }
            groups
        }
    }
`

export const BOOKINGS_BY_USER = gql`
    query ($userId: ID) {
        bookingsByUser(userId: $userId) {
            startTime
            endTime
            court {
                id
                name
            }
            date
        }
    }
`

export const CREATE_BOOKING = gql`
    mutation  ($courtID: ID!, $date: Date!, $startTime: Time!, $endTime: Time!, $description: String!) {
        createBooking(courtId: $courtID, date: $date, startTime: $startTime, endTime: $endTime, description: $description) {
            booking {
                id
                date
                startTime
                endTime
                court {
                    id
                }
                description
                user {
                    id
                    firstName
                    lastName
                    email
                }
            }
        }
    }
`

export const DELETE_BOOKING = gql`
    mutation  ($bookingID: ID!) {
        deleteBooking(bookingId: $bookingID) {
            ok
        }
    }
`
