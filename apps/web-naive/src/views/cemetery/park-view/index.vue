<script lang="ts" setup>
import type {
  CemeteryCamera,
  CemeteryPlot,
  CemeteryPlotType,
  CemeterySection,
} from '#/api/cemetery/types';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { NButton, NButtonGroup, NCard, NSpin, NTag } from 'naive-ui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  cryptCountLabel,
  getCameraListApi,
  getParkStatsApi,
  getPlotListApi,
  getPlotTypeListApi,
  getSectionListApi,
} from '#/api';
import { useCemeteryStore } from '#/store';

import PlotDetailDrawer from '../plot-map/plot-detail-drawer.vue';
import MonitorPanel from './monitor-panel.vue';

defineOptions({ name: 'CemeteryParkView' });

/** 场景网格参数：与 2D 格位一一对应 */
const CELL_W = 3;
const CELL_D = 3.6;
const BAND_GAP_X = 16;
const BAND_GAP_Z = 18;

const STATUS_COLORS: Record<string, string> = {
  building: '#fadb14',
  idle: '#52c41a',
  maintenance: '#f5222d',
  occupied: '#722ed1',
  reserved: '#fa8c16',
  sold: '#1677ff',
  unbuilt: '#767a7e',
};

const STATUS_LABELS: Record<string, string> = {
  building: '在建',
  idle: '可售',
  maintenance: '维护中',
  occupied: '已安葬',
  none: '—',
  reserved: '已预订',
  sold: '已售未安葬',
  unbuilt: '未建',
};

const LEGEND = [
  { color: '#767a7e', key: 'unbuilt', label: '未建' },
  { color: '#fadb14', key: 'building', label: '在建' },
  { color: '#52c41a', key: 'idle', label: '可售' },
  { color: '#fa8c16', key: 'reserved', label: '已预订' },
  { color: '#1677ff', key: 'sold', label: '已售未安葬' },
  { color: '#722ed1', key: 'occupied', label: '已安葬' },
  { color: '#f5222d', key: 'maintenance', label: '维护中' },
];

const store = useCemeteryStore();

const containerRef = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const sceneReady = ref(false);
const stats = ref<null | {
  built: number;
  idle: number;
  maintenance: number;
  occupied: number;
  reserved: number;
  sold: number;
  totalSlots: number;
}>(null);
const events = ref<
  Array<{ level: 'danger' | 'info' | 'warn'; text: string; time: string }>
>([]);
const eventsOpen = ref(true);
const orbiting = ref(false);
const hover = reactive({ text: '', visible: false, x: 0, y: 0 });
const env = reactive({
  humidity: 62,
  light: 5600,
  pm25: 38,
  temperature: 22.4,
  wind: 1.8,
});

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: PlotDetailDrawer,
});
const [MonitorModal, monitorModalApi] = useVbenModal({
  connectedComponent: MonitorPanel,
});

// ---------------------------------------------------------------- three.js 资源

let renderer: null | THREE.WebGLRenderer = null;
let scene: null | THREE.Scene = null;
let camera3d: null | THREE.PerspectiveCamera = null;
let controls: null | OrbitControls = null;
let contentGroup: null | THREE.Group = null;
let pickables: THREE.Object3D[] = [];
type ScenePlot = CemeteryPlot & {
  __cx?: number;
  __cz?: number;
  __rot?: number;
};
let plotsIndex: ScenePlot[] = [];
let rafId = 0;
let raycaster: null | THREE.Raycaster = null;
let pointerNdc = new THREE.Vector2(-10, -10);
let downPos = { x: 0, y: 0 };
let highlightMesh: null | THREE.Mesh = null;
let resizeObserver: null | ResizeObserver = null;
let envTimer: null | ReturnType<typeof setInterval> = null;
let eventTimer: null | ReturnType<typeof setInterval> = null;
const plotTypes = ref<CemeteryPlotType[]>([]);
const plotTypeMap = computed(() => {
  const map = new Map<string, string>();
  plotTypes.value.forEach((item) => map.set(item.id, item.name));
  return map;
});
let camTextures: THREE.Texture[] = [];

function makeTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(10, 25, 18, 0.62)';
  ctx.beginPath();
  ctx.roundRect(6, 24, 500, 80, 16);
  ctx.fill();
  ctx.fillStyle = '#eaf4ea';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  camTextures.push(texture);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(14, 3.5, 1);
  // 名牌不参与射线拾取（Sprite.raycast 在未挂载状态下会读到 null 崩溃）
  sprite.raycast = () => {};
  return sprite;
}

function statusColorOf(plot: CemeteryPlot): string {
  if (plot.buildStatus === 'unbuilt') {
    return STATUS_COLORS.unbuilt!;
  }
  if (plot.buildStatus === 'building') {
    return STATUS_COLORS.building!;
  }
  return STATUS_COLORS[plot.saleStatus === 'none' ? 'idle' : plot.saleStatus]!;
}

function statusLabelOf(plot: CemeteryPlot): string {
  if (plot.buildStatus === 'unbuilt') {
    return STATUS_LABELS.unbuilt!;
  }
  if (plot.buildStatus === 'building') {
    return STATUS_LABELS.building!;
  }
  return STATUS_LABELS[plot.saleStatus === 'none' ? 'idle' : plot.saleStatus]!;
}

function disposeContent() {
  if (contentGroup) {
    contentGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      const mat = mesh.material as
        | THREE.Material
        | THREE.Material[]
        | undefined;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat?.dispose();
      }
    });
    scene?.remove(contentGroup);
    contentGroup = null;
  }
  camTextures.forEach((t) => t.dispose());
  camTextures = [];
  pickables = [];
  plotsIndex = [];
}

/** 叶子墓区排布为网格区块，返回 墓区 → 区块中心 映射 */
function layoutBlocks(sections: CemeterySection[], plots: CemeteryPlot[]) {
  const leaves = sections.filter(
    (s) => !sections.some((item) => item.parentId === s.id),
  );
  const blocks = leaves.map((section) => {
    const own = plots.filter((p) => p.sectionId === section.id);
    const rows = own.reduce((max, p) => Math.max(max, p.row), 0);
    const cols = own.reduce((max, p) => Math.max(max, p.col), 0);
    return { cols, rows, section };
  });
  const perRow = Math.max(1, Math.ceil(Math.sqrt(blocks.length)));
  const spacingX =
    Math.max(...blocks.map((b) => b.cols), 1) * CELL_W + BAND_GAP_X;
  const spacingZ =
    Math.max(...blocks.map((b) => b.rows), 1) * CELL_D + BAND_GAP_Z;
  const rowCount = Math.ceil(blocks.length / perRow);
  const centers = new Map<
    string,
    {
      cols: number;
      cx: number;
      cz: number;
      rows: number;
      section: CemeterySection;
    }
  >();
  blocks.forEach((block, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    centers.set(block.section.id, {
      cols: block.cols,
      cx: (col - (perRow - 1) / 2) * spacingX,
      cz: (row - (rowCount - 1) / 2) * spacingZ,
      rows: block.rows,
      section: block.section,
    });
  });
  return centers;
}

