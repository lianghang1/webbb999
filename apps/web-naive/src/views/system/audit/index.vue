<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NTabPane, NTabs } from 'naive-ui';

import LoginLog from './login-log.vue';
import OperateLog from './operate-log.vue';

defineOptions({ name: 'AuditIndex' });

const activeTab = ref('login');
</script>

<template>
  <Page auto-content-height title="审计日志">
    <NTabs
      v-model:value="activeTab"
      type="line"
      animated
      class="h-full flex-col"
      :pane-wrapper-style="{ flex: 1, minHeight: 0 }"
      pane-class="h-full"
    >
      <NTabPane name="login" tab="登录日志" :pane-style="{ height: '100%' }">
        <LoginLog v-if="activeTab === 'login'" />
      </NTabPane>
      <NTabPane name="operate" tab="操作日志" :pane-style="{ height: '100%' }">
        <OperateLog v-if="activeTab === 'operate'" />
      </NTabPane>
    </NTabs>
  </Page>
</template>
