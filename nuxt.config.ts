// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
    },
  },
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@vueuse/nuxt", "nuxt-gtag"],
  gtag: {
    id: "G-F056Q3EJ5C",
  },
  runtimeConfig: {
    public: {
      geminiApiSecret: process.env.NUXT_GEMINI_API_SECRET,
    },
  },
});
