<script lang="ts" setup>
import type { SysConfig } from '#/api/system/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NAlert, NButton, NInput, NSpin, NSwitch, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import { configApi } from '#/api';

defineOptions({ name: 'ConfigSecretModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: SysConfig;
}

const needEncrypt = ref(true);
const secretValue = ref('');
const plainText = ref('');
const plainVisible = ref(false);
const plainLoading = ref(false);
const saving = ref(false);

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const data = modalApi.getData();
    if (!data?.record?.id) {
      return;
    }
    if (!secretValue.value && !plainVisible.value) {
      message.warning('请输入新的敏感值');
      return;
    }
    saving.value = true;
    try {
      await configApi.setSecret({
        configValue: secretValue.value || undefined,
        id: data.record.id,
        needEncrypt: needEncrypt.value,
      });
      message.success('敏感参数已更新');
      modalApi.close();
      await data?.onSuccess?.();
    } finally {
      saving.value = false;
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    needEncrypt.value = data?.record?.needEncrypt ?? true;
    secretValue.value = '';
    plainText.value = '';
    plainVisible.value = false;
    plainLoading.value = false;
    modalApi.setState({
      title: `敏感参数 · ${data?.record?.configKey ?? ''}`,
    });
  },
});

async function loadPlain() {
  const data = modalApi.getData();
  if (!data?.record?.id) {
    return;
  }
  plainLoading.value = true;
  try {
    plainText.value = await configApi.getSecretPlain(data.record.id);
    plainVisible.value = true;
  } catch {
    message.error('读取明文失败，请确认是否有敏感参数权限');
  } finally {
    plainLoading.value = false;
  }
}
</script>

<template>
  <Modal :confirm-loading="saving" confirm-text="保存敏感参数">
    <div class="space-y-4 px-1">
      <NAlert type="warning" :bordered="false">
        敏感参数的查看与修改均单独记录审计日志。留空表示不修改值，仅调整加密标志。
      </NAlert>

      <div class="flex items-center justify-between rounded-lg bg-muted/40 p-3">
        <div>
          <div class="text-sm font-medium">
            {{ modalApi.getData()?.record?.configKey }}
          </div>
          <div class="text-xs text-muted-foreground">
            分组：{{ modalApi.getData()?.record?.configGroup || 'DEFAULT' }}
          </div>
        </div>
        <NTag :type="needEncrypt ? 'error' : 'default'" size="small" round>
          {{ needEncrypt ? '加密存储' : '明文存储' }}
        </NTag>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">当前明文</span>
          <NButton
            size="tiny"
            quaternary
            type="primary"
            :loading="plainLoading"
            @click="loadPlain"
          >
            {{ plainVisible ? '重新读取' : '查看明文' }}
          </NButton>
        </div>
        <NSpin :show="plainLoading">
          <NInput
            v-if="plainVisible"
            :value="plainText"
            readonly
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 5 }"
            class="font-mono"
          />
          <div
            v-else
            class="flex h-12 items-center justify-center rounded-md border border-dashed border-muted text-xs text-muted-foreground"
          >
            出于安全考虑，明文需单独授权读取
          </div>
        </NSpin>
      </div>

      <div>
        <div class="mb-2 text-sm font-medium">设置新值</div>
        <NInput
          v-model:value="secretValue"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 8 }"
          placeholder="输入新的敏感值，留空则不修改"
          class="font-mono"
        />
      </div>

      <div
        class="flex items-center justify-between rounded-lg border border-muted p-3"
      >
        <div>
          <div class="text-sm font-medium">加密存储</div>
          <div class="text-xs text-muted-foreground">
            开启后数据库仅保存密文，列表页不回显明文
          </div>
        </div>
        <NSwitch v-model:value="needEncrypt" />
      </div>
    </div>
  </Modal>
</template>
