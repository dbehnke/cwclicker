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
import { FACTORIES } from './constants/factories'
import GameLoop from './components/GameLoop.vue'

const store = useGameStore()
const clickIndicatorRef = ref(null)
const activeTab = ref('factories')

const tabs = [
  { id: 'factories', label: 'Factories' },
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

const ownedFactories = computed(() => {
  return Object.entries(store.factoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => {
      const factory = FACTORIES.find(f => f.id === id)
      return { ...factory, owned: count }
    })
})

const totalFactoryCount = computed(() => {
  return Object.values(store.factoryCounts).reduce((sum, count) => sum + count, 0)
})

const multiBuyAvailable = computed(() => totalFactoryCount.value >= 10)
</script>

<template>
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
        <nav class="flex space-x-1" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
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
      
      <!-- Tab Content -->
      <div class="space-y-4">
        <!-- Factories Tab -->
        <div v-if="activeTab === 'factories'" class="space-y-4">
          <div class="flex justify-between items-center px-2">
            <h2 class="text-xl font-bold text-terminal-green">Your Factories</h2>
            <span class="text-terminal-green">QSOs/sec: {{ store.getTotalQSOsPerSecond().toFixed(1) }}</span>
          </div>
          
          <div v-if="ownedFactories.length > 0" class="space-y-4">
            <FactoryCard
              v-for="factory in ownedFactories"
              :key="factory.id"
              :factory="factory"
              @buy="handleFactoryBuy"
            />
          </div>
          <div v-else class="border-2 border-terminal-green bg-terminal-bg p-4 rounded text-center">
            <p class="text-gray-400">No factories yet</p>
            <p class="text-sm text-gray-500 mt-2">Buy your first factory in the Store tab!</p>
          </div>
        </div>
        
        <!-- Store Tab -->
        <div v-if="activeTab === 'store'" class="space-y-4">
          <div class="flex justify-between items-center px-2">
            <h2 class="text-xl font-bold text-terminal-green">Factory Store</h2>
            <span class="text-terminal-green">QSOs: {{ store.qsos }}</span>
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
        <div v-if="activeTab === 'bulk'" class="space-y-4">
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
        <div v-if="activeTab === 'upgrades'">
          <UpgradePanel />
        </div>
        
        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'">
          <SettingsPanel />
        </div>
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
</template>
