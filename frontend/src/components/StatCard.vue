<script setup lang="ts">
import AppIcon from './AppIcon.vue'
withDefaults(defineProps<{ label: string; value: number | string; note: string; icon: string; tone?: string }>(), { tone: 'green' })
</script>

<template>
  <section class="bg-white border border-solid border-[#e4ebe6] rounded-[8px] flex justify-between gap-1.75 p-5 wide:p-6 tablet:p-4 compact:p-4">
    <div>
      <p class="text-[12px] text-[#728479] mb-2.5">
        {{ label }}
      </p><strong class="block text-[30px] leading-none font-semibold tabular-nums tracking-[-.8px]">{{ value }}</strong><p class="text-[10px] text-[#96a39c] leading-[1.5] tablet:text-[9px] compact:text-[10px] mt-3.25">
        {{ note }}
      </p>
    </div>
    <span
      class="w-10 h-10 shrink-0 rounded-[10px] grid place-items-center text-[#3a8d6b] bg-[#edf5f0] data-[tone=amber]:text-[#b59453] data-[tone=amber]:bg-[#faf4e7] data-[tone=blue]:text-[#6b8dac] data-[tone=blue]:bg-[#edf2f8] data-[tone=red]:text-[#b77575] data-[tone=red]:bg-[#f9eeee] tablet:w-7.5 tablet:h-8.5 compact:w-7.5 compact:h-8.5"
      :data-tone="tone"
    ><AppIcon
      :name="icon"
      :size="23"
    /></span>
  </section>
</template>
