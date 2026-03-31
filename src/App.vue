<script setup>
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { useGameStore } from './stores/game'
import { audioService } from './services/audio'
import { formatNumber } from './utils/format'
import StatHeader from './components/StatHeader.vue'
import LicensePanel from './components/LicensePanel.vue'
import KeyerArea from './components/KeyerArea.vue'
import ClickIndicator from './components/ClickIndicator.vue'
import RareDxBonus from './components/RareDxBonus.vue'
import MorseChallenge from './components/MorseChallenge.vue'
import FactoryList from './components/FactoryList.vue'
import StoreLane from './components/StoreLane.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import OfflineProgressNotification from './components/OfflineProgressNotification.vue'
import MigrationNotification from './components/MigrationNotification.vue'
import GameLoop from './components/GameLoop.vue'

const store = useGameStore()
const clickIndicatorRef = ref(null)
const activeTab = ref('keyer')
const isSettingsExpanded = ref(false)
const originalDocumentTitle = typeof document !== 'undefined' ? document.title : ''

// App version from build-time injection (format: vX.Y.Z-N-SHA)
const appVersion = __APP_VERSION__ || 'v0.0.0-0-unknown'

const tabs = [
  { id: 'keyer', label: 'Keyer' },
  { id: 'grid', label: 'Grid' },
  { id: 'store', label: 'Store' },
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

watchEffect(() => {
  if (typeof document === 'undefined') {
    return
  }

  document.title = `${formatNumber(store.qsos)} QSOs - CW Clicker`
})

onUnmounted(() => {
  if (typeof document === 'undefined') {
    return
  }

  document.title = originalDocumentTitle
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

    <div class="min-h-screen px-4 py-8 sm:px-8 max-w-7xl mx-auto">
      <main class="space-y-6">
        <div class="border-b border-terminal-green lg:hidden">
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

        <div class="lg:grid lg:grid-cols-12 lg:gap-4 lg:h-[calc(100vh-14rem)]">
          <section
            data-testid="desktop-lane-keyer"
            class="hidden space-y-4 lg:col-span-4 lg:flex lg:flex-col lg:min-h-0 lg:overflow-y-auto"
          >
            <div
              data-testid="keyer-lane-header"
              class="sticky top-0 z-30 bg-terminal-bg/95 backdrop-blur-sm pb-2"
            >
              <StatHeader />
            </div>
            <LicensePanel @upgrade="handleLicenseUpgrade" />
            <div class="relative flex flex-col gap-2 md:gap-4">
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
          </section>

          <section
            data-testid="desktop-lane-grid"
            class="lg:col-span-4 lg:min-h-0 lg:overflow-y-auto hidden lg:block"
          >
            <FactoryList />
          </section>

          <section
            data-testid="desktop-lane-store"
            class="lg:col-span-4 lg:min-h-0 lg:overflow-y-auto hidden lg:block"
          >
            <StoreLane />
          </section>

          <section
            v-if="activeTab === 'keyer'"
            id="panel-keyer"
            role="tabpanel"
            aria-labelledby="tab-keyer"
            class="space-y-4 lg:hidden"
          >
            <div class="sticky top-0 z-30 bg-terminal-bg/95 backdrop-blur-sm pb-2">
              <StatHeader />
            </div>
            <LicensePanel @upgrade="handleLicenseUpgrade" />
            <div class="relative flex flex-col gap-2 md:gap-4">
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
          </section>

          <section
            v-if="activeTab === 'grid'"
            id="panel-grid"
            role="tabpanel"
            aria-labelledby="tab-grid"
            class="lg:hidden"
          >
            <FactoryList />
          </section>

          <section
            v-if="activeTab === 'store'"
            id="panel-store"
            role="tabpanel"
            aria-labelledby="tab-store"
            class="lg:hidden"
          >
            <StoreLane />
          </section>
        </div>

        <section class="space-y-2">
          <button
            data-testid="settings-toggle"
            class="w-full flex items-center justify-between text-left text-lg font-bold text-terminal-green border border-terminal-green/50 rounded px-3 py-2 hover:bg-terminal-green/10 transition-colors"
            :aria-expanded="isSettingsExpanded"
            @click="isSettingsExpanded = !isSettingsExpanded"
          >
            <span>Settings</span>
            <span>{{ isSettingsExpanded ? '▲' : '▼' }}</span>
          </button>
          <SettingsPanel v-if="isSettingsExpanded" />
        </section>
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
