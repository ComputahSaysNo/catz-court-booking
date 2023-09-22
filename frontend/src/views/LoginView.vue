<script setup lang="ts">
import {useRoute, useRouter} from "vue-router"

import {useUserStore} from "../stores/user";
import {useTokenStore} from "../stores/token";
import {useLazyQuery} from "@vue/apollo-composable";
import {SESSION_INFO} from "../queries";
import {ref} from "vue";

const route = useRoute()
const router = useRouter()
const token = route.query.token
const err = route.query.error

const tokenStore = useTokenStore()
const userStore = useUserStore()

const loginError = ref<boolean>(false)
const errorMessage = ref<string>("")


if (token) {
  tokenStore.token = token.toString()
  const {load} = useLazyQuery(SESSION_INFO)

  async function waitForLoad() {
    return load()
  }

  waitForLoad().then(res => {
    let sessionInfo = res.sessionInfo
    if (sessionInfo.isAuthenticated) {
      userStore.user = sessionInfo.user
      userStore.isAuthenticated = true
      router.push('/')
    } else {
      loginError.value = true
      errorMessage.value = "Invalid auth token provided by server"
    }
  })
} else {
  loginError.value = true
  errorMessage.value = "No token provided by server"
}

</script>

<template>
  <div class="container mt-3">
    <div v-if="loginError" class="alert alert-danger">There was an error, please try to log in again
      ({{ errorMessage }})
    </div>
  </div>

</template>

<style scoped>

</style>