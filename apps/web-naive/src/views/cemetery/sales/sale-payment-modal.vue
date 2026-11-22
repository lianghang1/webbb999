<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { addPaymentApi } from '#/api/cemetery/biz';

defineOptions({ name: 'SalePaymentModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  record: { id: string; orderNo: string; paidAmount: number };
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    await addPaymentApi(data?.record?.id ?? '', {
      amount: Number(values.amount),
      method: String(values.method),
    });
    message.success('收款成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'InputNumber',
      componentProps: { min: 0, step: 100 },
      fieldName: 'amount',
      label: '收款金额(元)',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '微信', value: 'wechat' },
          { label: '支付宝', value: 'alipay' },
          { label: '银行转账', value: 'bank' },
          { label: '现金', value: 'cash' },
        ],
        placeholder: '请选择收款方式',
      },
      defaultValue: 'bank',
      fieldName: 'method',
      label: '收款方式',
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
    modalApi.setState({
      title: `收款 - ${data?.record?.orderNo ?? ''}（已收 ¥${data?.record?.paidAmount ?? 0}）`,
    });
    formApi.setValues({ amount: undefined, method: 'bank' });
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
