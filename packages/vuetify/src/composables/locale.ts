import { computed, inject, provide, ref } from 'vue'

import type { App, InjectionKey, Ref } from 'vue'
import { getObjectValueByPath } from '@/util'
import { consoleError, consoleWarn } from '@/util/console'
import en from '@/locale/en'

export interface LocaleOptions {
  defaultLocale?: string
  fallbackLocale?: string
  messages?: Record<string, any>
}

export interface LocaleProps {
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
  createRoot: (app: App) => LocaleInstance
  getScope: () => LocaleInstance
  createScope: (options?: LocaleProps) => LocaleInstance
  rtl?: Record<string, boolean>
}

export const VuetifyLocaleAdapterSymbol: InjectionKey<LocaleAdapter> = Symbol.for('vuetify:locale-adapter')
export const VuetifyLocaleSymbol: InjectionKey<LocaleInstance> = Symbol.for('vuetify:locale')

export function provideLocale (props?: LocaleProps) {
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

  const rootInstance = adapter.createRoot(app)

  return { adapter, rootInstance }
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
  const createScope = (options?: LocaleProps) => {
    const locale = ref(options?.locale ?? 'en')
    const fallbackLocale = ref(options?.fallbackLocale ?? 'en')
    const messages = ref(options?.messages ?? { en })

    return { locale, fallbackLocale, messages, t: createTranslateFunction(locale, fallbackLocale, messages) }
  }

  return {
    createRoot: app => {
      const rootScope = createScope({
        locale: options?.defaultLocale,
        fallbackLocale: options?.fallbackLocale,
        messages: options?.messages,
      })

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

export interface RtlOptions {
  rtl: Record<string, boolean>
  isRtl?: boolean
}

export interface RtlInstance {
  rtl: Record<string, boolean>
  isRtl: Ref<boolean>
}

export const VuetifyRtlSymbol: InjectionKey<RtlInstance> = Symbol.for('vuetify:rtl')

export function createRtl (localeScope: LocaleInstance, options?: RtlOptions) {
  return createRtlScope({
    rtl: options?.rtl ?? {},
    isRtl: ref(options?.isRtl ?? false),
  }, localeScope)
}

export function createRtlScope (currentScope: RtlInstance, localeScope: LocaleInstance, options?: { rtl?: boolean }): RtlInstance {
  return {
    isRtl: computed(() => {
      if (!!options && typeof options.rtl === 'boolean') return options.rtl
      if (localeScope.locale.value && currentScope.rtl.hasOwnProperty(localeScope.locale.value)) {
        return currentScope.rtl[localeScope.locale.value]
      }

      return currentScope.isRtl.value
    }),
    rtl: currentScope.rtl,
  }
}

export function provideRtl (localeScope: LocaleInstance, props: { rtl?: boolean }) {
  const currentScope = inject(VuetifyRtlSymbol)

  if (!currentScope) throw new Error('rtl provide')

  const newScope = createRtlScope(currentScope, localeScope, props)

  provide(VuetifyRtlSymbol, newScope)

  return newScope
}

export function useRtl () {
  const currentScope = inject(VuetifyRtlSymbol)

  if (!currentScope) throw new Error('foo')

  return currentScope
}
