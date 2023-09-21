<script setup lang="ts">
import {useRoute, useRouter} from "vue-router"

import {useUserStore} from "../stores/user";
import {useTokenStore} from "../stores/token";

const route = useRoute()
const router = useRouter()
const token = route.query.token.toString()
const err = route.query.error

const tokenStore = useTokenStore()
const userStore = useUserStore()

if (token) {
  console.log(token)
  tokenStore.token = token
  // userStore.completeLogin()
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