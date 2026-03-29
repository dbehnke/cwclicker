<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { buildUpgradeRailModel } from '../stores/upgradeRailModel'
import { formatNumber } from '../utils/format'
import UpgradeRailDetailsSheet from './upgrade-rail/UpgradeRailDetailsSheet.vue'

const props = defineProps({
  upgrades: {
    type: Array,
    required: true,
  },
  factories: {
    type: Array,
    required: true,
  },
})

const store = useGameStore()

const isExpanded = ref(false)
const lockedExpanded = ref(false)
const selectedUpgradeId = ref(null)
const statusMessage = ref('')
const staleFailure = ref(false)
const lastTileElementById = ref(new Map())

const model = computed(() =>
  buildUpgradeRailModel({
    upgrades: props.upgrades,
    factories: props.factories,
    qsos: store.qsos,
    factoryCounts: store.factoryCounts,
    purchasedUpgrades: store.purchasedUpgrades,
    upgradePurchaseMeta: store.upgradePurchaseMeta,
  })
)

const groups = computed(() => {
  const allGroups = [
    {
      id: 'ready',
      label: 'Ready to Buy',
      items: model.value.readyToBuy,
    },
    {
      id: 'almost',
      label: 'Almost There',
      items: model.value.almostThere,
    },
    {
      id: 'recent',
      label: 'Recently Purchased',
      items: model.value.recentlyPurchased,
    },
  ]

  return allGroups.filter(group => group.items.length > 0)
})

const selectedUpgrade = computed(() => {
  if (!selectedUpgradeId.value) {
    return null
  }

  return props.upgrades.find(upgrade => upgrade.id === selectedUpgradeId.value) || null
})

const selectedUpgradeState = computed(() => {
  if (!selectedUpgradeId.value) {
    return null
  }

  const lists = [
    model.value.readyToBuy,
    model.value.almostThere,
    model.value.recentlyPurchased,
    model.value.lockedByThreshold,
  ]

  for (const list of lists) {
    const found = list.find(item => item.id === selectedUpgradeId.value)
    if (found) {
      return found
    }
  }

  return null
})

const detailsCanAfford = computed(() => {
  if (!selectedUpgradeState.value) {
    return false
  }

  return (
    selectedUpgradeState.value.isAvailable &&
    selectedUpgradeState.value.isAffordable &&
    !staleFailure.value
  )
})

const detailsFormattedCost = computed(() => {
  if (!selectedUpgradeState.value) {
    return '0'
  }

  return formatNumber(selectedUpgradeState.value.baseCost)
})

const detailsFormattedShortfall = computed(() => {
  if (!selectedUpgradeState.value || selectedUpgradeState.value.isAffordable) {
    return '0'
  }

  return formatNumber(selectedUpgradeState.value.costDelta || 0n)
})

const detailsStatusMessage = computed(() => {
  if (statusMessage.value) {
    return statusMessage.value
  }

  if (!selectedUpgradeState.value) {
    return ''
  }

  if (!selectedUpgradeState.value.isAvailable) {
    return `Needs ${selectedUpgradeState.value.threshold} factories to unlock.`
  }

  if (!selectedUpgradeState.value.isAffordable) {
    return `Need ${detailsFormattedShortfall.value} more QSOs.`
  }

  return 'Ready to purchase.'
})

function registerTileRef(upgradeId, element) {
  if (!element) {
    lastTileElementById.value.delete(upgradeId)
    return
  }

  lastTileElementById.value.set(upgradeId, element)
}

function getUpgradeAffordabilityLabel(upgrade) {
  if (upgrade.isPurchased) {
    return 'Purchased'
  }

  if (!upgrade.isAvailable) {
    return 'Locked'
  }

  if (upgrade.isAffordable) {
    return 'Affordable'
  }

  return 'Not affordable'
}

function getUpgradeTileAriaLabel(upgrade) {
  const status = getUpgradeAffordabilityLabel(upgrade)
  const formattedCost = formatNumber(upgrade.baseCost)
  return `${upgrade.name}. ${status}. Cost ${formattedCost}.`
}

function openDetails(upgradeId, event) {
  selectedUpgradeId.value = upgradeId
  statusMessage.value = ''
  staleFailure.value = false

  if (event?.currentTarget) {
    registerTileRef(upgradeId, event.currentTarget)
  }
}

function closeDetails() {
  selectedUpgradeId.value = null
  statusMessage.value = ''
  staleFailure.value = false
}

