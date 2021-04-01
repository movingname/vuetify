import { provideLocale, provideRtl } from '@/composables/locale'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VLocaleProvider',

  props: {
    locale: String,
    fallbackLocale: String,
    messages: Object,
    rtl: {
      type: Boolean,
      default: undefined,
    },
  },

  setup (props, ctx) {
    const localeInstance = provideLocale(props)
    provideRtl(localeInstance, props)

    return () => ctx.slots.default?.()
  }
})
