
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css";
import "./assets/main.css"
import "bootstrap"

import {createApp, provide, h} from "vue"
import {createPinia} from "pinia"
import {useUserStore} from "@/stores/user";

import {DefaultApolloClient} from "@vue/apollo-composable"
import {ApolloClient, ApolloLink, concat, createHttpLink, InMemoryCache} from "@apollo/client/core"

import App from "./App.vue"
import router from "./router"

import VueDatePicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"


const httpLink = createHttpLink({
    uri: "http://127.0.0.1:8000/graphql",
    credentials: 'same-origin'
})



const app = createApp(App)
app.use(createPinia())
app.use(router)

const userStore = useUserStore()
const cache = new InMemoryCache()

const authMiddleware = new ApolloLink((operation, forward) => {
    operation.setContext(({headers = {}}) => ({
        headers: {
            authorization: `Token ${userStore.token}`
        }
    }))
    return forward(operation)
})

const apolloClient = new ApolloClient({link: concat(authMiddleware, httpLink), cache: cache})

app.provide(DefaultApolloClient, apolloClient)
app.component("VueDatePicker", VueDatePicker)

app.mount('#app')