function buildContent() {
  disposeContent();
  if (!scene) {
    return;
  }
  contentGroup = new THREE.Group();
  scene.add(contentGroup);

  const sections = sectionsCache.value;
  const plots = plotsCache.value;

  const centers = layoutBlocks(sections, plots);

  // ---- 地面 / 道路 ----
  const groundGeo = new THREE.PlaneGeometry(560, 440);
  const groundMat = new THREE.MeshStandardMaterial({ color: '#4a7c3f' });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  contentGroup.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({ color: '#8d9095' });
  const roadH = new THREE.Mesh(new THREE.PlaneGeometry(420, 9), roadMat);
  roadH.rotation.x = -Math.PI / 2;
  roadH.position.set(0, 0.03, 0);
  roadH.receiveShadow = true;
  contentGroup.add(roadH);
  const roadV = new THREE.Mesh(new THREE.PlaneGeometry(9, 300), roadMat);
  roadV.rotation.x = -Math.PI / 2;
  roadV.position.set(0, 0.03, 0);
  roadV.receiveShadow = true;
  contentGroup.add(roadV);

  // ---- 格位场景坐标：有 posX/posY 按坐标（不规则布局），否则回退行列网格 ----
  const allPlots: ScenePlot[] = [];
  for (const plot of plots) {
    const center = centers.get(plot.sectionId);
    if (!center) {
      continue;
    }
    let x: number;
    let z: number;
    let rot = 0;
    if (plot.posX !== undefined && plot.posY !== undefined) {
      x = center.cx + plot.posX;
      z = center.cz + plot.posY;
      rot = ((plot.rotation ?? 0) * Math.PI) / 180;
    } else {
      x =
        center.cx - ((center.cols - 1) * CELL_W) / 2 + (plot.col - 1) * CELL_W;
      z =
        center.cz - ((center.rows - 1) * CELL_D) / 2 + (plot.row - 1) * CELL_D;
    }
    allPlots.push({ ...plot, __cx: x, __cz: z, __rot: rot });
  }

  // ---- 墓区平台：按格位实际分布范围生成（兼容不规则排布） ----
  const extents = new Map<
    string,
    { maxX: number; maxZ: number; minX: number; minZ: number }
  >();
  for (const plot of allPlots) {
    const e = extents.get(plot.sectionId) ?? {
      minX: Infinity,
      maxX: -Infinity,
      minZ: Infinity,
      maxZ: -Infinity,
    };
    e.minX = Math.min(e.minX, plot.__cx ?? 0);
    e.maxX = Math.max(e.maxX, plot.__cx ?? 0);
    e.minZ = Math.min(e.minZ, plot.__cz ?? 0);
    e.maxZ = Math.max(e.maxZ, plot.__cz ?? 0);
    extents.set(plot.sectionId, e);
  }
  const platformGeo = new THREE.BoxGeometry(1, 0.4, 1);
  const platformMat = new THREE.MeshStandardMaterial({ color: '#d8d3c4' });
  for (const [sectionId, e] of extents) {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      continue;
    }
    const width = Math.max(e.maxX - e.minX + 10, 12);
    const depth = Math.max(e.maxZ - e.minZ + 10, 12);
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.scale.set(width, 1, depth);
    platform.position.set((e.minX + e.maxX) / 2, 0.2, (e.minZ + e.maxZ) / 2);
    platform.receiveShadow = true;
    contentGroup.add(platform);
    const sprite = makeTextSprite(section.name);
    sprite.position.set((e.minX + e.maxX) / 2, 4.4, e.maxZ + 7);
    contentGroup.add(sprite);
  }

  const bodyGeo = new THREE.BoxGeometry(1.3, 2, 0.45);
  const capGeo = new THREE.BoxGeometry(1.5, 0.4, 0.55);
  const baseGeo = new THREE.BoxGeometry(1.6, 0.5, 0.7);
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
  const capMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
  const baseMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });

  const total = allPlots.length;
  const bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, total);
  const capMesh = new THREE.InstancedMesh(capGeo, capMat, total);
  const baseMesh = new THREE.InstancedMesh(baseGeo, baseMat, total);
  bodyMesh.castShadow = true;
  capMesh.castShadow = true;
  baseMesh.castShadow = true;
  bodyMesh.userData.kind = 'stele';
  capMesh.userData.kind = 'stele';
  baseMesh.userData.kind = 'stele';

  const matrix = new THREE.Matrix4();
  const identityQuat = new THREE.Quaternion();
  const quat = identityQuat;
  const upAxis = new THREE.Vector3(0, 1, 0);
  const zero = new THREE.Vector3(0, 0, 0);
  const color = new THREE.Color();

  allPlots.forEach((plot, i) => {
    const x = plot.__cx ?? 0;
    const z = plot.__cz ?? 0;
    const isUnbuilt = plot.buildStatus === 'unbuilt';
    // 朝向旋转（坐标模式的不规则排布）
    const quat =
      (plot.__rot ?? 0) === 0
        ? identityQuat
        : new THREE.Quaternion().setFromAxisAngle(upAxis, plot.__rot ?? 0);
    // 底座
    const baseScale = new THREE.Vector3(1, isUnbuilt ? 0.35 : 1, 1);
    matrix.compose(
      new THREE.Vector3(x, 0.4 + 0.25 * (isUnbuilt ? 0.35 : 1), z),
      quat,
      baseScale,
    );
    baseMesh.setMatrixAt(i, matrix);
    baseMesh.setColorAt(
      i,
      color.set(isUnbuilt ? STATUS_COLORS.unbuilt! : '#c9c2b2'),
    );
    // 碑身/碑帽（未建不渲染）
    const bodyScale = isUnbuilt ? zero : new THREE.Vector3(1, 1, 1);
    matrix.compose(new THREE.Vector3(x, 1.9, z), quat, bodyScale);
    bodyMesh.setMatrixAt(i, matrix);
    bodyMesh.setColorAt(i, color.set(statusColorOf(plot)));
    matrix.compose(new THREE.Vector3(x, 3.1, z), quat, bodyScale);
    capMesh.setMatrixAt(i, matrix);
    capMesh.setColorAt(i, color.set('#5a5f63'));
    plotsIndex[i] = plot;
  });
  bodyMesh.instanceColor!.needsUpdate = true;
  capMesh.instanceColor!.needsUpdate = true;
  baseMesh.instanceColor!.needsUpdate = true;
  contentGroup.add(bodyMesh, capMesh, baseMesh);
  pickables.push(bodyMesh, capMesh, baseMesh);

  // ---- 树木点缀 ----
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.4, 6);
  const crownGeo = new THREE.ConeGeometry(0.9, 2.6, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#6b4a2b' });
  const crownMat = new THREE.MeshStandardMaterial({ color: '#2f7a35' });
  const treeCount = 56;
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crownMesh = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  crownMesh.castShadow = true;
  for (let i = 0; i < treeCount; i++) {
    const t = (i / treeCount) * Math.PI * 2;
    const radius = 120 + Math.sin(i * 5.3) * 26;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius * 0.8;
    const s = 0.8 + ((i * 37) % 10) / 18;
    matrix.compose(
      new THREE.Vector3(x, 0.7 * s, z),
      quat,
      new THREE.Vector3(s, s, s),
    );
    trunkMesh.setMatrixAt(i, matrix);
    matrix.compose(
      new THREE.Vector3(x, (1.4 + 1.3) * s, z),
      quat,
      new THREE.Vector3(s, s, s),
    );
    crownMesh.setMatrixAt(i, matrix);
  }
  contentGroup.add(trunkMesh, crownMesh);

  // ---- 摄像头点位 ----
  for (const cam of camerasCache.value) {
    const group = new THREE.Group();
    const base = cam.sectionId ? centers.get(cam.sectionId) : null;
    const cx = base ? base.cx : 0;
    const cz = base ? base.cz : 0;
    const px = cx + cam.offsetX * 1.6;
    const pz = cam.sectionId ? cz + cam.offsetZ * 1.6 : cam.offsetZ;
    const online = cam.status === 'online';
    const poleMat = new THREE.MeshStandardMaterial({
      color: online ? '#3a78d8' : '#5a5f66',
    });
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 3.4, 8),
      poleMat,
    );
    pole.position.set(0, 1.7 + 0.4, 0);
    pole.castShadow = true;
    const headMat = new THREE.MeshStandardMaterial({
      color: online ? '#63a4ff' : '#43484d',
      emissive: online ? '#1a4a8a' : '#000000',
    });
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 12),
      headMat,
    );
    head.position.set(0, 3.5 + 0.4, 0);
    // 隐形点击热区：杆身太细难以命中，用一个不可见球扩大拾取范围
    const hitProxy = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitProxy.position.set(0, 2.4, 0);
    group.add(pole, head, hitProxy);
    pickables.push(pole, head, hitProxy);
    if (online) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 2.8, 10, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#63a4ff',
          opacity: 0.22,
          transparent: true,
          wireframe: true,
        }),
      );
      cone.rotation.x = Math.PI / 2.6;
      cone.position.set(0, 2.6, -1.4);
      group.add(cone);
    }
    group.position.set(px, 0, pz);
    group.traverse((obj) => {
      obj.userData.cameraId = cam.id;
    });
    contentGroup.add(group);
  }

  // ---- hover 高亮框 ----
  highlightMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 3.6, 1),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.3,
    }),
  );
  highlightMesh.visible = false;
  contentGroup.add(highlightMesh);
}

