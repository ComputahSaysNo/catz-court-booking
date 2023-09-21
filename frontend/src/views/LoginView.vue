<script setup lang="ts">
import {useRoute, useRouter} from "vue-router"

import {useUserStore} from "../stores/user";

const route = useRoute()
const router = useRouter()
const token = route.query.token
const err = route.query.error

const userStore = useUserStore()

if (token) {
  userStore.loginWithToken(token.toString())
  router.push('/')
}

</script>

<template>
  <div class="container my-5">
    <div class="alert alert-primary"><p>Logging in with Raven...</p> <p>Backend token: {{token}}</p></div>
  </div>
</template>

<style scoped>

</style>