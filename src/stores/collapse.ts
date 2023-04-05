import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCollapseStore = defineStore('collapse', () => {
    let collapse = ref(false)
    function change() {
        collapse.value = !collapse.value
    }
    return { collapse, change }
})
