<template>
  <div class="trend-settings-container" @keydown="handleKeydown">
    <div class="trend-settings-frame">
      <!-- Левая иконка -->
      <div class="search-outline-left" v-if="leftIconSrc">
        <img :src="leftIconSrc" alt="Input logo" class="input-logo-svg" />
      </div>

      <div class="cursor-and-value">
        <div class="selected-users">
          <div v-if="selectedUser" class="user-tag">
            <span>{{ selectedUser.name }}</span>
            <button @click="removeUser" class="remove-btn" aria-label="Удалить пользователя">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 8.5C3.17948e-07 3.80558 3.80558 -1.66347e-07 8.5 -3.71547e-07C13.1944 -5.76746e-07 17 3.80558 17 8.5C17 13.1944 13.1944 17 8.5 17C3.80558 17 -2.052e-07 13.1944 0 8.5ZM5.70898 5.70898C5.4774 5.94057 5.4774 6.31528 5.70898 6.54687L7.66211 8.5L5.70898 10.4531C5.47739 10.6847 5.4774 11.0594 5.70898 11.291C5.94058 11.5226 6.31529 11.5226 6.54688 11.291L8.5 9.33789L10.4531 11.291C10.6847 11.5226 11.0594 11.5226 11.291 11.291C11.5226 11.0594 11.5226 10.6847 11.291 10.4531L9.33789 8.5L11.291 6.54687C11.5226 6.31529 11.5226 5.94058 11.291 5.70898C11.0594 5.4774 10.6847 5.4774 10.4531 5.70898L8.5 7.66211L6.54688 5.70898C6.31529 5.47739 5.94058 5.47739 5.70898 5.70898Z" fill="#858585"/>
              </svg>
            </button>
          </div>
        </div>
        <input 
          ref="searchInput"
          type="text"
          v-model="searchQuery"
          :placeholder="selectedUser ? '' : placeholder"
          :disabled="!!selectedUser"
          class="value-input"
          @input="handleSearch"
          @focus="handleFocus"
          @blur="handleBlur"
        />
      </div>

      <div class="search-icon-right" v-if="rightIconSrc">
        <img :src="rightIconSrc" alt="Search" class="search-icon-svg" />
      </div>
    </div>

    <transition name="slide-down">
      <div 
        v-if="isFocused && searchQuery.length > 0 && !selectedUser" 
        class="search-results" 
        ref="resultsRef"
      >
        <div v-if="isLoading" class="result-item" style="color: #8D8D8D; cursor: default;">
          Загрузка...
        </div>

        <template v-else-if="filteredUsers.length > 0">
          <div 
            v-for="(user, index) in filteredUsers" 
            :key="user.id"
            class="result-item"
            :class="{ 'highlighted': index === highlightedIndex }"
            :style="customCursorStyle"
            @click="selectUser(user)"
            @mouseenter="highlightedIndex = index"
          >
            {{ user.name }}
          </div>
        </template>

        <div v-else class="result-item" style="color: #8D8D8D; cursor: default;">
          Ничего не найдено
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { useDebounce } from '../composables/useDebounce' 
import { searchUsers } from '../api/userApi' 
import fingerCursorSrc from '../assets/finger.svg?url'

const props = defineProps({
  placeholder: { type: String, default: 'Введите запрос' },
  leftIconSrc: { type: String, default: '' },
  rightIconSrc: { type: String, default: '' }
})

const emit = defineEmits(['select', 'remove'])

const customCursorStyle = {
  cursor: `url(${fingerCursorSrc}) 16 16, pointer`
}

const { immediateValue: searchQuery, debouncedValue, cancel: cancelDebounce } = useDebounce('', 300)

const isFocused = ref(false)
const searchInput = ref(null)
const resultsRef = ref(null)
const selectedUser = ref(null)
const highlightedIndex = ref(-1)
const isLoading = ref(false)

let abortController = null
const apiUsers = ref([])

watch(debouncedValue, async (newQuery) => {
  if (!newQuery || selectedUser.value) {
    apiUsers.value = []
    return
  }

  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()

  isLoading.value = true
  try {
    const results = await searchUsers(newQuery, abortController.signal)
    apiUsers.value = results
  } catch (error) {
    if (error.name !== 'AbortError') {
    }
  } finally {
    isLoading.value = false
  }
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return []
  
  const query = searchQuery.value.toLowerCase()
  
  return apiUsers.value.filter(user => 
    user.id !== selectedUser.value?.id &&
    user.name.toLowerCase().includes(query) 
  )
})

function handleSearch() {
  highlightedIndex.value = -1
}

function handleFocus() {
  if (!selectedUser.value) {
    isFocused.value = true
  }
}

