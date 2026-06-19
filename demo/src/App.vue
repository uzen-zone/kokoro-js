<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { MAX_CHUNK_LENGTH, MAX_QUEUED_AUDIO_BUFFERS, VERSION } from "./constants";
import type { Voice, WorkerResponse } from "./worker-protocol";
import { detectWebGPU } from "./utils";

const KEPT_VOICES = ["zf_001", "zm_009"];

const inputText = ref(`Kokoro 是新一代的 TTS 模型，支持中文和英文混合语音合成。

这项技术的核心优势在于其能够在浏览器中 100% 本地运行，无需任何服务器支持。It leverages WebGPU for acceleration and falls back to WASM when needed.

无论是中文的长篇文章，还是像 "Hello World" 这样的英文短句，Kokoro 都能生成自然流畅的语音。

The model uses a style encoder to capture voice characteristics, combined with a tokenizer that handles both CJK characters and Latin scripts seamlessly.

你可以试试混合输入：Today is 2026 年 6 月 20 日，天气真不错！`);
const voices = ref<Record<string, Voice>>({});
const selectedVoice = ref("zf_001");
const availableVoices = computed(() => {
  const r: Record<string, Voice> = {};
  for (const id of KEPT_VOICES) {
    if (voices.value[id]) r[id] = voices.value[id];
  }
  return r;
});
const status = ref<"loading" | "ready" | "running" | "error">("loading");
const error = ref("");
const hasWebGPU = ref<boolean | null>(null);
const device = ref("wasm");
const readyState = computed(() => {
  if (status.value === "loading") return "Booting";
  if (status.value === "running") return "Generating";
  if (status.value === "error") return "Error";
  return "Ready";
});

let worker: Worker | null = null;
let requestId = 0;
const audioQueue: { samples: Float32Array; sampleRate: number }[] = [];
let isPlaying = false;
let ac: AudioContext | null = null;
let queueCount = ref(0);
let chunkCount = ref(0);

function startGeneration() {
  if (!worker || status.value === "running" || !inputText.value.trim()) return;
  error.value = "";
  status.value = "running";
  chunkCount.value = 0;
  const id = ++requestId;
  worker.postMessage({ type: "generate", requestId: id, text: inputText.value.trim(), voice: selectedVoice.value, device: device.value, maxChunkLength: MAX_CHUNK_LENGTH });
}

function handleWorkerMessage(e: MessageEvent<WorkerResponse>) {
  const msg = e.data;
  if (msg.status === "ready") {
    voices.value = msg.voices;
    device.value = msg.device;
    status.value = "ready";
  } else if (msg.status === "error") {
    status.value = "error";
    error.value = msg.error;
  } else if (msg.status === "chunk") {
    if (!ac) ac = new AudioContext();
    chunkCount.value++;
    audioQueue.push({ samples: new Float32Array(msg.samples), sampleRate: msg.sampleRate });
    queueCount.value = audioQueue.length;
    playNext();
  } else if (msg.status === "complete") {
    status.value = "ready";
  }
}

function playNext() {
  if (isPlaying || audioQueue.length === 0) return;
  isPlaying = true;
  const entry = audioQueue.shift();
  if (!entry || !ac) return (isPlaying = false);
  queueCount.value = audioQueue.length;
  const buf = ac.createBuffer(1, entry.samples.length, entry.sampleRate);
  buf.getChannelData(0).set(entry.samples);
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  if (ac.state === "suspended") ac.resume();
  src.onended = () => {
    isPlaying = false;
    worker?.postMessage({ type: "buffer_processed" });
    playNext();
  };
  src.start();
}

function stop() {
  if (worker) worker.postMessage({ type: "stop", requestId });
  audioQueue.length = 0;
  queueCount.value = 0;
  isPlaying = false;
  status.value = "ready";
}

onMounted(async () => {
  hasWebGPU.value = await detectWebGPU();
  device.value = hasWebGPU.value ? "webgpu" : "wasm";
  worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  worker.addEventListener("message", handleWorkerMessage);
});

onUnmounted(() => {
  stop();
  worker?.terminate();
  ac?.close();
});
</script>

<template>
  <div class="app">
    <div class="card">
      <div class="card-header">
        <h1>Kokoro TTS <span style="font-size:0.75rem;font-weight:400;color:#94a3b8">v{{ VERSION }}</span></h1>
        <p>Local text-to-speech with v1.1-zh · 100% in-browser</p>
      </div>

      <div v-if="hasWebGPU === false" class="warning">
        ⚠ WebGPU 不可用，使用 WASM 模式。语音生成会较慢，不建议长文本。
      </div>

      <textarea v-model="inputText" placeholder="输入文字..."></textarea>

      <div class="controls">
        <select v-model="selectedVoice">
          <option v-for="[id, v] in Object.entries(availableVoices)" :key="id" :value="id">
            {{ id }} ({{ v.language === "zh" ? "中文" : v.language }} {{ v.gender }})
          </option>
        </select>
        <button class="btn" :disabled="status === 'running' || !inputText.trim()" @click="startGeneration">
          {{ status === "running" ? "生成中..." : "生成语音" }}
        </button>
        <button v-if="status === 'running'" class="btn" style="background:#ef4444" @click="stop">停止</button>
      </div>

      <div class="status-bar">
        <div class="status-item"><span class="status-label">状态</span><span class="status-value">{{ readyState }}</span></div>
        <div class="status-item"><span class="status-label">设备</span><span class="status-value">{{ device }}</span></div>
        <div class="status-item"><span class="status-label">声音</span><span class="status-value">{{ selectedVoice }}</span></div>
        <div class="status-item"><span class="status-label">队列</span><span class="status-value">{{ queueCount }}/{{ MAX_QUEUED_AUDIO_BUFFERS }}</span></div>
        <div class="status-item"><span class="status-label">片段</span><span class="status-value">{{ chunkCount }}</span></div>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="status === 'loading'" class="info">正在加载模型...</div>
    </div>
  </div>
</template>
