<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NInput,
  NProgress,
  NSelect,
  NSpace,
  NUpload,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { fileApi } from '#/api';

defineOptions({ name: 'FileUploadModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
}

/** 超过该大小自动走分片上传 */
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;
const PART_SIZE = 2 * 1024 * 1024;

const fileList = ref<any[]>([]);
const objectType = ref<null | string>(null);
const objectId = ref('');
const module = ref('');
const uploadMode = ref<'auto' | 'normal'>('auto');
const progress = ref(0);
const progressText = ref('');
const uploading = ref(false);

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function uploadMultipart(file: File) {
  const session = await fileApi.initiate({
    fileSize: file.size,
    module: module.value || undefined,
    objectId: objectId.value || undefined,
    objectType: objectType.value ?? undefined,
    originalFilename: file.name,
  });
  const totalParts = Math.ceil(file.size / PART_SIZE);
  let uploaded = 0;
  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    const start = (partNumber - 1) * PART_SIZE;
    const blob = file.slice(start, Math.min(start + PART_SIZE, file.size));
    progressText.value = `上传分片 ${partNumber}/${totalParts}`;
    await fileApi.uploadPart(new File([blob], file.name), {
      fileId: session.fileId,
      partNumber,
    });
    uploaded += 1;
    progress.value = Math.round((uploaded / totalParts) * 90);
  }
  progressText.value = '合并文件…';
  await fileApi.complete(session.fileId);
  progress.value = 100;
}

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const file = fileList.value[0]?.file as File | undefined;
    if (!file) {
      message.error('请选择文件');
      return;
    }
    uploading.value = true;
    progress.value = 0;
    progressText.value = '准备上传…';
    try {
      const useMultipart =
        uploadMode.value === 'auto' && file.size > MULTIPART_THRESHOLD;
      if (useMultipart) {
        await uploadMultipart(file);
      } else {
        progressText.value = '上传中…';
        await fileApi.upload(file, {
          module: module.value || undefined,
          objectId: objectId.value || undefined,
          objectType: objectType.value ?? undefined,
        });
        progress.value = 100;
      }
      message.success('上传成功');
      modalApi.close();
      await modalApi.getData()?.onSuccess?.();
    } catch {
      // 错误已由拦截器提示
    } finally {
      uploading.value = false;
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
    uploadMode.value = 'auto';
    progress.value = 0;
    progressText.value = '';
    uploading.value = false;
    modalApi.setState({ title: '上传文件' });
  },
});
</script>

<template>
  <Modal :confirm-loading="uploading" confirm-text="开始上传">
    <NSpace vertical :size="16" class="p-2">
      <NAlert type="info" :bordered="false">
        私有文件默认生成限时签名地址；超过 5MB 的文件将自动使用分片上传。
      </NAlert>

      <NUpload v-model:file-list="fileList" :max="1" :default-upload="false">
        <NButton>选择文件</NButton>
      </NUpload>

      <div v-if="fileList[0]?.file" class="rounded-lg bg-muted/40 p-3 text-xs">
        <div class="font-medium">{{ fileList[0].file.name }}</div>
        <div class="text-muted-foreground">
          {{ formatSize(fileList[0].file.size) }} · 将使用
          {{
            fileList[0].file.size > MULTIPART_THRESHOLD && uploadMode === 'auto'
              ? '分片'
              : '普通'
          }}上传
        </div>
      </div>

      <NSpace vertical :size="8">
        <div>
          <div class="mb-1 text-sm">对象类型</div>
          <NInput
            v-model:value="objectType"
            placeholder="如 park / customer（可选）"
            clearable
          />
        </div>
        <div>
          <div class="mb-1 text-sm">对象 ID</div>
          <NInput
            v-model:value="objectId"
            placeholder="关联业务对象 ID（可选）"
            clearable
          />
        </div>
        <div>
          <div class="mb-1 text-sm">模块标识</div>
          <NInput
            v-model:value="module"
            placeholder="如 system（可选）"
            clearable
          />
        </div>
        <div>
          <div class="mb-1 text-sm">上传方式</div>
          <NSelect
            v-model:value="uploadMode"
            :options="[
              { label: '自动（大文件分片）', value: 'auto' },
              { label: '普通上传', value: 'normal' },
            ]"
          />
        </div>
      </NSpace>

      <div v-if="uploading || progress > 0">
        <div class="mb-1 flex justify-between text-xs">
          <span>{{ progressText }}</span>
          <span>{{ progress }}%</span>
        </div>
        <NProgress :percentage="progress" :height="8" :show-indicator="false" />
      </div>
    </NSpace>
  </Modal>
</template>
