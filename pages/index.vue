<script setup lang="ts">
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { useSpeechSynthesis } from "@vueuse/core";
import { onMounted } from "vue";
import { useClipboard } from "@vueuse/core";

const selectedFile = ref(null);
const imageUrl = ref("");
const generatedText = ref("");
const showGeneratedTextCard = ref(false);
const isLoading = ref(false);
const showChooseFile = ref(true);
const voice = ref<SpeechSynthesisVoice>(
  undefined as unknown as SpeechSynthesisVoice
);
const pitch = ref(1);
const rate = ref(1);
const speech = useSpeechSynthesis(generatedText.value, {
  voice,
  pitch,
  rate,
});
let synth: SpeechSynthesis;
const voices = ref<SpeechSynthesisVoice[]>([]);
const { copy } = useClipboard();
const prompt = ref("Describe the image using simple words");

const config = useRuntimeConfig();

const onSelectFile = (e) => {
  const files = e.target.files || e.dataTransfer.files;
  if (!files.length) return;
  selectedFile.value = files[0];
  imageUrl.value = URL.createObjectURL(files[0]);
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result?.split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const generateText = async () => {
  if (!selectedFile.value) return;
  const genAI = new GoogleGenerativeAI(config.public.geminiApiSecret);
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];
  const model = genAI.getGenerativeModel({
    model: "gemini-pro-vision",
    safetySettings,
  });

  const imagePart = await fileToGenerativePart(selectedFile.value);
  isLoading.value = true;
  try {
    const result = await model.generateContent([prompt.value, imagePart]);
    const response = await result.response;
    isLoading.value = false;
    showChooseFile.value = false;
    showGeneratedTextCard.value = true;
    generatedText.value = response.text();
  } catch (error) {
    isLoading.value = false;
    console.error("Error generating text:", error);
  }
};
const playGeneratedText = () => {
  if (speech.status.value === "pause") {
    window.speechSynthesis.resume();
  } else {
    speech.speak;
  }
};
const pause = () => {
  window.speechSynthesis.pause();
};
const stop = () => {
  speech.stop();
};
onMounted(() => {
  if (speech.isSupported.value) {
    setTimeout(() => {
      synth = window.speechSynthesis;
      voices.value = synth.getVoices();
      voice.value = voices.value[0];
    });
  }
});
</script>
<template>
  <Hero :image="imageUrl">
    <template v-if="showChooseFile">
      <div class="form-control w-full">
        <input
          v-on:change="onSelectFile"
          type="file"
          class="file-input file-input-bordered file-input-md w-full max-w-xs"
          accept="image/*" />
      </div>
      <template v-if="selectedFile">
        <div>
          <textarea
            placeholder="Write your custom prompt here..."
            v-model.trim="prompt"
            class="textarea textarea-bordered textarea-lg w-full max-w-xs mt-6"></textarea>
        </div>
        <button
          type="button"
          class="btn btn-active btn-wide btn-neutral mt-6 hover:btn-secondary w-full max-w-xs"
          :class="{ 'btn-disabled': isLoading }"
          @click="generateText">
          <span v-if="isLoading" class="loading loading-spinner"></span>
          Generate
        </button></template
      >
    </template>
    <template v-else>
      <p>
        Would you like to regenerate another description? Just
        <a class="link link-secondary" @click="generateText">Click here</a>
        😉
      </p>
      <p>
        Or you can select another image file and reset the whole process.
        <a class="link link-secondary" @click="showChooseFile = true"
          >Click here</a
        >
      </p>
    </template>

    <div v-if="isLoading">
      <progress
        class="progress progress-secondary w-full max-w-xs mt-4"></progress>
    </div>
    <div
      v-else-if="!isLoading && showGeneratedTextCard"
      class="card bg-neutral text-neutral-content w-96 mt-6">
      <div class="card-body">
        <!-- <div class="card-actions justify-end">
          <button @click="!showGeneratedTextCard" class="btn btn-circle btn-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div> -->
        <p class="card-title">Description</p>

        <p>{{ generatedText }}</p>
        <button @click="copy(generatedText)" class="btn btn-circle">
          <svg
            class="w-6 h-6"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
          </svg>
        </button>
      </div>
      <!-- <div v-if="!speech.isSupported">
        Your browser does not support SpeechSynthesis API,
        <a href="https://caniuse.com/mdn-api_speechsynthesis" target="_blank"
          >more details</a
        >
      </div>
      <div v-else>
        <button @click="playGeneratedText" class="btn btn-circle btn-outline">
          <svg
            class="w-6 h-6 text-neutral-content dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24">
            <path
              fill-rule="evenodd"
              d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z"
              clip-rule="evenodd" />
          </svg>
        </button>
        <button @click="pause" class="btn btn-circle btn-outline">
          <svg
            class="w-6 h-6 text-neutral-content dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24">
            <path
              fill-rule="evenodd"
              d="M8 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8Zm7 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1Z"
              clip-rule="evenodd" />
          </svg>
        </button>
        <button @click="stop" class="btn btn-circle btn-outline">
          <svg
            class="w-6 h-6 text-neutral-content dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24">
            <path
              fill-rule="evenodd"
              d="M8 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8Zm7 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1Z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div> -->
    </div>
  </Hero>
</template>
