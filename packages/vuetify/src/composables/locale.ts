// Utilities
import { computed, inject, isRef, provide, ref } from 'vue'

import enUS from '@/locale/en'

// Types
import type { InjectionKey, Ref } from 'vue'
import { getObjectValueByPath } from '@/util'
import { consoleError, consoleWarn } from '@/util/console'

type CustomTranslateFunction = (key: string, locale: string, params: unknown[]) => string

export interface LocaleProvide {
  isRtl: Ref<boolean>
  locales: Ref<Record<string, Locale>>
  currentLocale: Ref<string>
  fallbackLocale: Ref<string>
  customTranslateFunction?: CustomTranslateFunction
  translate: (key: string, ...params: unknown[]) => string
}

export interface Locale {
  rtl?: boolean
  badge?: {
    label?: string
  }
}

export interface LocaleOptions {
  defaultLocale?: string
  fallbackLocale?: string
  locales?: Record<string, Locale>
  translate?: CustomTranslateFunction
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
  locales: Ref<Record<string, Locale>>,
  customTranslateFunction?: CustomTranslateFunction
) => {
  return (key: string, ...params: unknown[]) => {
    console.log('translate', key, current.value, params, !!customTranslateFunction)
    if (customTranslateFunction) {
      return customTranslateFunction(key, current.value, params)
    }

    if (!key.startsWith(LANG_PREFIX)) {
      return replace(key, params)
    }

    const shortKey = key.replace(LANG_PREFIX, '')
    const currentLocale = locales.value[current.value]
    const fallbackLocale = locales.value[fallback.value]

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

type MaybeRef<T> = Ref<T> | T

function wrapInRef <T> (value: MaybeRef<T>): Ref<T> {
  console.log(isRef(value))
  if (isRef(value)) {
    return value
  }

  return ref(value) as Ref<T>
}

export function createLocaleFromOptions (options?: LocaleOptions) {
  return createLocale({
    currentLocale: options?.defaultLocale ?? 'en-US',
    fallbackLocale: options?.fallbackLocale ?? 'en-US',
    locales: options?.locales ?? { 'en-US': enUS },
    customTranslateFunction: options?.translate,
  })
}

export function createLocale (options: {
  currentLocale: MaybeRef<string>
  fallbackLocale: MaybeRef<string>
  locales: MaybeRef<Record<string, Locale>>
  customTranslateFunction?: CustomTranslateFunction
}) {
  console.log('before')
  const currentLocale = wrapInRef(options.currentLocale)
  console.log('after')
  const fallbackLocale = wrapInRef(options.fallbackLocale)
  const locales = wrapInRef(options.locales)
  const customTranslateFunction = options.customTranslateFunction

  const computedLocale = computed(() => {
    return locales.value[currentLocale.value] ?? locales.value[fallbackLocale.value]
  })
  const isRtl = computed(() => !!computedLocale.value?.rtl)

  return {
    isRtl,
    locales,
    currentLocale,
    fallbackLocale,
    customTranslateFunction,
    translate: createTranslateFunction(currentLocale, fallbackLocale, locales, customTranslateFunction),
  }
}

export function useLocale () {
  const locale = inject(VuetifyLocaleSymbol)

  if (!locale) throw new Error('Could not find Vuetify locale injection')

  return locale
}

export function provideLocale (props: { locale?: string, fallbackLocale?: string }) {
  const locale = useLocale()

  const currentLocale = computed(() => props.locale ?? locale.currentLocale.value)
  const fallbackLocale = computed(() => props.fallbackLocale ?? locale.fallbackLocale.value)

  console.log('provideee', currentLocale.value)

  const newLocale = createLocale({
    currentLocale,
    fallbackLocale,
    locales: locale.locales,
    customTranslateFunction: locale.customTranslateFunction,
  })

  provide(VuetifyLocaleSymbol, newLocale)

  return newLocale
}
