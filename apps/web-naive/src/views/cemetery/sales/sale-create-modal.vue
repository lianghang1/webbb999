<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createSaleApi, getCustomerListApi } from '#/api/cemetery/biz';
import { getPlotListApi } from '#/api/cemetery/plot';
import { useCemeteryStore } from '#/store';

defineOptions({ name: 'SaleCreateModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
}

const store = useCemeteryStore();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    const order = await createSaleApi({
      ...values,
      parkId: store.currentParkId,
    } as never);
    message.success(`预订成功，单号 ${order.orderNo}`);
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Select',
      componentProps: { options: [], placeholder: '请选择可售格位' },
      fieldName: 'plotId',
      label: '格位',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: { options: [], placeholder: '请选择客户' },
      fieldName: 'customerId',
      label: '购买人',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, step: 100 },
      fieldName: 'deposit',
      label: '定金(元)',
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
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    modalApi.setState({ title: '新建预订' });
    const [plots, customers] = await Promise.all([
      getPlotListApi({ parkId: store.currentParkId, saleStatus: 'idle' }),
      getCustomerListApi(),
    ]);
    await formApi.updateSchema([
      {
        componentProps: {
          options: plots.map((p) => ({ label: p.code, value: p.id })),
          placeholder: '仅显示可售格位',
        },
        fieldName: 'plotId',
      },
      {
        componentProps: {
          options: customers.map((c) => ({
            label: `${c.name}（${c.phone}）`,
            value: c.id,
          })),
          placeholder: '请选择客户',
        },
        fieldName: 'customerId',
      },
    ]);
    await formApi.setValues({ deposit: undefined, plotId: undefined });
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
