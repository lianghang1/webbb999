<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { NSelect } from 'naive-ui';

import { useCemeteryStore } from '#/store';

defineOptions({
  name: 'ParkSwitcher',
});

const store = useCemeteryStore();

const options = computed(() =>
  store.parks.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

onMounted(async () => {
  await store.ensureParks();
});
</script>

<template>
  <div class="mr-1 flex items-center">
    <NSelect
      v-model:value="store.currentParkId"
      :options="options"
      placeholder="选择园区"
      size="small"
      style="width: 190px"
    />
  </div>
</template>