function handleKeydown(event) {
  if (event.key === 'Escape' && selectedUpgradeId.value) {
    closeDetails()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function toggleLockedExpanded() {
  lockedExpanded.value = !lockedExpanded.value
}

function handleBuyFromDetails() {
  if (!selectedUpgradeId.value) {
    return
  }

  const success = store.buyUpgrade(selectedUpgradeId.value)

  if (!success) {
    staleFailure.value = true
    statusMessage.value = 'Could not purchase upgrade. Your QSOs changed.'
    return
  }

  staleFailure.value = false
  const tile = lastTileElementById.value.get(selectedUpgradeId.value)
  closeDetails()

  if (typeof store.save === 'function') {
    store.save()
  }

  if (tile && typeof tile.focus === 'function') {
    tile.focus()
  }
}
</script>

<template>
  <section
    class="rounded border-2 border-terminal-green bg-terminal-bg p-3"
    data-testid="upgrade-rail-root"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="upgrade in model.priorityRow"
          :key="upgrade.id"
          type="button"
          class="group relative rounded border border-terminal-green/50 bg-terminal-bg px-2 py-1 text-xl hover:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green"
          data-testid="upgrade-rail-top-tile"
          :data-upgrade-id="upgrade.id"
          :aria-label="getUpgradeTileAriaLabel(upgrade)"
          @click="openDetails(upgrade.id, $event)"
          :ref="element => registerTileRef(upgrade.id, element)"
        >
          <span>{{ upgrade.icon }}</span>
          <span
            class="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded border border-terminal-green/60 bg-terminal-bg/95 p-2 text-left text-xs text-gray-200 shadow-lg group-hover:block"
            :data-testid="`upgrade-tooltip-${upgrade.id}`"
          >
            <strong class="block text-terminal-green">{{ upgrade.name }}</strong>
            <span class="mt-1 block text-gray-300">{{ upgrade.description }}</span>
            <span class="mt-1 block">Multiplier: {{ upgrade.multiplier }}x</span>
            <span class="block">Threshold: {{ upgrade.threshold }}</span>
            <span class="block">Cost: {{ formatNumber(upgrade.baseCost) }}</span>
          </span>
        </button>
      </div>

      <button
        type="button"
        class="rounded border border-gray-600 px-3 py-1 text-xs text-terminal-amber"
        data-testid="upgrade-rail-expand-toggle"
        aria-controls="upgrade-rail-groups"
        :aria-expanded="isExpanded"
        @click="toggleExpanded"
      >
        {{ isExpanded ? 'Hide groups' : 'Show groups' }}
      </button>
    </div>

    <div
      v-if="isExpanded"
      id="upgrade-rail-groups"
      class="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1"
      data-testid="upgrade-rail-groups-container"
    >
      <section
        v-for="group in groups"
        :key="group.id"
        :data-testid="`upgrade-rail-${group.id}-group`"
      >
        <h4 class="text-sm font-semibold text-terminal-amber" data-testid="upgrade-rail-group-title">
          {{ group.label }}
        </h4>
        <div class="mt-1 flex flex-wrap gap-2" :data-testid="`upgrade-rail-${group.id}-items`">
          <button
            v-for="upgrade in group.items"
             :key="upgrade.id"
             type="button"
             class="rounded border border-gray-600 px-2 py-1 text-sm text-terminal-green"
             :data-upgrade-id="upgrade.id"
             :aria-label="getUpgradeTileAriaLabel(upgrade)"
             @click="openDetails(upgrade.id, $event)"
             :ref="element => registerTileRef(upgrade.id, element)"
           >
            {{ upgrade.icon }} {{ upgrade.name }}
          </button>
        </div>
      </section>

      <section
        v-if="model.lockedByThreshold.length > 0"
        data-testid="upgrade-rail-locked-group"
      >
        <div class="flex items-center justify-between gap-3">
          <h4 class="text-sm font-semibold text-terminal-amber" data-testid="upgrade-rail-group-title">
            Locked by Factory Count
          </h4>
          <button
            type="button"
            class="rounded border border-gray-600 px-2 py-1 text-xs text-gray-300"
            data-testid="upgrade-rail-locked-toggle"
            aria-controls="upgrade-rail-locked-items"
            :aria-expanded="lockedExpanded"
            @click="toggleLockedExpanded"
          >
            {{ lockedExpanded ? 'Hide' : 'Show' }}
          </button>
        </div>

        <div
          v-if="lockedExpanded"
          id="upgrade-rail-locked-items"
          class="mt-1 flex flex-wrap gap-2"
          data-testid="upgrade-rail-locked-items"
        >
          <button
            v-for="upgrade in model.lockedByThreshold"
             :key="upgrade.id"
             type="button"
             class="rounded border border-gray-700 px-2 py-1 text-sm text-gray-300"
             :data-upgrade-id="upgrade.id"
             :aria-label="getUpgradeTileAriaLabel(upgrade)"
             @click="openDetails(upgrade.id, $event)"
             :ref="element => registerTileRef(upgrade.id, element)"
           >
            {{ upgrade.icon }} {{ upgrade.name }}
          </button>
        </div>
      </section>
    </div>

    <UpgradeRailDetailsSheet
      v-if="selectedUpgrade && selectedUpgradeState"
      class="mt-3"
      :upgrade="selectedUpgrade"
      :can-afford="detailsCanAfford"
      :formatted-cost="detailsFormattedCost"
      :formatted-shortfall="detailsFormattedShortfall"
      :status-message="detailsStatusMessage"
      @buy="handleBuyFromDetails"
      @close="closeDetails"
    />
  </section>
</template>
