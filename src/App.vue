<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGameStore } from './stores/game'
import { audioService } from './services/audio'
import StatHeader from './components/StatHeader.vue'
import LicensePanel from './components/LicensePanel.vue'
import KeyerArea from './components/KeyerArea.vue'
import ClickIndicator from './components/ClickIndicator.vue'
import RareDxBonus from './components/RareDxBonus.vue'
import UpgradePanel from './components/UpgradePanel.vue'
import FactoryCard from './components/FactoryCard.vue'
import MultiBuyPanel from './components/MultiBuyPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import { FACTORIES } from './constants/factories'
import GameLoop from './components/GameLoop.vue'

const store = useGameStore()
const clickIndicatorRef = ref(null)
const activeTab = ref('factories')

const tabs = [
  { id: 'store', label: 'Store' },
  { id: 'bulk', label: 'Bulk Buy' },
  { id: 'upgrades', label: 'Upgrades' },
  { id: 'settings', label: 'Settings' }
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
  if (store.licenseLevel === 1 && store.qsos >= 500n) {
    store.licenseLevel = 2
    store.qsos -= 500n
  } else if (store.licenseLevel === 2 && store.qsos >= 5000n) {
    store.licenseLevel = 3
    store.qsos -= 5000n
  }
}

const handleFactoryBuy = ({ factory, count }) => {
  store.buyFactory(factory.id, count)
}

const handleKeyerTap = (value) => {
  if (clickIndicatorRef.value) {
    clickIndicatorRef.value.addIndicator(value)
  }
}

const handleLotteryActivated = (factory) => {
  // Bonus is already activated in the store
  // This is just for any additional UI feedback if needed
  console.log(`Lottery boost activated for ${factory.name}!`)
}

const handleSolarStormStarted = () => {
  // Solar storm is already activated in the store
  console.log('Solar Storm started! All factories output reduced by 50%')
}

const availableFactories = computed(() => {
  return FACTORIES.filter(f => f.tier <= store.licenseLevel)
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
    <div class="min-h-screen p-8 max-w-4xl mx-auto">
    <StatHeader />
    <LicensePanel @upgrade="handleLicenseUpgrade" />
    <main class="space-y-6">
      <div class="flex gap-4">
        <div class="flex-1">
          <KeyerArea @tap="handleKeyerTap" />
        </div>
        <ClickIndicator ref="clickIndicatorRef" />
      </div>
      
      <RareDxBonus 
        @lottery-activated="handleLotteryActivated"
        @solar-storm-started="handleSolarStormStarted"
      />
      
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
              'whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-colors'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
      
      <!-- Tab Content with KeepAlive -->
      <div class="space-y-4">
        <KeepAlive>
          <!-- Store Tab -->
          <div
            v-if="activeTab === 'store'"
            id="panel-store"
            role="tabpanel"
            aria-labelledby="tab-store"
            class="space-y-4"
          >
          <div class="flex justify-between items-center px-2">
            <div>
              <h2 class="text-xl font-bold text-terminal-green">Factory Store</h2>
              <p class="text-sm text-terminal-amber mt-1">
                Producing: {{ store.getTotalQSOsPerSecond().toFixed(1) }} QSOs/sec
              </p>
            </div>
            <span class="text-terminal-green text-lg">{{ store.qsos.toLocaleString() }} QSOs</span>
          </div>
          
          <div class="space-y-4">
            <FactoryCard
              v-for="factory in availableFactories"
              :key="factory.id"
              :factory="factory"
              @buy="handleFactoryBuy"
            />
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
          <div v-else class="border-2 border-terminal-green bg-terminal-bg p-4 rounded text-center">
            <p class="text-gray-400">Bulk purchasing locked</p>
            <p class="text-sm text-gray-500 mt-2">Own {{ 10 - totalFactoryCount }} more factories to unlock bulk buying</p>
            <p class="text-xs text-terminal-amber mt-1">Current: {{ totalFactoryCount }}/10 factories</p>
          </div>
        </div>
        
        <!-- Upgrades Tab -->
        <div
          v-if="activeTab === 'upgrades'"
          id="panel-upgrades"
          role="tabpanel"
          aria-labelledby="tab-upgrades"
        >
          <UpgradePanel />
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
        </KeepAlive>
      </div>
    </main>
    
    <footer class="mt-12 pt-6 border-t border-terminal-green text-center text-sm text-gray-500">
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
    </footer>
    
    <GameLoop />
  </div>
  </ErrorBoundary>
</template>
