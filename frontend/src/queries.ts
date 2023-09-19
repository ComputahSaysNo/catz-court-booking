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
        }
    }
`

