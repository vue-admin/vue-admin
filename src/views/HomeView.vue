<template>
  <main>
    home
    <router-link to="/login">登录</router-link>
    <div>
      <h3>{{ counter.get() }}</h3>
      <button @click="counter.inc()">+</button>
      <button @click="counter.dec()">-</button>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { counter } from '../stores/counter'
</script>
