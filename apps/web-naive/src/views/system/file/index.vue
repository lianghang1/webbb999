<script lang="ts" setup>
import type { FileDTO } from '#/api/system/file';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NButton, NImage, NTag, NTooltip } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fileApi } from '#/api';

import FileUploadModal from './file-upload-modal.vue';

defineOptions({ name: 'SystemFile' });

const totalText = ref('共 0 条');

interface GridQueryParams {
  form?: {
    fileType?: string;
    originalFilename?: string;
  };
  page: { currentPage: number; pageSize: number };
}

function formatSize(bytes?: number) {
  if (!bytes && bytes !== 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function download(row: FileDTO) {
  if (row.url) {
    window.open(row.url, '_blank', 'noopener,noreferrer');
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        component: 'Input',
        componentProps: { placeholder: '文件名包含…', clearable: true },
        fieldName: 'originalFilename',
        label: '文件名',
      },
      {
        component: 'Select',
        componentProps: {
          clearable: true,
          options: [
            { label: '图片', value: 'IMAGE' },
            { label: '文档', value: 'DOCUMENT' },
            { label: '音视频', value: 'MEDIA' },
            { label: '其他', value: 'OTHER' },
          ],
        },
        fieldName: 'fileType',
        label: '文件类型',
      },
    ],
  },
  gridOptions: {
    columns: [
      {
        field: 'thumbUrl',
        title: '预览',
        width: 76,
        slots: { default: 'preview' },
      },
      { field: 'originalFilename', title: '文件名', minWidth: 220 },
      {
        field: 'fileSize',
        title: '大小',
        width: 100,
        slots: { default: 'fileSize' },
      },
      {
        field: 'contentType',
        title: 'MIME',
        minWidth: 160,
      },
      { field: 'objectType', title: '对象类型', width: 120 },
      { field: 'fileType', title: '类型', width: 100 },
      {
        field: 'actions',
        fixed: 'right',
        title: '操作',
        width: 130,
        slots: { default: 'actions' },
      },
    ],
    proxyConfig: {
      ajax: {
        query: async ({ form, page }: GridQueryParams) => {
          const params: Record<string, unknown> = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
          };
          if (form?.originalFilename) {
            params.CN_originalFilename = form.originalFilename;
          }
          if (form?.fileType) {
            params.EQ_fileType = form.fileType;
          }
          const result = await fileApi.list(params);
          const items = result.list as FileDTO[];
          const totalBytes = items.reduce(
            (sum, item) => sum + (item.fileSize || 0),
            0,
          );
          totalText.value = `共 ${result.total} 条 · 本页 ${formatSize(totalBytes)}`;
          return { items: result.list, total: result.total };
        },
      },
    },
    rowConfig: { keyField: 'id' },
  },
});

const [UploadModal, uploadModalApi] = useVbenModal({
  connectedComponent: FileUploadModal,
});

function openUpload() {
  uploadModalApi.setData({ onSuccess: () => gridApi.query() });
  uploadModalApi.open();
}
</script>

<template>
  <Page auto-content-height title="文件管理">
    <Grid>
      <template #toolbar-actions>
        <NButton size="small" type="primary" @click="openUpload">
          上传文件
        </NButton>
        <span class="text-xs text-muted-foreground self-center">{{
          totalText
        }}</span>
      </template>
      <template #preview="{ row }">
        <NImage
          v-if="row.thumbUrl || row.url"
          :preview-src="row.url || row.thumbUrl"
          :src="row.thumbUrl || row.url"
          width="40"
          height="40"
        />
        <NTag v-else size="small" :bordered="false">—</NTag>
      </template>
      <template #fileSize="{ row }">
        {{ formatSize(row.fileSize as number) }}
      </template>
      <template #actions="{ row }">
        <NTooltip :disabled="!!row.url">
          <template #trigger>
            <NButton
              size="tiny"
              quaternary
              type="primary"
              :disabled="!row.url"
              @click="download(row as FileDTO)"
            >
              下载
            </NButton>
          </template>
          {{ row.url ? '打开签名下载地址' : '暂无可访问地址' }}
        </NTooltip>
      </template>
    </Grid>
    <UploadModal />
  </Page>
</template>
