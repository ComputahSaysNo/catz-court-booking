import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css";
import "./assets/main.css"
import "bootstrap"

import {createApp, provide, h} from "vue"
import {createPinia} from "pinia"
import {useTokenStore} from "@/stores/token";

import {DefaultApolloClient} from "@vue/apollo-composable"
import {ApolloClient, ApolloLink, concat, createHttpLink, InMemoryCache} from "@apollo/client/core"

import App from "./App.vue"
import router from "./router"

const URI = 'https://km814.user.srcf.net/graphql'

const httpLink = createHttpLink({
    uri: URI
})

const app = createApp(App)
app.use(createPinia())
app.use(router)

const tokenStore = useTokenStore()
const cache = new InMemoryCache()

const authMiddleware = new ApolloLink((operation, forward) => {
    if (tokenStore.token) {
        operation.setContext(({headers = {}}) => ({
            headers: {
                authorization: tokenStore.header
            }
        }))
    }
    return forward(operation)
})


const apolloClient = new ApolloClient({link: concat(authMiddleware, httpLink), cache: cache})

app.provide(DefaultApolloClient, apolloClient)
app.mount('#app')