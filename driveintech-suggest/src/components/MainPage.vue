<template>
  <div class="main-page">
    <div class="logo-container">
      <div class="logo">
        <img :src="mainLogoSrc" alt="DRIVE in tech" class="logo-svg" />
      </div>
    </div>

    <AppInput 
      :left-icon-src="inputLogoSrc"
      :right-icon-src="searchIconSrc"
      placeholder="Введите запрос"
      @select="handleUserSelect"
      @remove="handleUserRemove"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppInput from '../components/AppInput.vue' 

import mainLogoSrc from '../assets/drive.svg'
import inputLogoSrc from '../assets/logo.svg'
import searchIconSrc from '../assets/search.svg'

const handleUserSelect = (user) => {
  console.log('Пользователь выбран:', user.name)
}

const handleUserRemove = () => {
  console.log('Пользователь удален из инпута')
}
</script>

<style scoped>
.main-page {
  min-height: 100vh;
  padding-left: 20px;
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.logo-container {
  margin-top: 281px;
  margin-bottom: 56px; 
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-svg {
  width: 213.39px;
  height: 18.24px;
  display: block;
}
</style>