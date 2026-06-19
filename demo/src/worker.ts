import { env, KokoroTTS } from "@uzen/kokoro-js";
import { AUDIO_SAMPLE_RATE, MAX_QUEUED_AUDIO_BUFFERS, MODEL_DTYPE } from "./constants";
import type { WorkerRequest } from "./worker-protocol";

const MODEL_ID = "/kokoro";
env.allowLocalModels = true;

let tts: KokoroTTS;
let activeRequestId = 0;
let queued = 0;

async function loadModel(device: string) {
  tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: MODEL_DTYPE, device: device as any });
}

async function init() {
  const device = (await navigator.gpu?.requestAdapter()) ? "webgpu" : "wasm";
  try {
    await loadModel(device);
  } catch {
    await loadModel("wasm");
  }
  self.postMessage({ status: "ready", voices: tts.voices, device, dtype: MODEL_DTYPE });
}

init();

self.addEventListener("message", async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;

  if (msg.type === "buffer_processed") {
    queued = Math.max(0, queued - 1);
    return;
  }

  if (msg.type === "stop") {
    queued = 0;
    if (!msg.requestId || msg.requestId === activeRequestId) activeRequestId++;
    return;
  }

  if (msg.type === "generate") {
    activeRequestId = msg.requestId;
    const { requestId, text, voice, maxChunkLength } = msg;
    const startedAt = performance.now();
    let idx = 0;

    try {
      for await (const chunk of tts.stream(text, { voice: voice as any, maxChunkLength })) {
        if (requestId !== activeRequestId) return;
        while (queued >= MAX_QUEUED_AUDIO_BUFFERS && requestId === activeRequestId) {
          await new Promise((r) => setTimeout(r, 100));
        }
        if (requestId !== activeRequestId) return;
        const samples = chunk.audio.audio.slice().buffer;
        queued++;
        self.postMessage(
          { status: "chunk", requestId, chunkIndex: idx++, text: chunk.text, samples, sampleRate: AUDIO_SAMPLE_RATE, elapsedMs: performance.now() - startedAt },
          { transfer: [samples] },
        );
      }
    } catch (err) {
      self.postMessage({ status: "error", requestId, error: String(err) });
      return;
    }

    if (requestId !== activeRequestId) return;
    self.postMessage({ status: "complete", requestId, inferenceMs: performance.now() - startedAt });
  }
});
