<script setup>
import { ref, onErrorCaptured } from 'vue';

/**
 * Global error boundary component that catches and displays runtime errors.
 * Wraps the entire application to provide graceful error handling.
 */
const hasError = ref(false);
const error = ref(null);
const errorInfo = ref('');

/**
 * Capture errors from child components
 */
onErrorCaptured((err, instance, info) => {
  console.error('Error caught by boundary:', err);
  console.error('Component:', instance);
  console.error('Info:', info);
  
  error.value = err;
  errorInfo.value = info;
  hasError.value = true;
  
  // Prevent error from propagating further
  return false;
});

/**
 * Reload the page to recover from error
 */
function reloadPage() {
  window.location.reload();
}

/**
 * Reset error state and try to continue
 */
function dismissError() {
  hasError.value = false;
  error.value = null;
  errorInfo.value = '';
}
</script>

<template>
  <div class="error-boundary">
    <slot v-if="!hasError" />
    
    <div 
      v-else 
      class="min-h-screen bg-terminal-bg p-8 flex items-center justify-center"
    >
      <div class="max-w-2xl w-full border-2 border-red-600 bg-gray-900 p-8 rounded">
        <div class="text-center mb-6">
          <span class="text-6xl">💥</span>
        </div>
        
        <h1 class="text-2xl font-bold text-red-500 text-center mb-4">
          Something went wrong!
        </h1>
        
        <div class="bg-gray-800 p-4 rounded mb-6 font-mono text-sm">
          <p class="text-red-400 mb-2">
            <strong>Error:</strong> {{ error?.message || 'Unknown error' }}
          </p>
          <p v-if="errorInfo" class="text-gray-400">
            <strong>Location:</strong> {{ errorInfo }}
          </p>
        </div>
        
        <p class="text-gray-300 mb-6 text-center">
          The game encountered an unexpected error. Your progress has been saved.
        </p>
        
        <div class="flex gap-4 justify-center">
          <button
            @click="reloadPage"
            class="px-6 py-3 bg-red-600 text-white font-bold rounded transition-colors touch-manipulation hover:brightness-110 active:brightness-95"
          >
            🔄 Reload Game
          </button>
          
          <button
            @click="dismissError"
            class="px-6 py-3 bg-gray-600 text-white font-bold rounded transition-colors touch-manipulation hover:brightness-110 active:brightness-95"
          >
            Try to Continue
          </button>
        </div>
        
        <p class="text-xs text-gray-500 mt-6 text-center">
          If this error persists, please export your save data from the Settings tab before reloading.
        </p>
      </div>
    </div>
  </div>
</template>
