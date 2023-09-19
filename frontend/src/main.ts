
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css";
import "./assets/main.css"
import "bootstrap"

import {createApp, provide, h} from "vue"
import {createPinia} from "pinia"
import {DefaultApolloClient} from "@vue/apollo-composable"
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client/core"

import App from "./App.vue"
import router from "./router"

import VueDatePicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"


const httpLink = createHttpLink({
    uri: "http://127.0.0.1:8000/graphql"
})

const cache = new InMemoryCache()

const apolloClient = new ApolloClient({link: httpLink, cache})

const app = createApp({
    setup() {
        provide(DefaultApolloClient, apolloClient)
    },

    render: () => h(App)
})

app.use(createPinia())
app.use(router)

app.component("VueDatePicker", VueDatePicker)

app.mount('#app')
