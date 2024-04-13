<script setup lang="ts">
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";

const selectedFile = ref(null);
const imageUrl = ref("");
const generatedText = ref(null);
const geminiApiSecret = ref(null);
const isLoading = ref(false);
const showChooseFile = ref(true);

const config = useRuntimeConfig();
geminiApiSecret.value = config.geminiApiSecret;

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
  console.log(config.geminiApiSecret);
  if (!selectedFile.value) return;
  const genAI = new GoogleGenerativeAI("");
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
  const prompt: string = "Describe the image using simple words";

  const imagePart = await fileToGenerativePart(selectedFile.value);
  isLoading.value = true;
  const { totalTokens } = await model.countTokens([prompt, imagePart]);
  console.log(totalTokens);
  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    isLoading.value = false;
    showChooseFile.value = false;
    generatedText.value = response.text();
  } catch (error) {
    isLoading.value = false;
    console.error("Error generating text:", error);
  }
};
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
      <button
        v-if="selectedFile"
        type="button"
        class="btn btn-active btn-wide btn-neutral mt-6 hover:btn-secondary"
        @click="generateText">
        Generate Text
      </button>
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
      <progress class="progress progress-secondary w-56"></progress>
    </div>
    <div
      v-else-if="!isLoading && generatedText"
      class="card bg-neutral text-neutral-content w-96 mt-6">
      <div class="card-body">
        <p class="card-title">AI Generated Text</p>

        <p>{{ generatedText }}</p>
      </div>
    </div>
  </Hero>
</template>
