import { KokoroTTS } from "kokoro-js";
import { detectWebGPU } from "./utils.js";

const model_id = "onnx-community/Kokoro-82M-v1.1-zh-ONNX";
let device = (await detectWebGPU()) ? "webgpu" : "wasm";
let tts;

try {
  tts = await KokoroTTS.from_pretrained(model_id, {
    dtype: "fp32",
    device,
  });
} catch (error) {
  if (device === "webgpu") {
    device = "wasm";
    tts = await KokoroTTS.from_pretrained(model_id, {
      dtype: "fp32",
      device,
    });
  } else {
    self.postMessage({ status: "error", error: error.message });
    throw error;
  }
}

self.postMessage({ status: "device", device });
self.postMessage({ status: "ready", voices: tts.voices, device });

// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
  const { text, voice } = e.data;

  let audio;
  try {
    // Generate speech
    audio = await tts.generate(text, { voice });
  } catch (e) {
    self.postMessage({ status: "error", error: e.message });
    return;
  }

  // Send the audio file back to the main thread
  const blob = audio.toBlob();
  self.postMessage({ status: "complete", audio: URL.createObjectURL(blob), text });
});