// ---------------------------------------------------------------- 交互

function updatePointerNdc(event: PointerEvent) {
  const rect = containerRef.value?.getBoundingClientRect();
  if (!rect || !camera3d) {
    return;
  }
  pointerNdc.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  hover.x = event.clientX - rect.left;
  hover.y = event.clientY - rect.top;
}

function doRaycast(): {
  camera: CemeteryCamera | null;
  object: null | THREE.Object3D;
  plot: null | ScenePlot;
} {
  if (!raycaster || !camera3d) {
    return { camera: null, object: null, plot: null };
  }
  raycaster.setFromCamera(pointerNdc, camera3d);
  const hits = raycaster.intersectObjects(pickables, false);
  const hit = hits[0];
  if (!hit) {
    return { camera: null, object: null, plot: null };
  }
  const kind = hit.object.userData.kind;
  if (kind === 'stele') {
    const plot = plotsIndex[hit.instanceId ?? -1] ?? null;
    return { camera: null, object: hit.object, plot };
  }
  const cameraId = hit.object.userData.cameraId as string | undefined;
  if (cameraId) {
    return {
      camera: camerasCache.value.find((item) => item.id === cameraId) ?? null,
      object: hit.object,
      plot: null,
    };
  }
  return { camera: null, object: hit.object, plot: null };
}

