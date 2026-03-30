<script setup>
import { onMounted, ref } from 'vue'
import IconRenderer from '../IconRenderer.vue'

const props = defineProps({
  upgrade: {
    type: Object,
    required: true,
  },
  canAfford: {
    type: Boolean,
    required: true,
  },
  formattedCost: {
    type: String,
    required: true,
  },
  formattedShortfall: {
    type: String,
    required: true,
  },
  statusMessage: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'buy'])
const sheetRef = ref(null)

onMounted(() => {
  sheetRef.value?.focus()
})

function handleBuy() {
  if (!props.canAfford) {
    return
  }

  emit('buy')
}
</script>

<template>
  <section
    ref="sheetRef"
    class="rounded border border-terminal-green/60 bg-terminal-bg/95 p-4"
    data-testid="upgrade-rail-details-sheet"
    role="dialog"
    aria-modal="false"
    aria-label="Upgrade details"
    tabindex="-1"
    @keydown.esc="emit('close')"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-wide text-terminal-amber">Upgrade Details</p>
        <h3 class="mt-1 flex items-center text-lg font-bold text-terminal-green">
          <IconRenderer :icon="upgrade.icon" type="upgrade" class="mr-2 h-6 w-6" />
          {{ upgrade.name }}
        </h3>
      </div>
      <button
        type="button"
        data-testid="upgrade-rail-details-close"
        class="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300 hover:text-terminal-green"
        @click="emit('close')"
      >
        Close
      </button>
    </div>

    <p class="mt-2 text-sm text-gray-400">{{ upgrade.description }}</p>

    <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
      <div>
        <dt class="text-gray-500">Multiplier</dt>
        <dd class="text-terminal-green">{{ upgrade.multiplier }}x</dd>
      </div>
      <div>
        <dt class="text-gray-500">Threshold</dt>
        <dd class="text-terminal-green">{{ upgrade.threshold }}</dd>
      </div>
      <div class="col-span-2">
        <dt class="text-gray-500">Cost</dt>
        <dd class="text-terminal-green">{{ formattedCost }}</dd>
      </div>
      <div v-if="!canAfford" class="col-span-2">
        <dt class="text-gray-500">Shortfall</dt>
        <dd class="text-terminal-amber">{{ formattedShortfall }}</dd>
      </div>
    </dl>

    <p class="mt-3 text-sm text-terminal-amber">{{ statusMessage }}</p>

    <div class="mt-4 flex justify-end">
      <button
        type="button"
        data-testid="upgrade-rail-buy-cta"
        class="rounded px-4 py-2 text-sm font-bold transition-colors"
        :class="
          canAfford
            ? 'bg-terminal-green text-terminal-bg hover:brightness-110'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
        "
        :disabled="!canAfford"
        @click="handleBuy"
      >
        Buy Upgrade
      </button>
    </div>
  </section>
</template>
