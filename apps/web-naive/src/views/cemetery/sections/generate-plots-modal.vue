<script lang="ts" setup>
import type { CemeterySection } from '#/api/cemetery/types';

import { onMounted } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { generatePlotsApi, getPlotTypeListApi } from '#/api';
import { useCemeteryStore } from '#/store';

defineOptions({ name: 'GeneratePlotsModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  section: CemeterySection;
}

const store = useCemeteryStore();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    const result = await generatePlotsApi(data?.section.id ?? '', {
      ...values,
      parkId: store.currentParkId,
    } as never);
    message.success(`已规划 ${result?.count ?? 0} 个格位`);
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'InputNumber',
      componentProps: { max: 50, min: 1, precision: 0 },
      defaultValue: 10,
      fieldName: 'rows',
      label: '排数',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { max: 50, min: 1, precision: 0 },
      defaultValue: 10,
      fieldName: 'cols',
      label: '列数',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '单穴', value: 1 },
          { label: '双穴（合葬）', value: 2 },
          { label: '多穴（家族墓，4穴）', value: 4 },
        ],
        placeholder: '请选择穴数',
      },
      defaultValue: 1,
      fieldName: 'cryptCount',
      label: '穴数',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, step: 0.1 },
      fieldName: 'area',
      label: '占地面积(㎡)',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, step: 100 },
      fieldName: 'price',
      label: '参考价(元)',
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
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    modalApi.setState({
      title: `规划格位 - ${data?.section?.name ?? ''}`,
    });
    formApi.setValues({
      area: undefined,
      cols: 10,
      price: undefined,
      rows: 10,
    });
  },
});

onMounted(async () => {
  const types = await getPlotTypeListApi();
  await formApi.updateSchema([
    {
      componentProps: {
        options: types.map((item) => ({ label: item.name, value: item.id })),
        placeholder: '请选择规划墓型',
      },
      fieldName: 'typeId',
    },
  ]);
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