function onPointerMove(event: PointerEvent) {
  updatePointerNdc(event);
  const { plot } = doRaycast();
  if (plot && highlightMesh) {
    highlightMesh.visible = true;
    highlightMesh.position.set(plot.__cx ?? 0, 2, plot.__cz ?? 0);
    hover.text = `${plot.code} · ${statusLabelOf(plot)} · ${cryptCountLabel(plot.cryptCount)}`;
    hover.visible = true;
  } else {
    if (highlightMesh) {
      highlightMesh.visible = false;
    }
    const cameraHit = doRaycast().camera;
    hover.text = cameraHit ? `📹 ${cameraHit.name}` : '';
    hover.visible = !!cameraHit;
  }
}

function onPointerDown(event: PointerEvent) {
  downPos = { x: event.clientX, y: event.clientY };
}

function onPointerUp(event: PointerEvent) {
  const moved = Math.hypot(
    event.clientX - downPos.x,
    event.clientY - downPos.y,
  );
  if (moved > 6) {
    return;
  }
  updatePointerNdc(event);
  const { camera: cameraHit, plot } = doRaycast();
  if (plot) {
    openDetail(plot);
  } else if (cameraHit) {
    openMonitor(cameraHit);
  }
}

function openDetail(plot: CemeteryPlot) {
  detailDrawerApi.setData({
    onSuccess: async () => {
      await refreshData();
    },
    plot: { ...plot },
    plotTypeName: plotTypeMap.value.get(plot.typeId) ?? plot.typeId,
  });
  detailDrawerApi.open();
}

function openMonitor(camera: CemeteryCamera) {
  const sectionName = camera.sectionId
    ? (sectionsCache.value.find((s) => s.id === camera.sectionId)?.name ?? '')
    : '园区公共区域';
  monitorModalApi.setData({ camera: { ...camera }, sectionName });
  monitorModalApi.open();
}

// ---------------------------------------------------------------- 视角

function setView(kind: 'orbit' | 'reset' | 'top') {
  if (!camera3d || !controls) {
    return;
  }
  controls.autoRotate = kind === 'orbit';
  orbiting.value = kind === 'orbit';
  if (kind === 'reset') {
    camera3d.position.set(55, 46, 72);
    controls.target.set(0, 0, 0);
  } else if (kind === 'top') {
    camera3d.position.set(0, 135, 0.1);
    controls.target.set(0, 0, 0);
  }
  controls.update();
}

// ---------------------------------------------------------------- 数据与生命周期

const sectionsCache = ref<CemeterySection[]>([]);
const plotsCache = ref<CemeteryPlot[]>([]);
const camerasCache = ref<CemeteryCamera[]>([]);

async function refreshData() {
  await store.ensureParks();
  const parkId = store.currentParkId;
  const [sectionList, plotList, cameraList, statsData, typeList] =
    await Promise.all([
      getSectionListApi(parkId),
      getPlotListApi({ parkId }),
      getCameraListApi(parkId),
      getParkStatsApi(parkId),
      getPlotTypeListApi(),
    ]);
  sectionsCache.value = sectionList;
  plotsCache.value = plotList;
  camerasCache.value = cameraList;
  stats.value = statsData;
  plotTypes.value = typeList;
}

