<script lang="ts" setup>
import type { CemeteryCamera } from '#/api/cemetery/types';

import { onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NTag } from 'naive-ui';

defineOptions({ name: 'MonitorPanel' });

interface ModalData {
  camera: CemeteryCamera;
  sectionName?: string;
}

interface AiEvent {
  level: 'danger' | 'info' | 'warn';
  text: string;
  time: string;
}

const LEVEL_TAG: Record<AiEvent['level'], string> = {
  danger: 'error',
  info: 'info',
  warn: 'warning',
};

const camera = ref<CemeteryCamera | null>(null);
const sectionName = ref('');
const canvasRef = ref<HTMLCanvasElement | null>(null);
const events = ref<AiEvent[]>([]);

let rafId = 0;
let eventTimer: null | ReturnType<typeof setInterval> = null;
let clockTimer: null | ReturnType<typeof setInterval> = null;
let boxState = { label: 'AI: 祭扫人员 ×2', x: 120, y: 90, w: 90, h: 70 };
let frame = 0;

function nowText() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

function pushEvent(level: AiEvent['level'], text: string) {
  events.value.unshift({ level, text, time: nowText() });
  if (events.value.length > 20) {
    events.value.pop();
  }
}

const EVENT_POOL: Array<{ level: AiEvent['level']; text: string }> = [
  { level: 'danger', text: 'AI 烟火识别预警：检测到疑似明烟，请立即核查' },
  { level: 'warn', text: 'AI 人群密度提醒：当前区域祭扫人流较密集' },
  { level: 'warn', text: '异物占用提醒：墓位前检测到长期堆放物' },
  { level: 'info', text: 'AI 识别：祭扫人员进入监控区域' },
  { level: 'info', text: 'AI 识别：车辆驶入园区停车场' },
  { level: 'info', text: 'AI 周界巡检：未发现异常，巡检完成' },
  { level: 'info', text: '环境联动：空气湿度适宜，无明显风险' },
  { level: 'warn', text: 'AI 姿态检测：有人员跌倒疑似动作，待复核' },
];

function startEventStream() {
  pushEvent('info', 'AI 巡检已接入，开始实时分析…');
  eventTimer = setInterval(() => {
    const pool = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]!;
    pushEvent(pool.level, pool.text);
  }, 3800);
}

function drawFrame() {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  const { height: h, width: w } = canvas;
  const isOffline = camera.value?.status === 'offline';
  frame += 1;

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, isOffline ? '#101014' : '#0d1f16');
  bg.addColorStop(1, isOffline ? '#18181f' : '#0a1410');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (isOffline) {
    // 离线：雪花噪点 + 信号中断
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 260; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('信号中断', w / 2, h / 2 - 12);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('该设备处于离线状态，请检查供电与网络', w / 2, h / 2 + 20);
    ctx.textAlign = 'left';
    drawOverlay(w, h, true);
    return;
  }

  // 场景：地平线 + 墓碑剪影
  const horizon = h * 0.55;
  ctx.fillStyle = '#12251b';
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.fillStyle = '#0d1b13';
  ctx.fillRect(0, horizon, w, 3);
  const steleCount = 12;
  for (let i = 0; i < steleCount; i++) {
    const sw = 18 + ((i * 7) % 8);
    const sh = 26 + ((i * 13) % 14);
    const sx = (w / steleCount) * i + 14 + Math.sin(frame / 60 + i) * 1.2;
    const sy = horizon + 26 + ((i * 11) % 22);
    ctx.fillStyle = i % 3 === 0 ? '#1d3327' : '#182b21';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + sw, sy);
    ctx.lineTo(sx + sw, sy - sh);
    ctx.quadraticCurveTo(sx + sw / 2, sy - sh - 8, sx, sy - sh);
    ctx.closePath();
    ctx.fill();
  }

  // 移动目标（模拟走动的人影）
  const px = ((frame * 1.6) % (w + 120)) - 60;
  ctx.fillStyle = 'rgba(220, 230, 240, 0.85)';
  ctx.beginPath();
  ctx.ellipse(px, horizon + 34, 7, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, horizon + 10, 6, 0, Math.PI * 2);
  ctx.fill();

  // AI 识别框（周期换目标）
  if (frame % 150 === 0) {
    boxState = {
      h: 60 + Math.random() * 30,
      label: Math.random() > 0.5 ? 'AI: 祭扫人员' : 'AI: 车辆',
      w: 70 + Math.random() * 40,
      x: 60 + Math.random() * (w - 200),
      y: horizon - 20 + Math.random() * 30,
    };
  }
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxState.x, boxState.y, boxState.w, boxState.h);
  ctx.fillStyle = '#ffd54a';
  ctx.font = '12px sans-serif';
  ctx.fillText(boxState.label, boxState.x, boxState.y - 6);
  // 角标
  ctx.lineWidth = 3;
  drawCorner(ctx, boxState.x, boxState.y, boxState.w, boxState.h, 10);

  // 扫描线
  const sweepY = ((frame * 2) % (h + 80)) - 40;
  const sweep = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
  sweep.addColorStop(0, 'rgba(120, 255, 180, 0)');
  sweep.addColorStop(0.5, 'rgba(120, 255, 180, 0.10)');
  sweep.addColorStop(1, 'rgba(120, 255, 180, 0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(0, sweepY - 30, w, 60);

  // 噪点
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  drawOverlay(w, h, false);
  rafId = requestAnimationFrame(drawFrame);
}

function drawCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  len: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - len, y + h);
  ctx.moveTo(x + len, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - len);
  ctx.stroke();
}

function drawOverlay(w: number, h: number, offline: boolean) {
  const ctx = canvasRef.value?.getContext('2d');
  if (!ctx) {
    return;
  }
  // 扫描线纹理
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
  // 左上：REC + 名称
  if (!offline && Math.floor(frame / 30) % 2 === 0) {
    ctx.fillStyle = '#ff4d4f';
    ctx.beginPath();
    ctx.arc(22, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(offline ? '' : 'REC', 34, 27);
  ctx.fillText(camera.value?.name ?? '', 22, 50);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(camera.value?.feature ?? '', 22, 70);
  // 右上：时间码
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(nowText(), w - 20, 27);
  ctx.textAlign = 'left';
}

function stopLoops() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  if (eventTimer) {
    clearInterval(eventTimer);
    eventTimer = null;
  }
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

const [Modal, modalApi] = useVbenModal<ModalData>({
  class: 'w-[780px]',
  footer: false,
  title: 'AI 监控',
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      camera.value = data?.camera ?? null;
      sectionName.value = data?.sectionName ?? '园区公共区域';
      events.value = [];
      modalApi.setState({ title: `AI 监控 - ${camera.value?.name ?? ''}` });
      // 等 canvas 渲染出来再启动循环
      setTimeout(() => {
        startEventStream();
        void drawFrame();
      }, 80);
    } else {
      stopLoops();
    }
  },
});

onBeforeUnmount(() => {
  stopLoops();
});
</script>

<template>
  <Modal>
    <div class="flex flex-col gap-3">
      <div class="relative overflow-hidden rounded-lg border border-white/10">
        <canvas
          ref="canvasRef"
          width="720"
          height="405"
          class="block h-auto w-full"
        ></canvas>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs opacity-60">
          覆盖区域：{{ sectionName }} · {{ camera?.feature }}
        </span>
        <NTag
          size="small"
          :type="camera?.status === 'online' ? 'success' : 'error'"
        >
          {{ camera?.status === 'online' ? '在线 · AI 分析中' : '离线' }}
        </NTag>
      </div>
      <div>
        <div class="mb-2 text-sm font-semibold">AI 事件流（实时）</div>
        <div
          class="max-h-52 overflow-auto rounded-lg border border-white/10 p-2"
        >
          <div
            v-for="(event, index) in events"
            :key="`${event.time}-${index}`"
            class="flex items-center gap-2 py-1.5 text-xs"
            :class="{ 'opacity-60': index > 0 }"
          >
            <span class="shrink-0 opacity-60">{{ event.time }}</span>
            <NTag
              :bordered="false"
              size="small"
              :type="LEVEL_TAG[event.level] as never"
            >
              {{
                event.level === 'danger'
                  ? '预警'
                  : event.level === 'warn'
                    ? '提醒'
                    : '识别'
              }}
            </NTag>
            <span class="min-w-0 flex-1 truncate">{{ event.text }}</span>
          </div>
          <div
            v-if="events.length === 0"
            class="py-6 text-center text-xs opacity-40"
          >
            正在接入 AI 分析引擎…
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
