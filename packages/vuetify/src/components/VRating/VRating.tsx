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
    const rating = useProxiedModel(props, 'modelValue') as any as Ref<number> // TODO: Why is type not working?
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

    const buttonRefs = ref<(ComponentPublicInstance | undefined)[]>([])

    onBeforeUpdate(() => {
      buttonRefs.value = []
    })

    const onKeydown = (e: KeyboardEvent) => {
      const increment = props.halfIncrements ? 0.5 : 1
      if (e.keyCode === keyCodes.left && rating.value > 0) {
        rating.value -= increment
        nextTick(() => buttonRefs.value[Math.floor(rating.value)]?.$el.focus())
      } else if (e.keyCode === keyCodes.right && rating.value < length.value) {
        rating.value += increment
        nextTick(() => buttonRefs.value[Math.floor(rating.value - 0.5)]?.$el.focus())
      }
    }

    return () => (
      <props.tag
        class={[
          "v-rating",
          {
            'v-rating--readonly': props.readonly,
          }
        ]}
        onKeydown={onKeydown}
      >
        {icons.value.map(iconProps => slots.item ? slots.item(iconProps) : (
          <div
            key={iconProps.index}
            class={[
              "v-rating__item",
              {
                'v-rating__item--bottom': props.labelPosition === 'bottom',
              }
            ]}
          >
            {
              !iconProps.hasLabels ? undefined
              : iconProps.label ? <span>{iconProps.label}</span>
              : <span>&nbsp;</span>
            }
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
              tabindex={props.readonly ? -1 : undefined}
            />
          </div>
        ))}
      </props.tag>
    )
  }
})