async function loadPark() {
  loading.value = true;
  try {
    await refreshData();
    buildContent();
    sceneReady.value = true;
  } finally {
    loading.value = false;
  }
}

function startEnvAndEvents() {
  envTimer = setInterval(() => {
    env.temperature = Math.round((21 + Math.random() * 4) * 10) / 10;
    env.humidity = Math.round(55 + Math.random() * 18);
    env.pm25 = Math.round(28 + Math.random() * 22);
    env.wind = Math.round((1 + Math.random() * 3) * 10) / 10;
    env.light = Math.round(4800 + Math.random() * 2200);
  }, 5000);
  eventTimer = setInterval(() => {
    const pool: Array<{ level: 'danger' | 'info' | 'warn'; text: string }> = [
      { level: 'danger', text: 'AI 烟火识别：A-1 区东南角疑似明烟' },
      { level: 'warn', text: 'AI 人群密度：A-1 区祭扫人流较密集' },
      { level: 'warn', text: 'AI 异物检测：B-1 区发现堆放物' },
      { level: 'info', text: 'AI 识别：祭扫人员进入生态区' },
      { level: 'info', text: 'AI 车牌识别：车辆驶入园区停车场' },
    ];
    const item = pool[Math.floor(Math.random() * pool.length)]!;
    events.value.unshift({
      level: item.level,
      text: item.text,
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    });
    if (events.value.length > 10) {
      events.value.pop();
    }
  }, 6000);
}

function initScene() {
  const container = containerRef.value;
  if (!container) {
    return;
  }
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    // 保留帧缓冲：WebGL 默认每帧清空 back buffer，会导致
    // 部分截屏/录屏管线（以及 toDataURL 时机不对时）拿到黑帧
    preserveDrawingBuffer: true,
  });
  // canvas 绝对定位铺满容器：容器内 NSpin 覆盖层在文档流中占满高度，
  // 若 canvas 走文档流会被推到容器外并被 overflow-hidden 裁掉（黑屏）
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.display = 'block';
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#8fb4d9');
  scene.fog = new THREE.Fog('#8fb4d9', 200, 480);

  camera3d = new THREE.PerspectiveCamera(50, width / height, 0.5, 900);
  camera3d.position.set(55, 46, 72);

  controls = new OrbitControls(camera3d, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.06;
  controls.minDistance = 14;
  controls.maxDistance = 240;
  controls.target.set(0, 0, 0);

  const hemi = new THREE.HemisphereLight(0xcf_e8_ff, 0x3a_5a_33, 0.95);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xff_f2_d9, 1.5);
  dir.position.set(70, 90, 45);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -160;
  dir.shadow.camera.right = 160;
  dir.shadow.camera.top = 160;
  dir.shadow.camera.bottom = -160;
  dir.shadow.camera.far = 320;
  scene.add(dir);

  raycaster = new THREE.Raycaster();

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);

  resizeObserver = new ResizeObserver(() => {
    if (!containerRef.value || !renderer || !camera3d) {
      return;
    }
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    renderer.setSize(w, h);
    camera3d.aspect = w / h;
    camera3d.updateProjectionMatrix();
  });
  resizeObserver.observe(container);

  const loop = () => {
    rafId = requestAnimationFrame(loop);
    controls?.update();
    if (renderer && scene && camera3d) {
      renderer.render(scene, camera3d);
    }
  };
  loop();
}

onMounted(async () => {
  initScene();
  await loadPark();
  startEnvAndEvents();
});

watch(
  () => store.currentParkId,
  () => {
    void loadPark();
  },
);

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  if (envTimer) {
    clearInterval(envTimer);
  }
  if (eventTimer) {
    clearInterval(eventTimer);
  }
  resizeObserver?.disconnect();
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerup', onPointerUp);
    renderer.dispose();
  }
  controls?.dispose();
  disposeContent();
});
</script>

