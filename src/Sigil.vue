<script setup>
defineProps({ kind: { type: String, default: "shield" } });
</script>
<template>
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="kind === 'sword'">
      <path d="M48 10L59 23 58 61 50 69 42 61 41 23Z" />
      <path d="M27 65Q50 52 73 65M50 67V86M41 89H59M46 25V52" />
      <circle cx="50" cy="88" r="6" />
    </template>
    <template v-else-if="kind === 'shield'">
      <path d="M20 23Q50 10 80 23V53Q77 73 50 89Q23 73 20 53Z" />
      <path
        d="M29 30Q50 23 71 30V52Q68 66 50 78Q32 66 29 52ZM50 28V77M30 48H70"
      />
    </template>
    <template v-else-if="kind === 'spear'">
      <path
        d="M50 7L63 29 50 43 37 29ZM50 42V91M35 51L65 51M32 67L20 55M68 67L80 55M39 86H61"
      />
      <path d="M50 17V33" />
    </template>
    <template v-else-if="kind === 'heart'">
      <path
        d="M50 83C18 65 14 48 22 34C30 21 43 23 50 36C57 23 70 21 78 34C86 48 82 65 50 83Z"
      />
      <path d="M37 52H63M50 39V65" />
    </template>
    <template v-else-if="kind === 'spark'">
      <path
        d="M50 9L58 35 82 26 67 49 88 64 61 64 59 91 45 69 22 83 33 59 10 45 38 42Z"
      />
      <circle cx="50" cy="51" r="8" />
    </template>
    <template v-else-if="kind === 'crown'">
      <path d="M16 32L32 48 50 20 68 48 84 32 74 73H26ZM27 81H73M32 62H68" />
      <circle cx="50" cy="12" r="4" />
      <circle cx="12" cy="26" r="4" />
      <circle cx="88" cy="26" r="4" />
    </template>
    <template v-else>
      <path
        d="M50 9L78 25V60L50 89 22 60V25ZM36 36L50 25 64 36 59 65H41ZM30 49L46 45M70 49L54 45M50 47V64M44 72H56"
      />
    </template>
  </svg>
</template>
