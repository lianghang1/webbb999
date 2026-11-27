<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NSpin, NTree } from 'naive-ui';

import { message } from '#/adapter/naive';
import { menuApi, packageApi, roleApi } from '#/api';

defineOptions({ name: 'MenuAssignModal' });

interface AssignData {
  onSuccess?: () => Promise<void> | void;
  packageId?: string;
  roleId?: string;
  tenantId?: string;
}

interface TreeNode {
  key: string;
  label: string;
  children?: TreeNode[];
}

const treeData = ref<TreeNode[]>([]);
const checkedKeys = ref<string[]>([]);
const loading = ref(false);
const assignData = ref<AssignData>({});

const [Modal, modalApi] = useVbenModal<AssignData>({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    const data = assignData.value;
    loading.value = true;
    try {
      if (data.roleId) {
        await roleApi.assignMenus({
          roleId: data.roleId,
          menuIds: checkedKeys.value,
          tenantId: data.tenantId,
        });
      } else if (data.packageId) {
        await packageApi.assignMenus({
          packageId: data.packageId,
          menuIds: checkedKeys.value,
          tenantId: data.tenantId,
        });
      }
      message.success('授权成功');
      modalApi.close();
      await data?.onSuccess?.();
    } finally {
      loading.value = false;
    }
  },
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return;
    }
    assignData.value = modalApi.getData() ?? {};
    loading.value = true;
    try {
      const menus = await menuApi.tree();
      treeData.value = toTree(menus);
      const data = assignData.value;
      if (data.roleId) {
        checkedKeys.value = await roleApi.menus(
          data.roleId,
          data.tenantId ?? '',
        );
      } else if (data.packageId) {
        checkedKeys.value = await packageApi.menus(data.packageId);
      } else {
        checkedKeys.value = [];
      }
    } finally {
      loading.value = false;
    }
  },
});

function toTree(menus: any[]): TreeNode[] {
  return (menus ?? []).map((m) => ({
    key: String(m.id),
    label: m.menuName,
    children: m.children?.length ? toTree(m.children) : undefined,
  }));
}
</script>

<template>
  <Modal>
    <NSpin :show="loading">
      <div class="p-4">
        <div class="mb-2 font-medium">
          勾选可访问的菜单（保存时以当前勾选覆盖）
        </div>
        <NTree
          v-model:checked-keys="checkedKeys"
          :data="treeData"
          checkable
          block-line
          :default-expand-all="true"
          :style="{ height: '340px' }"
        />
      </div>
    </NSpin>
  </Modal>
</template>