<template>
  <Page title="3D 园区导览">
    <div
      ref="containerRef"
      class="relative overflow-hidden rounded-lg border border-white/10"
      style="height: calc(100vh - 220px); min-height: 520px"
    >
      <!-- three.js canvas 会插入到这个容器 -->
      <NSpin :show="loading || !sceneReady" class="h-full">
        <div class="h-full"></div>
      </NSpin>

      <!-- 左上：统计 + 环境 -->
      <div class="absolute left-3 top-3 flex flex-col gap-2">
        <NCard size="small" style="width: 224px">
          <div class="grid grid-cols-2 gap-2">
            <div class="text-center">
              <div class="text-lg font-semibold">
                {{ stats?.totalSlots ?? '-' }}
              </div>
              <div class="text-[10px] opacity-60">规划格位</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold">{{ stats?.built ?? '-' }}</div>
              <div class="text-[10px] opacity-60">墓位（建成）</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold">{{ stats?.idle ?? '-' }}</div>
              <div class="text-[10px] opacity-60">可售</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold">
                {{ stats?.occupied ?? '-' }}
              </div>
              <div class="text-[10px] opacity-60">已安葬</div>
            </div>
          </div>
          <div
            class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t pt-2 text-xs"
            style="border-color: rgb(128 128 128 / 30%)"
          >
            <span class="opacity-60">🌡 温度</span>
            <span>{{ env.temperature }} ℃</span>
            <span class="opacity-60">💧 湿度</span>
            <span>{{ env.humidity }} %</span>
            <span class="opacity-60">🍃 PM2.5</span>
            <span>{{ env.pm25 }}</span>
            <span class="opacity-60">💨 风速</span>
            <span>{{ env.wind }} m/s</span>
          </div>
        </NCard>
      </div>

      <!-- 右上：AI 事件面板 -->
      <div class="absolute right-3 top-3 flex flex-col items-end gap-2">
        <NButton size="small" @click="eventsOpen = !eventsOpen">
          {{ eventsOpen ? '收起 AI 面板' : 'AI 事件面板' }}
        </NButton>
        <NCard
          v-if="eventsOpen"
          size="small"
          style="width: 300px"
          title="AI 实时事件"
        >
          <div class="max-h-56 overflow-auto">
            <div
              v-for="(event, index) in events"
              :key="`${event.time}-${index}`"
              class="flex items-start gap-2 py-1.5 text-xs"
              :class="{ 'opacity-60': index > 2 }"
            >
              <span class="shrink-0 opacity-60">{{ event.time }}</span>
              <NTag
                :bordered="false"
                size="small"
                :type="
                  event.level === 'danger'
                    ? 'error'
                    : event.level === 'warn'
                      ? 'warning'
                      : 'info'
                "
              >
                {{
                  event.level === 'danger'
                    ? '预警'
                    : event.level === 'warn'
                      ? '提醒'
                      : '识别'
                }}
              </NTag>
              <span class="min-w-0 flex-1">{{ event.text }}</span>
            </div>
            <div
              v-if="events.length === 0"
              class="py-4 text-center text-xs opacity-40"
            >
              AI 引擎分析中…
            </div>
          </div>
        </NCard>
      </div>

      <!-- 底部：图例 + 视角 -->
      <div class="absolute bottom-3 left-3 flex items-center gap-2">
        <NButtonGroup size="small">
          <NButton @click="setView('reset')">重置视角</NButton>
          <NButton @click="setView('top')">俯视</NButton>
          <NButton
            :type="orbiting ? 'primary' : 'default'"
            @click="setView('orbit')"
          >
            {{ orbiting ? '停止环绕' : '自动环绕' }}
          </NButton>
        </NButtonGroup>
      </div>
      <div
        class="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg px-3 py-1.5"
        style="background: rgb(10 20 30 / 55%)"
      >
        <div
          v-for="item in LEGEND"
          :key="item.key"
          class="flex items-center gap-1.5"
        >
          <span
            class="inline-block h-2.5 w-2.5 rounded-sm"
            :style="{ background: item.color }"
          ></span>
          <span class="text-[11px] text-white/80">{{ item.label }}</span>
        </div>
      </div>

      <!-- hover 浮标 -->
      <div
        v-if="hover.visible"
        class="pointer-events-none absolute rounded-md px-2 py-1 text-xs text-white"
        :style="{
          background: 'rgba(10, 20, 30, 0.78)',
          left: `${hover.x + 12}px`,
          top: `${hover.y + 12}px`,
        }"
      >
        {{ hover.text }}
      </div>
    </div>

    <DetailDrawer />
    <MonitorModal />
  </Page>
</template>
