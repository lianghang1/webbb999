<script lang="ts" setup>
import { onMounted } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import {
  createBurialApi,
  getCustomerListApi,
  getDeceasedListApi,
} from '#/api/cemetery/biz';
import { getPlotListApi } from '#/api/cemetery/plot';
import { useCemeteryStore } from '#/store';

defineOptions({ name: 'BurialCreateModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
}

const store = useCemeteryStore();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    const burial = await createBurialApi({
      ...values,
      parkId: store.currentParkId,
    } as never);
    message.success(`安葬登记成功，安葬证号 ${burial.certificateNo}`);
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    {
      component: 'Select',
      componentProps: { options: [], placeholder: '仅显示已售未安葬格位' },
      fieldName: 'plotId',
      label: '格位',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: { options: [], placeholder: '请选择逝者' },
      fieldName: 'deceasedId',
      label: '逝者',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: { options: [], placeholder: '请选择购买人' },
      fieldName: 'customerId',
      label: '购买人',
      rules: 'required',
    },
    {
      component: 'DatePicker',
      fieldName: 'burialDate',
      label: '安葬日期',
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
    modalApi.setState({ title: '登记安葬' });
    formApi.resetForm();
  },
});

onMounted(async () => {
  await store.ensureParks();
  const [plots, customers, deceased] = await Promise.all([
    getPlotListApi({ parkId: store.currentParkId, saleStatus: 'sold' }),
    getCustomerListApi(),
    getDeceasedListApi(),
  ]);
  await formApi.updateSchema([
    {
      componentProps: {
        options: plots.map((p: any) => ({ label: p.code, value: p.id })),
        placeholder: '仅显示已售未安葬格位',
      },
      fieldName: 'plotId',
    },
    {
      componentProps: {
        options: deceased.map((d: any) => ({ label: d.name, value: d.id })),
        placeholder: '请选择逝者',
      },
      fieldName: 'deceasedId',
    },
    {
      componentProps: {
        options: customers.map((c: any) => ({
          label: `${c.name}（${c.phone}）`,
          value: c.id,
        })),
        placeholder: '请选择购买人',
      },
      fieldName: 'customerId',
    },
  ]);
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
