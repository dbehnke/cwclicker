<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGameStore } from './stores/game'
import { formatNumber, formatRate } from './utils/format'
import { audioService } from './services/audio'
import StatHeader from './components/StatHeader.vue'
import LicensePanel from './components/LicensePanel.vue'
import KeyerArea from './components/KeyerArea.vue'
import ClickIndicator from './components/ClickIndicator.vue'
import RareDxBonus from './components/RareDxBonus.vue'
import MorseChallenge from './components/MorseChallenge.vue'
import FactoryCard from './components/FactoryCard.vue'
import UpgradeRail from './components/UpgradeRail.vue'
import MultiBuyPanel from './components/MultiBuyPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import OfflineProgressNotification from './components/OfflineProgressNotification.vue'
import MigrationNotification from './components/MigrationNotification.vue'
import { FACTORIES } from './constants/factories'
import { UPGRADES } from './constants/upgrades'
import GameLoop from './components/GameLoop.vue'

const store = useGameStore()
const clickIndicatorRef = ref(null)
const activeTab = ref('store')

// App version from build-time injection (format: vX.Y.Z-N-SHA)
const appVersion = __APP_VERSION__ || 'v0.0.0-0-unknown'

const tabs = [
  { id: 'store', label: 'Store' },
  { id: 'bulk', label: 'Bulk Buy' },
  { id: 'settings', label: 'Settings' },
]

onMounted(() => {
  // Load game state
  store.load()

  // Apply audio settings from store
  if (store.audioSettings) {
    audioService.setVolume(store.audioSettings.volume)
    audioService.setFrequency(store.audioSettings.frequency)
    if (store.audioSettings.isMuted) {
      audioService.toggleMute(true)
    }
  }
})

const handleLicenseUpgrade = () => {
  // License upgrades based on total QSOs earned (like experience points)
  // General: 50 million total QSOs earned
  // Extra: 500 million total QSOs earned
  if (store.licenseLevel === 1 && store.totalQsosEarned >= 50_000_000n) {
    store.licenseLevel = 2
    if (typeof store.revealAffordableFactories === 'function') {
      store.revealAffordableFactories()
    }
    if (typeof store.save === 'function') {
      store.save()
    }
  } else if (store.licenseLevel === 2 && store.totalQsosEarned >= 500_000_000n) {
    store.licenseLevel = 3
    if (typeof store.revealAffordableFactories === 'function') {
      store.revealAffordableFactories()
    }
    if (typeof store.save === 'function') {
      store.save()
    }
  }
}

const handleFactoryBuy = ({ factory, count }) => {
  const success = store.buyFactory(factory.id, count)
  if (success) {
    store.save()
  }
}

const handleKeyerTap = value => {
  if (clickIndicatorRef.value) {
    clickIndicatorRef.value.addIndicator(value)
  }
}

const handleLotteryActivated = factory => {
  // Bonus is already activated in the store
  // This is just for any additional UI feedback if needed
}

const handleSolarStormStarted = () => {
  // Solar storm is already activated in the store
}

const availableFactories = computed(() => {
  if (typeof store.isFactoryUnlocked !== 'function') {
    return []
  }

  return FACTORIES.filter(factory => store.isFactoryUnlocked(factory.id))
})

const nextMysteryFactory = computed(() => {
  if (typeof store.isFactoryUnlocked !== 'function') {
    return null
  }

  return FACTORIES.find(factory => !store.isFactoryUnlocked(factory.id)) || null
})

const totalFactoryCount = computed(() => {
  return Object.values(store.factoryCounts).reduce((sum, count) => sum + count, 0)
})

const multiBuyAvailable = computed(() => totalFactoryCount.value >= 10)

/**
 * Handle keyboard navigation for tabs
 * @param {KeyboardEvent} event - The keyboard event
 * @param {string} tabId - The current tab ID
 */
function handleTabKeydown(event, tabId) {
  const tabIds = tabs.map(t => t.id)
  const currentIndex = tabIds.indexOf(tabId)

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1
      activeTab.value = tabIds[prevIndex]
      document.getElementById(`tab-${tabIds[prevIndex]}`)?.focus()
      break
    case 'ArrowRight':
      event.preventDefault()
      const nextIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0
      activeTab.value = tabIds[nextIndex]
      document.getElementById(`tab-${tabIds[nextIndex]}`)?.focus()
      break
    case 'Home':
      event.preventDefault()
      activeTab.value = tabIds[0]
      document.getElementById(`tab-${tabIds[0]}`)?.focus()
      break
    case 'End':
      event.preventDefault()
      activeTab.value = tabIds[tabIds.length - 1]
      document.getElementById(`tab-${tabIds[tabIds.length - 1]}`)?.focus()
      break
  }
}
</script>