function handleBlur(event) {
  if (event.relatedTarget && resultsRef.value?.contains(event.relatedTarget)) {
    return
  }
  isFocused.value = false
  highlightedIndex.value = -1
}

function handleKeydown(event) {
  const hasResults = !isLoading.value && filteredUsers.value.length > 0
  if (!isFocused.value || searchQuery.value.length === 0 || selectedUser.value || !hasResults) return
  
  const key = event.key
  
  switch (key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredUsers.value.length - 1)
      scrollToHighlightedItem()
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      scrollToHighlightedItem()
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && filteredUsers.value[highlightedIndex.value]) {
        selectUser(filteredUsers.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      isFocused.value = false
      highlightedIndex.value = -1
      searchInput.value?.blur()
      break
  }
}

function scrollToHighlightedItem() {
  nextTick(() => {
    if (!resultsRef.value || highlightedIndex.value < 0) return
    
    const items = resultsRef.value.querySelectorAll('.result-item')
    if (!items[highlightedIndex.value]) return
    
    const container = resultsRef.value
    const item = items[highlightedIndex.value]
    
    const containerRect = container.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    
    if (itemRect.top < containerRect.top) {
      container.scrollTop = item.offsetTop
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop = item.offsetTop - container.clientHeight + item.clientHeight
    }
  })
}

function selectUser(user) {
  selectedUser.value = user
  searchQuery.value = ''
  cancelDebounce()
  apiUsers.value = []
  isFocused.value = false
  highlightedIndex.value = -1
  emit('select', user)
  nextTick(() => {
    searchInput.value?.blur()
  })
}

function removeUser() {
  selectedUser.value = null
  apiUsers.value = []
  emit('remove')
  nextTick(() => {
    searchInput.value?.focus()
  })
}

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})

defineExpose({ selectedUser })
</script>

<style scoped>
.trend-settings-container {
  width: 893px;
  max-width: 100%;
  height: 80px;
  border-radius: 10px;
  opacity: 1;
  padding-top: 20px;
  padding-bottom: 20px;
  gap: 10px;
  background: #242424;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  margin: 0 auto;
}

.trend-settings-frame {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 30px;
  gap: 20px;
  height: 40px;
}

.search-outline-left {
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.input-logo-svg {
  width: 40px;
  height: 40px;
  display: block;
}

.cursor-and-value {
  flex: 1;
  min-height: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.selected-users {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}

.selected-users::-webkit-scrollbar {
  height: 4px;
}
.selected-users::-webkit-scrollbar-track {
  background: transparent;
}
.selected-users::-webkit-scrollbar-thumb {
  background-color: #555;
  border-radius: 4px;
}

.user-tag {
  width: 153px;
  min-width: 153px;
  height: 40px;
  border-radius: 10px;
  opacity: 1;
  padding-left: 20px;
  padding-right: 10px;
  gap: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #000000;
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #FFFFFF;
  box-sizing: border-box;
  flex-shrink: 0;
}

.user-tag span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.remove-btn:hover {
  opacity: 0.7;
}

.value-input {
  flex: 1;
  min-width: 150px;
  background: transparent;
  border: none;
  outline: none;
  color: #FFFFFF;
  font-family: 'Montserrat', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 15px;
  line-height: 160%;
  display: flex;
  align-items: center;
  text-align: left;
  font-feature-settings: 'case' on;
}

.value-input:disabled {
  cursor: default;
}

.value-input::placeholder {
  color: #8D8D8D;
}

.search-icon-right {
  width: 24px;
  height: 24px; 
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}

.search-icon-svg {
  width: 17px;
  height: 17px;
  display: block;
  object-fit: contain; 
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: #383836;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 10;
  padding: 20px 0;
  
  max-height: 214px; 
  overflow-y: auto;
  
  scroll-snap-type: y mandatory;
  scroll-padding: 20px 0;
  
  scrollbar-width: thin;
  scrollbar-color: #555 #383836;
}

.search-results::-webkit-scrollbar {
  width: 8px;
}

.search-results::-webkit-scrollbar-track {
  background: #383836;
}

.search-results::-webkit-scrollbar-thumb {
  background-color: #555;
  border-radius: 4px;
}

.search-results::-webkit-scrollbar-thumb:hover {
  background-color: #666;
}

.result-item {
  width: 893px;
  max-width: 100%;
  height: 50px;
  padding-left: 30px;
  padding-right: 30px;
  gap: 15px;
  display: flex;
  align-items: center;
  color: #FFFFFF;
  font-size: 15px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  transition: background 0.15s ease;
  opacity: 1;
  box-sizing: border-box;
  scroll-snap-align: start;
}

.result-item:hover {
  background: #242424;
}

.result-item.highlighted {
  background: #242424;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>