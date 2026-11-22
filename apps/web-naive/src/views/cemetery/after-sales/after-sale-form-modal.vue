<script lang="ts" setup>
import { onMounted } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { AFTER_SALE_TYPE, createAfterSaleApi } from '#/api/cemetery/biz';
import { getPlotListApi } from '#/api/cemetery/plot';
import { useCemeteryStore } from '#/store';

defineOptions({ name: 'AfterSaleFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
}

const store = useCemeteryStore();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    const item = await createAfterSaleApi({
      ...values,
      parkId: store.currentParkId,
    } as never);
    message.success(`工单创建成功：${item.orderNo}`);
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Select',
      componentProps: { options: [], placeholder: '请选择格位' },
      fieldName: 'plotId',
      label: '格位',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: Object.entries(AFTER_SALE_TYPE).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: '请选择服务类型',
      },
      defaultValue: 'stone',
      fieldName: 'type',
      label: '服务类型',
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '描述问题（碑体损坏/绿化补种/保洁需求…）',
      },
      fieldName: 'description',
      label: '问题描述',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '可选，如 张卫士' },
      fieldName: 'handler',
      label: '指派处理人',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmit();
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    modalApi.setState({ title: '新建售后工单' });
    formApi.resetForm();
  },
});

onMounted(async () => {
  await store.ensureParks();
  const plots = await getPlotListApi({ parkId: store.currentParkId });
  await formApi.updateSchema([
    {
      componentProps: {
        options: plots
          .filter((p: any) => p.buildStatus === 'built')
          .map((p: any) => ({
            label: `${p.code}（${p.row}排${p.col}号）`,
            value: p.id,
          })),
        placeholder: '请选择格位（已建成）',
      },
      fieldName: 'plotId',
    },
  ]);
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
