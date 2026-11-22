<script lang="ts" setup>
import type { CemeteryPrice } from '#/api/cemetery/biz';
import type { CemeteryPlotType } from '#/api/cemetery/types';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createPriceApi, getPlotTypeListApi, updatePriceApi } from '#/api';

defineOptions({ name: 'PriceFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record?: CemeteryPrice;
}

const plotTypes = ref<CemeteryPlotType[]>([]);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    const payload = { ...values };
    if (data?.record?.id) {
      await updatePriceApi(data.record.id, payload);
    } else {
      await createPriceApi(payload as never);
    }
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Select',
      componentProps: { options: [], placeholder: '请选择墓型' },
      fieldName: 'typeId',
      label: '墓型',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, step: 100 },
      fieldName: 'price',
      label: '价格(元)',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 1, precision: 0 },
      defaultValue: 20,
      fieldName: 'managementCycleYears',
      label: '管理费周期(年)',
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
    if (!isOpen) return;
    const data = modalApi.getData();
    modalApi.setState({ title: data?.record?.id ? '编辑价目' : '新增价目' });
    if (data?.record) {
      formApi.setValues(data.record);
    }
  },
});

onMounted(async () => {
  plotTypes.value = await getPlotTypeListApi();
  await formApi.updateSchema([
    {
      componentProps: {
        options: plotTypes.value.map((item) => ({
          label: item.name,
          value: item.id,
        })),
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
