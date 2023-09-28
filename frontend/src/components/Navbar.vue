<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import {useTokenStore} from "@/stores/token";
import {computed, onMounted, onUnmounted, ref} from "vue";

const userStore = useUserStore()
const tokenStore = useTokenStore()

function logout() {
  userStore.user = null
  userStore.isAuthenticated = false
  tokenStore.token = null
  localStorage.removeItem("token")
}

const windowWidth = ref(window.innerWidth)

onMounted(() => {
  window.addEventListener('resize', () => windowWidth.value = window.innerWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', () => windowWidth.value = window.innerWidth)
})

const mobile = computed(() => windowWidth.value < 1000)

</script>

<template>
  <nav class="navbar navbar-expand-sm bg-danger">
    <div class="container-fluid">
      <span class="navbar-brand text-white fw-bold fs-4">
        <img src="@/assets/catz-wheel.svg" width="35" height="35" class="mb-1 mx-1" v-if="!mobile">
        Catz Court Booking</span>
      <form class="d-flex">
        <a href="https://km814.user.srcf.net/accounts/login/google-oauth2/" v-if="!userStore.isAuthenticated"
           class="btn btn-outline-light">
          <i class="bi bi-person"></i>
          {{mobile ? "Log in" : "Log in with Raven"}}</a>
        <div v-else>
          <span v-if="!mobile" class="mx-4 text-light fst-italic">logged in as {{userStore.user?.email}}</span>
          <a href="https://km814.user.srcf.net/accounts/logout" @click="logout" class="btn btn-outline-light">Log out</a>
          <a href="https://km814.user.srcf.net/admin/" v-if="userStore.groups.includes('Admin')" class="ms-2 btn btn-outline-warning">Admin panel</a>
        </div>


      </form>
    </div>

  </nav>
</template>

<style scoped>

</style>