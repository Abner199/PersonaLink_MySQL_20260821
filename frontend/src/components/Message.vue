<template>
  <div class="message">
    <div class="logo">
      <img src="/images/logo.png" alt="logo" />
    </div>
    <div class="description">
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>
    <FamousQuote />
    <TimeCapsule />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FamousQuote from './FamousQuote.vue';
import TimeCapsule from './TimeCapsule.vue';

const title = ref("PersonaLink");
const subtitle = ref("连接每一个独特的你");
</script>

<style scoped>
.message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 30px 30px;
  transform: translateY(-20px);
}

.logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.description {
  text-align: center;
}

.description h1 {
  font-family: "Pacifico-Regular", cursive;
  font-size: 3rem;
  margin-bottom: 10px;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.description p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .logo {
    width: 80px;
    height: 80px;
  }

  .description h1 {
    font-size: 2rem;
  }

  .description p {
    font-size: 1rem;
  }
}
</style>