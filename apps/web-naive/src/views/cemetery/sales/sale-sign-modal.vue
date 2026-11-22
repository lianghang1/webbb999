<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { signSaleApi } from '#/api/cemetery/biz';

defineOptions({ name: 'SaleSignModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record: { id: string; orderNo: string; plotCode: string };
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await signSaleApi(data?.record?.id ?? '', {
      contractNo: String(values.contractNo),
      totalAmount: Number(values.totalAmount),
    });
    message.success('签约成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入合同编号' },
      fieldName: 'contractNo',
      label: '合同编号',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, step: 100 },
      fieldName: 'totalAmount',
      label: '总金额(元)',
      rules: 'required',
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
    modalApi.setState({ title: `签约 - ${data?.record?.plotCode ?? ''}` });
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
