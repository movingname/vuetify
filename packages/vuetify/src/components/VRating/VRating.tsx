// Styles
import './VRating.sass'

// Components
import { VBtn } from '../VBtn'

// Composables
import { useProxiedModel } from '@/composables/proxiedModel'
import { makeDensityProps } from '@/composables/density'
import { makeSizeProps } from '@/composables/size'
import { makeTagProps } from '@/composables/tag'

// Utilities
import { ComponentPublicInstance, computed, defineComponent, nextTick, onBeforeUpdate, Prop, Ref, ref } from 'vue'
import { createRange, keyCodes } from '@/util/helpers'
import makeProps from '@/util/makeProps'

export default defineComponent({
  name: 'VRating',

  props: makeProps({
    backgroundColor: {
      type: String,
      default: 'accent',
    },
    color: {
      type: String,
      default: 'primary',
    },
    clearable: Boolean,
    dense: Boolean,
    emptyIcon: {
      type: String,
      default: '$ratingEmpty',
    },
    fullIcon: {
      type: String,
      default: '$ratingFull',
    },
    halfIcon: {
      type: String,
      default: '$ratingHalf',
    },
    halfIncrements: Boolean,
    hover: Boolean,
    length: {
      type: [Number, String],
      default: 5,
    },
    readonly: Boolean,
    modelValue: {
      type: Number,
      default: 0,
    },
    ariaLabel: {
      type: String,
      default: '$vuetify.rating.ariaLabel.icon',
    },
    disabled: Boolean,
    labels: Array as Prop<string[]>,
    labelPosition: {
      type: String,
      default: 'top',
      validator: (v: any) => ['top', 'bottom'].includes(v),
    },
    ripple: Boolean,
    ...makeDensityProps(),
    ...makeSizeProps(),
    ...makeTagProps(),
  }),

  setup (props, { slots }) {
    const rating = useProxiedModel(props, 'modelValue') as any as Ref<number>
    const length = computed(() => Number(props.length))

    const icons = computed(() => {
      const hoverIndex = ref(-1)
      const isHovering = computed(() => props.hover && hoverIndex.value > -1)

      const isHalfEvent = (e: MouseEvent): boolean => {
        const rect = e.target && (e.target as HTMLElement).getBoundingClientRect()
        const isHalf = !!rect && (e.pageX - rect.left) < rect.width / 2

        // TODO: handle rtl
        // return isRtl ? !isHalf : isHalf
        return isHalf
      }

      const genHoverIndex = (e: MouseEvent, i: number) => {
        const isHalf = props.halfIncrements && isHalfEvent(e)

        return i + (isHalf ? 0.5 : 1)
      }

      const createSlotProps = (index: number) => {
        const isFilled = Math.floor(rating.value) > index
        const isHovered = Math.floor(hoverIndex.value) > index
        const isHalfHovered = !isHovered && (hoverIndex.value - index) % 1 > 0
        const isHalfFilled = !isFilled && (rating.value - index) % 1 > 0

        const isFullIcon = isHovering.value ? isHovered : isFilled
        const isHalfIcon = isHovering.value ? isHalfHovered : isHalfFilled

        const icon = isFullIcon ? props.fullIcon : isHalfIcon ? props.halfIcon : props.emptyIcon

        const onMouseenter = (e: MouseEvent): void => {
          hoverIndex.value = genHoverIndex(e, index)
        }

        const onMouseleave = (): void => {
          hoverIndex.value = -1
        }

        return {
          onMouseenter: props.hover ? onMouseenter : undefined,
          onMouseleave: props.hover ? onMouseleave : undefined,
          onMousemove: props.hover && props.halfIncrements ? onMouseenter : undefined,
          onClick: (e: MouseEvent) => {
            if (props.readonly) return

            if (e.detail === 0) {
              const currentIndex = Math.floor(rating.value)
              if (rating.value - 1 === index && props.clearable) {
                rating.value = 0
              } else if (currentIndex !== index || !props.halfIncrements) {
                rating.value = index + (props.halfIncrements ? 0.5 : 1)
              } else {
                rating.value += 0.5
              }
            } else {
              let newValue = genHoverIndex(e, index)
              if (props.clearable && rating.value === newValue) {
                rating.value = 0
              } else {
                rating.value = newValue
              }
            }
          },
          icon,
          color: isFilled || isHalfFilled || isHovered ? props.color : props.backgroundColor,
          size: props.size,
          disabled: props.disabled,
          // TODO: fix when locale is done
          // ariaLabel: this.$vuetify.lang.t(props.iconLabel, index + 1, length.value)
          ariaLabel: String(index + 1),
          isFilled,
          isHovered,
          isHalfHovered,
          isHalfFilled,
          index,
          value: rating.value,
          hasLabels: !!props.labels?.length,
          label: props.labels && props.labels[index],
          ripple: props.ripple,
          density: props.density,
          readonly: props.readonly,
        }
      }

      return createRange(length.value).map(i => createSlotProps(i))
    })

    const buttonRefs = ref<ComponentPublicInstance[]>([])

    onBeforeUpdate(() => {
      buttonRefs.value = []
    })

    const onKeydown = (e: KeyboardEvent) => {
      const increment = props.halfIncrements ? 0.5 : 1
      if (e.keyCode === keyCodes.left && rating.value > 0) {
        rating.value -= increment
        nextTick(() => buttonRefs.value[Math.floor(rating.value)].$el.focus())
      } else if (e.keyCode === keyCodes.right && rating.value < length.value) {
        rating.value += increment
        nextTick(() => buttonRefs.value[Math.floor(rating.value - 0.5)].$el.focus())
      }
    }

    return () => (
      <props.tag
        class={[
          "v-rating",
          {
            'v-rating--readonly': props.readonly,
            'v-rating--dense': props.dense,
          }
        ]}
        onKeydown={onKeydown}
      >
        {icons.value.map((iconProps) => slots.item ? slots.item(iconProps) : (
          <div
            key={iconProps.index}
            class={[
              "v-rating__item",
              {
                'v-rating__item--bottom': props.labelPosition === 'bottom',
              }
            ]}
          >
            {iconProps.hasLabels ? iconProps.label ? <span>{iconProps.label}</span> : <span>&nbsp;</span> : undefined}
            <VBtn
              ref={(e: any) => e && (buttonRefs.value[iconProps.index] = e)}
              color={iconProps.color}
              ripple={iconProps.ripple}
              size={iconProps.size}
              icon={iconProps.icon}
              onClick={iconProps.onClick}
              onMouseenter={iconProps.onMouseenter}
              onMouseleave={iconProps.onMouseleave}
              onMousemove={iconProps.onMousemove}
              aria-label={iconProps.ariaLabel}
              disabled={iconProps.disabled}
              density={props.density}
              // tabindex={props.readonly ? -1 : undefined}
            />
          </div>
        ))}
      </props.tag>
    )
  }

  // data () {
  //   return {
  //     hoverIndex: -1,
  //     internalValue: this.value,
  //   }
  // },

  // computed: {
  //   directives (): VNodeDirective[] {
  //     if (this.readonly || !this.ripple) return []

  //     return [{
  //       name: 'ripple',
  //       value: { circle: true },
  //     } as VNodeDirective]
  //   },
  //   iconProps (): object {
  //     const {
  //       dark,
  //       large,
  //       light,
  //       medium,
  //       small,
  //       size,
  //       xLarge,
  //       xSmall,
  //     } = this.$props

  //     return {
  //       dark,
  //       large,
  //       light,
  //       medium,
  //       size,
  //       small,
  //       xLarge,
  //       xSmall,
  //     }
  //   },
  //   isHovering (): boolean {
  //     return this.hover && this.hoverIndex >= 0
  //   },
  // },

  // watch: {
  //   internalValue (val) {
  //     val !== this.value && this.$emit('input', val)
  //   },
  //   value (val) {
  //     this.internalValue = val
  //   },
  // },

  // methods: {
  //   createClickFn (i: number): Function {
  //     return (e: MouseEvent) => {
  //       if (this.readonly) return

  //       const newValue = this.genHoverIndex(e, i)
  //       if (this.clearable && this.internalValue === newValue) {
  //         this.internalValue = 0
  //       } else {
  //         this.internalValue = newValue
  //       }
  //     }
  //   },
  //   createProps (i: number): ItemSlotProps {
  //     const props: ItemSlotProps = {
  //       index: i,
  //       value: this.internalValue,
  //       click: this.createClickFn(i),
  //       isFilled: Math.floor(this.internalValue) > i,
  //       isHovered: Math.floor(this.hoverIndex) > i,
  //     }

  //     if (this.halfIncrements) {
  //       props.isHalfHovered = !props.isHovered && (this.hoverIndex - i) % 1 > 0
  //       props.isHalfFilled = !props.isFilled && (this.internalValue - i) % 1 > 0
  //     }

  //     return props
  //   },
  //   genHoverIndex (e: MouseEvent, i: number) {
  //     let isHalf = this.isHalfEvent(e)

  //     if (
  //       this.halfIncrements &&
  //       this.$vuetify.rtl
  //     ) {
  //       isHalf = !isHalf
  //     }

  //     return i + (isHalf ? 0.5 : 1)
  //   },
  //   getIconName (props: ItemSlotProps): string {
  //     const isFull = this.isHovering ? props.isHovered : props.isFilled
  //     const isHalf = this.isHovering ? props.isHalfHovered : props.isHalfFilled

  //     return isFull ? this.fullIcon : isHalf ? this.halfIcon : this.emptyIcon
  //   },
  //   getColor (props: ItemSlotProps): string {
  //     if (this.isHovering) {
  //       if (props.isHovered || props.isHalfHovered) return this.color
  //     } else {
  //       if (props.isFilled || props.isHalfFilled) return this.color
  //     }

  //     return this.backgroundColor
  //   },
  //   isHalfEvent (e: MouseEvent): boolean {
  //     if (this.halfIncrements) {
  //       const rect = e.target && (e.target as HTMLElement).getBoundingClientRect()
  //       if (rect && (e.pageX - rect.left) < rect.width / 2) return true
  //     }

  //     return false
  //   },
  //   onMouseEnter (e: MouseEvent, i: number): void {
  //     this.runDelay('open', () => {
  //       this.hoverIndex = this.genHoverIndex(e, i)
  //     })
  //   },
  //   onMouseLeave (): void {
  //     this.runDelay('close', () => (this.hoverIndex = -1))
  //   },
  //   genItem (i: number): VNode | VNodeChildren | string {
  //     const props = this.createProps(i)

  //     if (this.$scopedSlots.item) return this.$scopedSlots.item(props)

  //     const listeners: Record<string, Function> = {
  //       click: props.click,
  //     }

  //     if (this.hover) {
  //       listeners.mouseenter = (e: MouseEvent) => this.onMouseEnter(e, i)
  //       listeners.mouseleave = this.onMouseLeave

  //       if (this.halfIncrements) {
  //         listeners.mousemove = (e: MouseEvent) => this.onMouseEnter(e, i)
  //       }
  //     }

  //     return this.$createElement(VIcon, this.setTextColor(this.getColor(props), {
  //       attrs: {
  //         'aria-label': this.$vuetify.lang.t(this.iconLabel, i + 1, Number(this.length)),
  //       },
  //       directives: this.directives,
  //       props: this.iconProps,
  //       on: listeners,
  //     }), [this.getIconName(props)])
  //   },
  // },

  // render (h): VNode {
  //   const children = createRange(Number(this.length)).map(i => this.genItem(i))

  //   return h('div', {
  //     staticClass: 'v-rating',
  //     class: {
  //       'v-rating--readonly': this.readonly,
  //       'v-rating--dense': this.dense,
  //     },
  //   }, children)
  // },
})
