<script setup>
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: value => ['factory', 'upgrade', 'misc'].includes(value),
  },
  fallback: {
    type: String,
    default: 'Zap',
  },
  size: {
    type: [Number, String],
    default: 24,
  },
  className: {
    type: String,
    default: '',
  },
})

const iconPath = computed(() => {
  const folder =
    props.type === 'factory' ? 'factories' : props.type === 'upgrade' ? 'upgrades' : 'misc'
  // Using absolute path for public/assets or dynamic import for src/assets
  // Since we are in src/assets/icons, we'll use a dynamic URL pattern
  // Note: In Vite, we can use new URL(...) for static assets
  return new URL(`../assets/icons/${folder}/${props.icon}`, import.meta.url).href
})

const FallbackIcon = computed(() => {
  return LucideIcons[props.fallback] || LucideIcons.Zap
})

// Function to handle image error (fallback to Lucide)
const handleImageError = event => {
  event.target.style.display = 'none'
  event.target.nextElementSibling.style.display = 'block'
}
</script>

<template>
  <div class="relative flex items-center justify-center" :class="className">
    <img
      :src="iconPath"
      :width="size"
      :height="size"
      class="pixel-art"
      @error="handleImageError"
      alt=""
    />
    <component :is="FallbackIcon" :size="size" class="hidden" aria-hidden="true" />
  </div>
</template>

<style scoped>
.pixel-art {
  image-rendering: pixelated;
}
</style>
