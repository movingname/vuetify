import { inject, provide, ref } from 'vue'

import type { App, InjectionKey, Ref } from 'vue'
import { getObjectValueByPath } from '@/util'
import { consoleError, consoleWarn } from '@/util/console'
import en from '@/locale/en'

export interface LocaleOptions {
  locale?: string
  fallbackLocale?: string
  messages?: Record<string, any>
}

export interface LocaleInstance {
  locale: Ref<string>
  fallbackLocale: Ref<string>
  messages: Ref<Record<string, any>>
  t: (key: string, ...params: unknown[]) => string
}

export interface LocaleAdapter {
  createRoot: (app: App) => LocaleInstance
  getScope: () => LocaleInstance
  createScope: (options?: LocaleOptions) => LocaleInstance
}

export const VuetifyLocaleAdapterSymbol: InjectionKey<LocaleAdapter> = Symbol.for('vuetify:locale-adapter')
export const VuetifyLocaleSymbol: InjectionKey<LocaleInstance> = Symbol.for('vuetify:locale')

export function provideLocale (props?: LocaleOptions) {
  const adapter = inject(VuetifyLocaleAdapterSymbol)

  if (!adapter) throw new Error('foo')

  return adapter.createScope(props)
}

export function useLocale () {
  const adapter = inject(VuetifyLocaleAdapterSymbol)

  if (!adapter) throw new Error('bar')

  return adapter.getScope()
}

function isLocaleAdapter (x: any): x is LocaleAdapter {
  return !!x && x.hasOwnProperty('getScope') && x.hasOwnProperty('createScope') && x.hasOwnProperty('createRoot')
}

export function createLocaleAdapter (app: App, options?: LocaleOptions | LocaleAdapter) {
  const adapter = isLocaleAdapter(options) ? options : createDefaultLocaleAdapter(options)

  adapter.createRoot(app)

  return adapter
}

const LANG_PREFIX = '$vuetify.'

const replace = (str: string, params: unknown[]) => {
  return str.replace(/\{(\d+)\}/g, (match: string, index: string) => {
    /* istanbul ignore next */
    return String(params[+index])
  })
}

const createTranslateFunction = (
  current: Ref<string>,
  fallback: Ref<string>,
  messages: Ref<Record<string, any>>,
) => {
  return (key: string, ...params: unknown[]) => {
    if (!key.startsWith(LANG_PREFIX)) {
      return replace(key, params)
    }

    const shortKey = key.replace(LANG_PREFIX, '')
    const currentLocale = current.value && messages.value[current.value]
    const fallbackLocale = fallback.value && messages.value[fallback.value]

    let str: string = getObjectValueByPath(currentLocale, shortKey, null)

    if (!str) {
      consoleWarn(`Translation key "${key}" not found in "${current.value}", trying fallback locale`)
      str = getObjectValueByPath(fallbackLocale, shortKey, null)
    }

    if (!str) {
      consoleError(`Translation key "${key}" not found in fallback`)
      str = key
    }

    if (typeof str !== 'string') {
      consoleError(`Translation key "${key}" has a non-string value`)
      str = key
    }

    return replace(str, params)
  }
}

export function createDefaultLocaleAdapter (options?: LocaleOptions): LocaleAdapter {
  const createScope = (options?: LocaleOptions) => {
    const locale = ref(options?.locale ?? 'en')
    const fallbackLocale = ref(options?.fallbackLocale ?? 'en')
    const messages = ref(options?.messages ?? { en })

    return { locale, fallbackLocale, messages, t: createTranslateFunction(locale, fallbackLocale, messages) }
  }

  return {
    createRoot: app => {
      const rootScope = createScope(options)

      app.provide(VuetifyLocaleSymbol, rootScope)

      return rootScope
    },
    getScope: () => {
      const currentScope = inject(VuetifyLocaleSymbol)

      if (!currentScope) throw new Error('default getScope')

      return currentScope
    },
    createScope: options => {
      const currentScope = inject(VuetifyLocaleSymbol)

      if (!currentScope) throw new Error('default createScope')

      const newScope = createScope({
        locale: options?.locale ?? currentScope.locale.value,
        fallbackLocale: options?.locale ?? currentScope.fallbackLocale.value,
        messages: options?.messages ?? currentScope.messages.value,
      })

      provide(VuetifyLocaleSymbol, newScope)

      return newScope
    },
  }
}

// TODO: Add RTL functionality!
// export interface RtlProvide {
//   rtl: Record<string, boolean>
// }
// export const VuetifyRtlSymbol: InjectionKey<RtlProvide> = Symbol.for('vuetify:rtl')

// export function createRtl (options: { rtl: Record<string, boolean>, isRtl?: boolean }) {
//   const rtl = ref(options.rtl)
//   const isRtl = ref(options.isRtl)

//   return { rtl, isRtl }
// }

// export function useRtl () {
//   const injected = inject(VuetifyLocaleSymbol)

//   if (!injected) throw new Error('foo')

//   return { isRtl: injected.isRtl }
// }
