import { createApp } from 'vue'
import App from './App'
import { createI18n, useI18n } from 'vue-i18n'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/src/iconsets/mdi'
import { fa } from 'vuetify/src/iconsets/fa-svg'
import { messages, sv, en, ja } from './messages'

import { createIntl } from '@formatjs/intl'
import { provideIntl, useIntl } from 'vue-intl'

const i18n = createI18n({
  legacy: false,
  locale: 'ja',
  fallbackLocale: 'en',
  messages,
})

const rtl = {
  sv: false,
  en: false,
  ja: true,
}

const wrapVueI18n = () => ({
  i18n,
  getScope: global => useI18n({ legacy: false, useScope: global ? 'global' : 'parent' }),
  createScope: locale => useI18n({ legacy: false, useScope: 'local', messages, locale, inheritLocale: !locale }),
  rtl,
})

const wrapVueIntl = () => ({
  getScope: global => useIntl(),
  createScope: locale => provideIntl(createIntl({ locale, defaultLocale: 'en', messages })),
  rtl,
})

const vuetify = createVuetify({
  // locale: {
  //   locale: 'ja',
  //   fallbackLocale: 'en',
  //   messages: { sv, en, ja },
  //   rtl,
  // },
  // locale: wrapVueI18n(),
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
