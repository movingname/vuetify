import { inject, provide, ref } from 'vue'

import type { InjectionKey, Ref } from 'vue'
import { getObjectValueByPath } from '@/util'
import { consoleError, consoleWarn } from '@/util/console'
import en from '@/locale/en'

export interface LocaleOptions {
  locale?: string
  fallbackLocale?: string
  messages?: Record<string, any>
  rtl?: boolean
}

export interface LocaleInstance {
  locale: Ref<string>
  fallbackLocale: Ref<string>
  messages: Ref<Record<string, any>>
  t: (key: string, ...params: unknown[]) => string
}

export interface LocaleAdapter {
  createRoot: () => LocaleInstance
  getScope: () => LocaleInstance
  createScope: (options?: LocaleOptions) => LocaleInstance
}

export const VuetifyLocaleAdapterSymbol: InjectionKey<LocaleAdapter> = Symbol.for('vuetify:locale-adapter')

export const VuetifyLocaleSymbol: InjectionKey< any> = Symbol.for('vuetify:locale')

// export function createLocale (
//   options: LocaleAdapter
// ) {
//   provide(VuetifyLocaleAdapterSymbol, options)

//   return options.createRoot()
// }

export function provideLocale (props?: LocaleOptions) {
  const adapter = inject(VuetifyLocaleAdapterSymbol)

  if (!adapter) throw new Error('foo')

  const newScope = adapter.createScope(props)

  provide(VuetifyLocaleSymbol, newScope)

  return newScope
}

export function useLocale () {
  const adapter = inject(VuetifyLocaleAdapterSymbol)

  if (!adapter) throw new Error('bar')

  return adapter.getScope()
}

function isLocaleAdapter (x: any): x is LocaleAdapter {
  return !!x && x.hasOwnProperty('getScope') && x.hasOwnProperty('createScope') && x.hasOwnProperty('createRoot')
}

export function createLocaleAdapter (options?: LocaleOptions | LocaleAdapter) {
  return isLocaleAdapter(options) ? options : createDefaultLocaleAdapter(options)
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
    createRoot: () => createScope(options),
    getScope: () => {
      const currentScope = inject(VuetifyLocaleSymbol)

      if (!currentScope) throw new Error('default getScope')

      return currentScope
    },
    createScope: (options?: LocaleOptions) => {
      const currentScope = inject(VuetifyLocaleSymbol)

      if (!currentScope) throw new Error('default createScope')

      const newScope = createScope(options)

      provide(VuetifyLocaleSymbol, newScope)

      return newScope
    },
  }
}
