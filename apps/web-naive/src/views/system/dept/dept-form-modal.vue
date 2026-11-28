<script lang="ts" setup>
import type { TreeSelectOption } from 'naive-ui';

import type { SysDept } from '#/api/system/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { deptApi, tenantApi, userApi } from '#/api';

defineOptions({ name: 'DeptFormModal' });

interface ModalData {
  onSuccess?: () => Promise<void> | void;
  parentId?: string;
  record?: SysDept;
}

const userStore = useUserStore();
const isPlatformAdmin = computed(() =>
  (userStore.userInfo?.roles ?? []).includes('PLATFORM_ADMIN'),
);

const parentOptions = ref<TreeSelectOption[]>([]);
const leaderOptions = ref<{ label: string; value: string }[]>([]);
const tenantOptions = ref<{ label: string; value: string }[]>([]);

function toTreeOptions(nodes: any[], excludeId?: string): TreeSelectOption[] {
  return (nodes ?? [])
    .filter((n) => String(n.id) !== excludeId)
    .map((n) => ({
      key: String(n.id),
      label: n.deptName,
      children: n.children?.length
        ? toTreeOptions(n.children, excludeId)
        : undefined,
    }));
}

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  handleSubmit: async (rawValues) => {
    const values = rawValues as Record<string, any>;
    const data = modalApi.getData();
    const payload: Record<string, any> = { ...values, id: data?.record?.id };
    if (!isPlatformAdmin.value) {
      payload.tenantId = data?.record?.tenantId ?? userStore.userInfo?.tenantId;
    }
    await deptApi.save(payload);
    message.success('保存成功');
    modalApi.close();
    await data?.onSuccess?.();
  },
  schema: [
    // ===== 基础信息 =====
    {
      type: 'group',
      name: 'basic',
      title: '基础信息',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'Input',
          componentProps: { placeholder: '请输入部门名称' },
          fieldName: 'deptName',
          label: '部门名称',
          rules: 'required',
        },
        {
          component: 'TreeSelect',
          componentProps: () => ({
            options: parentOptions.value,
            placeholder: '顶级部门（不选则为根节点）',
            clearable: true,
            checkable: false,
            filterable: true,
          }),
          fieldName: 'parentId',
          label: '上级部门',
        },
        ...(isPlatformAdmin.value
          ? [
              {
                component: 'Select',
                componentProps: () => ({
                  options: tenantOptions.value,
                  placeholder: '请选择所属租户',
                  filterable: true,
                }),
                fieldName: 'tenantId',
                label: '所属租户',
                rules: 'required',
              },
            ]
          : []),
        {
          component: 'Select',
          componentProps: () => ({
            options: leaderOptions.value,
            placeholder: '请选择部门负责人',
            clearable: true,
            filterable: true,
          }),
          fieldName: 'leaderId',
          label: '负责人',
        },
      ],
    },
    // ===== 其他 =====
    {
      type: 'group',
      name: 'other',
      title: '其他',
      collapsible: false,
      wrapperClass: 'grid-cols-2',
      children: [
        {
          component: 'InputNumber',
          componentProps: { min: 0, class: 'w-full' },
          fieldName: 'sortNo',
          label: '排序',
          defaultValue: 0,
        },
        {
          component: 'RadioGroup',
          componentProps: {
            options: [
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ],
          },
          defaultValue: 1,
          fieldName: 'status',
          label: '状态',
        },
      ],
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal<ModalData>({
  class: 'w-[600px]',
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmit();
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData();
    const editing = !!data?.record?.id;
    modalApi.setState({ title: editing ? '编辑部门' : '新增部门' });

    const record = data?.record;
    let tid: string | undefined;
    if (editing && record) {
      tid =
        record.tenantId === null || record.tenantId === undefined
          ? undefined
          : String(record.tenantId);
    } else if (!isPlatformAdmin.value) {
      tid = userStore.userInfo?.tenantId as string | undefined;
    }

    // 加载部门树（排除自身防环）+ 负责人候选用户
    const [tree, users] = await Promise.all([
      deptApi.tree(tid),
      userApi.list({ pageNum: 1, pageSize: -1 }),
    ]);
    parentOptions.value = toTreeOptions(
      tree,
      record ? String(record.id) : undefined,
    );
    leaderOptions.value = users.list.map((u) => ({
      label: u.nickname || u.username,
      value: String(u.id),
    }));
    if (isPlatformAdmin.value) {
      const page = await tenantApi.list({ pageNum: 1, pageSize: -1 });
      tenantOptions.value = page.list.map((t) => ({
        label: t.tenantName,
        value: String(t.id),
      }));
    }

    if (editing && record) {
      formApi.setValues({
        ...record,
        parentId:
          record.parentId === null || record.parentId === undefined
            ? undefined
            : String(record.parentId),
        leaderId:
          record.leaderId === null || record.leaderId === undefined
            ? undefined
            : String(record.leaderId),
        tenantId: tid,
      });
    } else {
      formApi.resetForm();
      formApi.setValues({
        sortNo: 0,
        status: 1,
        ...(data?.parentId ? { parentId: String(data.parentId) } : {}),
        ...(isPlatformAdmin.value
          ? {}
          : { tenantId: userStore.userInfo?.tenantId }),
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
