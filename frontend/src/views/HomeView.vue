<script setup lang="ts">
import Calendar from "@/components/Calendar.vue"
import UserPanel from "@/components/UserPanel.vue";

import {useUserStore} from "@/stores/user";
import {computed, onMounted, ref} from "vue";
import {useLazyQuery, useQuery} from "@vue/apollo-composable";
import {SESSION_INFO} from "@/queries";
import {useRoute, useRouter} from "vue-router";
import {useTokenStore} from "@/stores/token";

const route = useRoute()
const router = useRouter()
const tokenStore = useTokenStore()
const userStore = useUserStore()
const loginError = ref<boolean>(false)
const errorMessage = ref<string>("")

onMounted(() => {

  const token = route.query.token
  const err = route.query.error


  if (token) {
    tokenStore.token = token.toString()
    const {load} = useLazyQuery(SESSION_INFO)

    async function waitForLoad() {
      return load()
    }

    try {
      waitForLoad().then(res => {
        let sessionInfo = res.sessionInfo
        if (sessionInfo.isAuthenticated) {
          userStore.user = sessionInfo.user
          userStore.isAuthenticated = true
          router.push('/')
        } else {
          loginError.value = true
          errorMessage.value = "Auth token provided by server is invalid, it may have expired"
        }
      })
    } catch {
      loginError.value = true
      errorMessage.value = "Error contacting Catz server. Auth token provided by server may be invalid"
    }

  }
  if (err) {
    loginError.value = true
    errorMessage.value = "Raven login failed"
  }
})

const dismissed = ref<boolean>(false)
</script>

<template>
  <main>
    <div class="">
      <div class="container mt-3">
        <div v-if="loginError" class="alert alert-danger">There was an error, please try to log in again
          ({{ errorMessage }})
        </div>
      </div>
      <UserPanel v-if="userStore.isAuthenticated"></UserPanel>
      <div v-else-if="!dismissed" class="container alert alert-info alert-dismissible mt-4 fw-bold">Login to make
        bookings
        <button class="btn-close" @click="dismissed=true"></button>
      </div>
      <div class="">
        <Calendar></Calendar>
      </div>
    </div>
  </main>
</template>
