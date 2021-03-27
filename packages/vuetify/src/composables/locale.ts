// Utilities
import { inject, isRef, provide, ref, watch } from 'vue'

import en from '@/locale/en'

// Types
import type { InjectionKey, Ref } from 'vue'
import { getObjectValueByPath, mergeDeep } from '@/util'
import { consoleError, consoleWarn } from '@/util/console'

export interface LocaleProvide {
  locale?: any
  global?: boolean
  getScope?: VueI18nOptions['getScope']
  createScope?: VueI18nOptions['createScope']
  rtl: Ref<Record<string, boolean>>
  isRtl: Ref<boolean | undefined>
}

export interface Locale {
  rtl?: boolean
  badge?: {
    label?: string
  }
}

export type VueI18nOptions = {
  i18n: any
  getScope: (root?: boolean) => any
  createScope: (locale?: string) => any
  rtl?: Record<string, boolean>
}

export type LocaleOptions = {
  defaultLocale?: string
  fallbackLocale?: string
  messages?: Record<string, Locale>
  rtl?: Record<string, boolean>
}

type MaybeRef<T> = Ref<T> | T

function wrapInRef <T> (value: MaybeRef<T>): Ref<T> {
  if (isRef(value)) {
    return value
  }

  return ref(value) as Ref<T>
}

const isVueI18n = (x: any): x is VueI18nOptions => {
  return !!x && x.hasOwnProperty('getScope') && x.hasOwnProperty('createScope')
}

export const VuetifyLocaleSymbol: InjectionKey<LocaleProvide> = Symbol.for('vuetify:locale')

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
  messages: Ref<Record<string, Locale>>,
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

const defaultOptions = { locale: 'en', fallbackLocale: 'en', messages: { en } }

export function createLocaleFromOptions (options?: LocaleOptions | VueI18nOptions): LocaleProvide {
  const rtl = options?.rtl ?? {}

  if (isVueI18n(options)) {
    return {
      ...options,
      global: true,
      rtl: ref(rtl),
      isRtl: ref(rtl[options.i18n.global.locale] ?? false),
    }
  }

  return {
    locale: createLocale(mergeDeep(defaultOptions, options ? {
      locale: options.defaultLocale,
      fallbackLocale: options.fallbackLocale,
      messages: options.messages,
    } : {}) as any),
    rtl: ref(rtl),
    isRtl: ref((!!options?.defaultLocale && rtl[options?.defaultLocale]) ?? false),
  }
}

export function createLocale (options: {
  locale: MaybeRef<string>
  fallbackLocale: MaybeRef<string>
  messages: MaybeRef<Record<string, Locale>>
}) {
  const locale = wrapInRef(options.locale)
  const fallbackLocale = wrapInRef(options.fallbackLocale)
  const messages = wrapInRef(options.messages)

  return {
    messages,
    locale,
    fallbackLocale,
    t: createTranslateFunction(locale, fallbackLocale, messages),
  }
}

export function useLocale () {
  const injected = inject(VuetifyLocaleSymbol)

  if (!injected) throw new Error('foo')

  if (injected.getScope) return injected.getScope(injected.global)

  return injected.locale
}

export function provideLocale (props: { locale?: string, rtl?: boolean }) {
  const injected = inject(VuetifyLocaleSymbol)

  if (!injected) throw new Error('foo')

  let newLocale: any

  if (injected.createScope) {
    newLocale = injected.createScope(props.locale)
  } else {
    newLocale = createLocale({
      locale: props.locale ?? injected.locale.locale.value,
      fallbackLocale: injected.locale.fallbackLocale.value,
      messages: injected.locale.messages,
    })
  }
  const isRtl = ref<boolean | undefined>(props.rtl ?? injected.rtl.value[newLocale.locale.value])

  watch(() => props.locale, () => {
    newLocale.locale.value = props.locale
    isRtl.value = injected.rtl.value[props.locale ?? injected.locale.locale.value]
  })
  watch(() => props.rtl, () => isRtl.value = props.rtl)
  provide(VuetifyLocaleSymbol, { ...injected, locale: newLocale, global: false, isRtl })

  return newLocale
}

export interface RtlProvide {
  rtl: Record<string, boolean>
}

export const VuetifyRtlSymbol: InjectionKey<RtlProvide> = Symbol.for('vuetify:rtl')

export function createRtl (options: { rtl: Record<string, boolean>, isRtl?: boolean }) {
  const rtl = ref(options.rtl)
  const isRtl = ref(options.isRtl)

  return { rtl, isRtl }
}

export function useRtl () {
  const injected = inject(VuetifyLocaleSymbol)

  if (!injected) throw new Error('foo')

  return { isRtl: injected.isRtl }
}