<template>
  <ErrorBoundary>
    <!-- Migration Notification Modal -->
    <MigrationNotification />

    <div class="min-h-screen px-4 sm:px-8 py-8 max-w-4xl mx-auto">
      <StatHeader />
      <LicensePanel @upgrade="handleLicenseUpgrade" />
      <main class="space-y-6">
        <div class="relative flex flex-col md:flex-row gap-2 md:gap-4">
          <div class="flex-1">
            <KeyerArea @tap="handleKeyerTap" />
          </div>
          <div
            class="absolute right-0 top-0 bottom-0 pointer-events-none md:static md:pointer-events-auto"
          >
            <ClickIndicator ref="clickIndicatorRef" />
          </div>
        </div>

        <RareDxBonus
          @lottery-activated="handleLotteryActivated"
          @solar-storm-started="handleSolarStormStarted"
        />

        <MorseChallenge />

        <!-- Tab Navigation -->
        <div class="border-b border-terminal-green">
          <nav class="flex space-x-1" role="tablist" aria-label="Game sections">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :id="`tab-${tab.id}`"
              role="tab"
              :aria-selected="activeTab === tab.id"
              :aria-controls="`panel-${tab.id}`"
              :tabindex="activeTab === tab.id ? 0 : -1"
              @click="activeTab = tab.id"
              @keydown="handleTabKeydown($event, tab.id)"
              :class="[
                activeTab === tab.id
                  ? 'border-terminal-green text-terminal-green'
                  : 'border-transparent text-gray-400 hover:text-terminal-green hover:border-gray-400',
                'whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-colors',
              ]"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="space-y-4">
          <!-- Store Tab -->
          <div
            v-if="activeTab === 'store'"
            id="panel-store"
            role="tabpanel"
            aria-labelledby="tab-store"
            class="space-y-4"
          >
            <div class="flex justify-between items-center px-2" data-testid="store-header">
              <div>
                <h2 class="text-xl font-bold text-terminal-green">Factory Store</h2>
                <p class="text-sm text-terminal-amber mt-1">
                  Producing: {{ formatRate(store.getTotalQSOsPerSecond()) }} QSOs/sec
                </p>
              </div>
              <span class="text-terminal-green text-lg">{{ formatNumber(store.qsos) }} QSOs</span>
            </div>

            <UpgradeRail :upgrades="UPGRADES" :factories="FACTORIES" />

            <div class="space-y-4">
              <FactoryCard
                v-for="factory in availableFactories"
                :key="factory.id"
                :factory="factory"
                @buy="handleFactoryBuy"
              />

              <div
                v-if="nextMysteryFactory"
                class="rounded border-2 border-terminal-green/60 bg-terminal-bg p-4 opacity-90"
                data-testid="mystery-factory-card"
              >
                <div class="mb-3 flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-xl">❓</span>
                    </div>
                    <h3 class="mt-1 text-xl font-bold text-terminal-green">???</h3>
                  </div>
                  <span class="text-sm text-terminal-amber">[Tier ?]</span>
                </div>

                <p class="text-sm text-gray-400 mb-3">
                  A new signal source is nearby. Build your station to reveal it.
                </p>

                <div class="mb-4 space-y-1" data-testid="mystery-production">
                  <div class="text-terminal-amber font-semibold">???/sec</div>
                  <div class="text-sm text-gray-500">(??? × ?)</div>
                </div>

                <div
                  class="mb-4 flex items-center justify-between gap-3"
                  data-testid="mystery-action-row"
                >
                  <span class="text-terminal-green">???</span>
                  <button
                    disabled
                    class="rounded px-4 py-1 font-bold transition-colors touch-manipulation bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bulk Buy Tab -->
          <div
            v-if="activeTab === 'bulk'"
            id="panel-bulk"
            role="tabpanel"
            aria-labelledby="tab-bulk"
            class="space-y-4"
          >
            <div class="flex justify-between items-center px-2">
              <h2 class="text-xl font-bold text-terminal-green">Bulk Purchase</h2>
              <span class="text-terminal-green">Unlocks at 10 total factories</span>
            </div>

            <div v-if="multiBuyAvailable" class="space-y-4">
              <MultiBuyPanel
                v-for="factory in availableFactories"
                :key="factory.id"
                :factory="factory"
                :multi-buy-available="multiBuyAvailable"
                @buy="handleFactoryBuy"
              />
            </div>
            <div
              v-else
              class="border-2 border-terminal-green bg-terminal-bg p-4 rounded text-center"
            >
              <p class="text-gray-400">Bulk purchasing locked</p>
              <p class="text-sm text-gray-500 mt-2">
                Own {{ 10 - totalFactoryCount }} more factories to unlock bulk buying
              </p>
              <p class="text-xs text-terminal-amber mt-1">
                Current: {{ totalFactoryCount }}/10 factories
              </p>
            </div>
          </div>

          <!-- Settings Tab -->
          <div
            v-if="activeTab === 'settings'"
            id="panel-settings"
            role="tabpanel"
            aria-labelledby="tab-settings"
          >
            <SettingsPanel />
          </div>
        </div>
      </main>

      <footer
        class="mt-12 pt-6 border-t border-terminal-green text-center text-sm text-gray-500 space-y-2"
      >
        <p>
          Made with ❤️ in Macomb, MI - Inspired by
          <a
            href="https://orteil.dashnet.org/cookieclicker/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-terminal-green hover:text-terminal-amber transition-colors underline"
          >
            Cookie Clicker
          </a>
        </p>
        <p>
          <span class="text-terminal-green">{{ appVersion }}</span> -
          <a
            href="https://github.com/dbehnke/cwclicker"
            target="_blank"
            rel="noopener noreferrer"
            class="text-terminal-green hover:text-terminal-amber transition-colors underline"
          >
            GitHub
          </a>
        </p>
      </footer>

      <GameLoop />

      <!-- Offline Progress Notification -->
      <OfflineProgressNotification />
    </div>
  </ErrorBoundary>
</template>
