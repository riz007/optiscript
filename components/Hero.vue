<script setup lang="ts">
import sample from "~/assets/images/sample.jpeg";
export interface Props {
  image: string;
}
defineProps<Props>();
</script>
<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col lg:flex-row gap-x-8">
      <img
        :src="image ? image : sample"
        class="max-w-sm rounded-lg shadow-2xl" />
      <div>
        <h1 class="text-5xl font-bold">OptiScript</h1>
        <p class="text-2xl py-6">
          Powered by Gemini, provides concise image descriptions.
        </p>
        <slot />
      </div>
    </div>
  </div>
</template>
