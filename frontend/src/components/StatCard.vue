<script setup lang="ts">
import AppIcon from './AppIcon.vue'
withDefaults(defineProps<{ label: string; value: number | string; note: string; icon: string; tone?: string }>(), { tone: 'green' })
</script>

<template>
  <section class="stat-card">
    <div>
      <p class="stat-label">
        {{ label }}
      </p><strong class="stat-value">{{ value }}</strong><p class="stat-note">
        {{ note }}
      </p>
    </div>
    <span
      class="stat-icon"
      :class="tone"
    ><AppIcon
      :name="icon"
      :size="23"
    /></span>
  </section>
</template>
