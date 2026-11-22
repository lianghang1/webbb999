<script lang="ts" setup>
import type { CemeteryPlotType } from '#/api/cemetery/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createPlotTypeApi, updatePlotTypeApi } from '#/api';

defineOptions({ name: 'PlotTypeFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: CemeteryPlotType;
}

const CATEGORY_OPTIONS = [
  { label: '传统墓穴', value: 'tomb' },
  { label: '艺术墓', value: 'art' },
  { label: '草坪葬', value: 'lawn' },
  { label: '树葬', value: 'tree' },
  { label: '花坛葬', value: 'flower' },
  { label: '壁葬', value: 'wall' },
  { label: '骨灰堂格位', value: 'niche' },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    if (data?.record?.id) {
      await updatePlotTypeApi(data.record.id, values);
    } else {
      await createPlotTypeApi(values as never);
    }
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入墓型名称' },
      fieldName: 'name',
      label: '墓型名称',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: { options: CATEGORY_OPTIONS, placeholder: '请选择类别' },
      fieldName: 'category',
      label: '类别',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '备注' },
      fieldName: 'remark',
      label: '备注',
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
      title: data?.record?.id ? '编辑墓型' : '新增墓型',
    });
    if (data?.record) {
      formApi.setValues(data.record);
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
