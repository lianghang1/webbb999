<script lang="ts" setup>
import type { TreeSelectOption } from 'naive-ui';

import type { CemeterySection } from '#/api/cemetery/types';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createSectionApi, getSectionListApi, updateSectionApi } from '#/api';
import { useCemeteryStore } from '#/store';

defineOptions({ name: 'SectionFormModal' });

interface ModalData {
  /** 新增时的固定上级（null = 一级墓区），编辑时无意义 */
  parentId?: null | string;
  onSuccess?: () => Promise<void> | void;
  record?: CemeterySection;
}

const store = useCemeteryStore();

/** 把扁平墓区列表组树，供上级墓区 TreeSelect 使用 */
function buildTreeOptions(sections: CemeterySection[]): TreeSelectOption[] {
  const nodeMap = new Map<string, TreeSelectOption>();
  for (const section of sections) {
    nodeMap.set(section.id, {
      key: section.id,
      label: `${section.name}（${section.code}）`,
    });
  }
  const roots: TreeSelectOption[] = [];
  for (const section of sections) {
    const node = nodeMap.get(section.id)!;
    if (section.parentId && nodeMap.has(section.parentId)) {
      const parent = nodeMap.get(section.parentId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function buildCreateSchema(parentOptions: TreeSelectOption[]) {
  return [
    {
      component: 'TreeSelect',
      componentProps: {
        clearable: true,
        options: parentOptions,
        placeholder: '不选择则为一级墓区',
      },
      fieldName: 'parentId',
      label: '上级墓区',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入墓区名称' },
      fieldName: 'name',
      label: '墓区名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入编码，如 A-1' },
      fieldName: 'code',
      label: '编码',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 1, precision: 0 },
      defaultValue: 1,
      fieldName: 'sort',
      label: '排序',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '备注' },
      fieldName: 'remark',
      label: '备注',
    },
  ];
}

function buildEditSchema() {
  return buildCreateSchema([]).filter((item) => item.fieldName !== 'parentId');
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  handleSubmit: async (values) => {
    const data = modalApi.getData();
    if (data?.record?.id) {
      await updateSectionApi(data.record.id, values);
    } else {
      await createSectionApi({
        ...values,
        parentId:
          values.parentId === null || values.parentId === undefined
            ? null
            : (values.parentId as string),
        parkId: store.currentParkId,
      } as never);
    }
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: buildEditSchema(),
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
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    const isEdit = !!data?.record?.id;
    modalApi.setState({
      title: isEdit ? '编辑墓区' : '新增墓区',
    });
    if (isEdit) {
      await formApi.setState({ schema: buildEditSchema() });
      await formApi.resetForm();
      await formApi.setValues(data?.record ?? {});
    } else {
      const sections = await getSectionListApi(store.currentParkId);
      await formApi.setState({
        schema: buildCreateSchema(buildTreeOptions(sections)),
      });
      await formApi.resetForm();
      await formApi.setValues({
        parentId: data?.parentId ?? null,
        sort: 1,
      });
    }
  },
});
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
