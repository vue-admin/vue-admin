<template>
  <main>
    home
    <router-link to="/login">登录</router-link>
    <div>
      <h3>{{ counter.get() }}</h3>
      <button @click="counter.inc()">+</button>
      <button @click="counter.dec()">-</button>
    </div>
    <div
      ref="elv"
      style="--color: #7fa998; --color-one: #df8543"
      :style="{ color: colorVal }"
    >
      Sample text, {{ key }}: {{ colorVal }}
    </div>
    <button style="margin-left: 0" @click="changeVar">
      Change Color Variable
    </button>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { counter } from '../stores/counter'
import { useCssVar } from '@vueuse/core'

const elv = ref(null)
const key = ref('--color')
const colorVal = useCssVar(key, elv)
function changeVar() {
  if (key.value === '--color') key.value = '--color-one'
  else key.value = '--color'
}
</script>
