<script setup lang="ts">
import {RouterLink, RouterView} from "vue-router"

// components
import Navbar from "@/components/Navbar.vue"
import Footer from "@/components/Footer.vue"
import {computed, onMounted, ref, watch} from "vue";
import {useQuery} from "@vue/apollo-composable";
import {SESSION_INFO} from "@/queries";

import {useUserStore} from "@/stores/user";
const userStore = useUserStore()
const q = useQuery(SESSION_INFO).result

const e = computed(()=>q.value?.data || null)


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