<script setup lang="ts">
import {RouterLink, RouterView, useRoute, useRouter} from "vue-router"

// components
import Navbar from "@/components/Navbar.vue"
import Footer from "@/components/Footer.vue"
import {computed, onBeforeMount, onMounted, ref, watch, provide} from "vue";
import {DefaultApolloClient, useLazyQuery, useQuery} from "@vue/apollo-composable";
import {SESSION_INFO} from "@/queries";
import {useTokenStore} from "@/stores/token";
import {useUserStore} from "@/stores/user";
import {ApolloClient, ApolloLink, concat, createHttpLink, InMemoryCache} from "@apollo/client/core";

const route = useRoute()
const router = useRouter()
const tokenStore = useTokenStore()
const userStore = useUserStore()
const loginError = ref<boolean>(false)
const errorMessage = ref<string>("")

const cache = new InMemoryCache()

const httpLink = createHttpLink({
    uri: "http://127.0.0.1:8000/graphql"
})

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

provide(DefaultApolloClient, apolloClient)




</script>

<template>
  <div id="app">
    <Navbar id="nav"></Navbar>
    <div id="main">
      <RouterView/>
    </div>
    <Footer id="footer"></Footer>
  </div>

</template>

<style scoped>
</style>