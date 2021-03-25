import { computed, createApp } from 'vue'
import App from './App'
import { createI18n, useI18n } from 'vue-i18n'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/src/iconsets/mdi'
import { fa } from 'vuetify/src/iconsets/fa-svg'
// import { en, ar } from 'vuetify/src/locale'

const messages = {
  en: {
    message: {
      hello: 'hello world',
    },
    $vuetify: {
      foo: '{0} en {1}',
    },
  },
  ja: {
    message: {
      hello: 'こんにちは、世界',
    },
    $vuetify: {
      foo: '{0} ja {1}',
    },
  },
  sv: {
    message: {
      hello: 'Hejsan Världen!',
    },
    $vuetify: {
      foo: '{0} sv {1}',
    },
  },
}

const i18n = createI18n({
  legacy: false,
  locale: 'ja',
  fallbackLocale: 'en',
  messages,
})

const vuetify = createVuetify({
  // lang: {
  //   locales,
  // },
  // locale: {
  //   locales: {
  //     en,
  //     ar,
  //   },
  // },
  locale: {
    defaultLocale: computed(() => i18n.global.locale),
    translate: (key, locale, params) => {
      // if (i18n.mode === 'legacy') return i18n.global.t(key, locale, params)
      return i18n.global.t(key, params, { locale })
    },
    createScope: () => {
      return useI18n({ useScope: 'local' })
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
      fa,
    },
  },
})

library.add(fas)

const app = createApp(App)

app.use(i18n)
app.use(vuetify)
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')
