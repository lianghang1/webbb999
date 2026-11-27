<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NInput, NSpace, NUpload } from 'naive-ui';

import { message } from '#/adapter/naive';
import { fileApi } from '#/api';

defineOptions({ name: 'FileUploadModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
}

const fileList = ref<any[]>([]);
const objectType = ref<null | string>(null);
const objectId = ref('');
const module = ref('');

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (fileList.value.length === 0) {
      message.error('请选择文件');
      return;
    }
    const file = fileList.value[0].file;
    if (!file) {
      message.error('文件未就绪');
      return;
    }
    try {
      await fileApi.upload(file, {
        objectType: objectType.value ?? undefined,
        objectId: objectId.value || undefined,
        module: module.value || undefined,
      });
      message.success('上传成功');
      modalApi.close();
      const data = modalApi.getData();
      await data?.onSuccess?.();
    } catch {
      // 错误已由拦截器提示
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    fileList.value = [];
    objectType.value = null;
    objectId.value = '';
    module.value = '';
    modalApi.setState({ title: '上传文件' });
  },
});
</script>

<template>
  <Modal>
    <NSpace vertical :size="16" class="p-4">
      <NUpload v-model:file-list="fileList" :max="1" :default-upload="false">
        <NButton>选择文件</NButton>
      </NUpload>
      <NSpace vertical :size="8">
        <div>
          <div class="mb-1">对象类型</div>
          <NInput v-model:value="objectType" placeholder="如 park / customer" />
        </div>
        <div>
          <div class="mb-1">对象ID</div>
          <NInput
            v-model:value="objectId"
            placeholder="关联的业务对象ID（可选）"
          />
        </div>
        <div>
          <div class="mb-1">模块</div>
          <NInput v-model:value="module" placeholder="模块标识（可选）" />
        </div>
      </NSpace>
    </NSpace>
  </Modal>
</template>
