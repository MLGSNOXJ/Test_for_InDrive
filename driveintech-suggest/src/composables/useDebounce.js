import { ref, watch } from 'vue'

export function useDebounce(initialValue = '', delay = 300) {
    const immediateValue = ref(initialValue)
    const debouncedValue = ref(initialValue)

    let timer = null

    watch(immediateValue, (value) => {
        clearTimeout(timer)

        timer = setTimeout(() => {
            debouncedValue.value = value
        }, delay)
    })

    function cancel() {
        clearTimeout(timer)
    }

    return {
        immediateValue,
        debouncedValue,
        cancel
    }
}