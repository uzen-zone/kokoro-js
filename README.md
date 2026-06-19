# Kokoro TTS

<p align="center">
    <a href="https://www.npmjs.com/package/kokoro-js"><img alt="NPM" src="https://img.shields.io/npm/v/kokoro-js"></a>
    <a href="https://www.npmjs.com/package/kokoro-js"><img alt="NPM Downloads" src="https://img.shields.io/npm/dw/kokoro-js"></a>
    <a href="https://www.jsdelivr.com/package/npm/kokoro-js"><img alt="jsDelivr Hits" src="https://img.shields.io/jsdelivr/npm/hw/kokoro-js"></a>
    <a href="https://github.com/hexgrad/kokoro/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/hexgrad/kokoro?color=blue"></a>
    <a href="https://huggingface.co/spaces/webml-community/kokoro-webgpu"><img alt="Demo" src="https://img.shields.io/badge/Hugging_Face-demo-green"></a>
</p>

Kokoro is a frontier TTS model for its size of 82 million parameters (text in/audio out). This JavaScript library allows the model to be run 100% locally in the browser thanks to [🤗 Transformers.js](https://huggingface.co/docs/transformers.js). Try it out using our [online demo](https://huggingface.co/spaces/webml-community/kokoro-webgpu)!

## Usage

First, install the `kokoro-js` library from [NPM](https://npmjs.com/package/kokoro-js) using:

```bash
npm i kokoro-js
```

You can then generate speech as follows:

```js
import { KokoroTTS } from "kokoro-js";

const model_id = "onnx-community/Kokoro-82M-v1.1-zh-ONNX";
const tts = await KokoroTTS.from_pretrained(model_id, {
  dtype: "q8", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
  device: "wasm", // Options: "wasm", "webgpu" (web) or "cpu" (node). If using "webgpu", we recommend using dtype="fp32".
});

const text = "Life is like a box of chocolates. You never know what you're gonna get.";
const audio = await tts.generate(text, {
  // Use `tts.list_voices()` to list all available voices
  voice: "af_heart",
});
audio.save("audio.wav");
```

Or if you'd prefer to stream the output, you can do that with:

```js
import { KokoroTTS, TextSplitterStream } from "kokoro-js";

const model_id = "onnx-community/Kokoro-82M-v1.1-zh-ONNX";
const tts = await KokoroTTS.from_pretrained(model_id, {
  dtype: "fp32", // Options: "fp32", "fp16", "q8", "q4", "q4f16"
  // device: "webgpu", // Options: "wasm", "webgpu" (web) or "cpu" (node).
});

// First, set up the stream
const splitter = new TextSplitterStream();
const stream = tts.stream(splitter);
(async () => {
  let i = 0;
  for await (const { text, phonemes, audio } of stream) {
    console.log({ text, phonemes });
    audio.save(`audio-${i++}.wav`);
  }
})();

// Next, add text to the stream. Note that the text can be added at different times.
// For this example, let's pretend we're consuming text from an LLM, one word at a time.
const text = "Kokoro is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models while being significantly faster and more cost-efficient. With Apache-licensed weights, Kokoro can be deployed anywhere from production environments to personal projects. It can even run 100% locally in your browser, powered by Transformers.js!";
const tokens = text.match(/\s*\S+/g);
for (const token of tokens) {
  splitter.push(token);
  await new Promise((resolve) => setTimeout(resolve, 10));
}

// Finally, close the stream to signal that no more text will be added.
splitter.close();

// Alternatively, if you'd like to keep the stream open, but flush any remaining text, you can use the `flush` method.
// splitter.flush();
```

## Voices/Samples

> [!TIP]
> You can find samples for each of the voices in the [model card](https://huggingface.co/onnx-community/Kokoro-82M-v1.1-zh-ONNX#samples) on Hugging Face.

### American English

| Name         | Traits | Target Quality | Training Duration | Overall Grade |
| ------------ | ------ | -------------- | ----------------- | ------------- |
| **af_heart** | 🚺❤️   |                |                   | **A**         |
| af_alloy     | 🚺     | B              | MM minutes        | C             |
| af_aoede     | 🚺     | B              | H hours           | C+            |
| af_bella     | 🚺🔥   | **A**          | **HH hours**      | **A-**        |
| af_jessica   | 🚺     | C              | MM minutes        | D             |
| af_kore      | 🚺     | B              | H hours           | C+            |
| af_nicole    | 🚺🎧   | B              | **HH hours**      | B-            |
| af_nova      | 🚺     | B              | MM minutes        | C             |
| af_river     | 🚺     | C              | MM minutes        | D             |
| af_sarah     | 🚺     | B              | H hours           | C+            |
| af_sky       | 🚺     | B              | _M minutes_ 🤏    | C-            |
| am_adam      | 🚹     | D              | H hours           | F+            |
| am_echo      | 🚹     | C              | MM minutes        | D             |
| am_eric      | 🚹     | C              | MM minutes        | D             |
| am_fenrir    | 🚹     | B              | H hours           | C+            |
| am_liam      | 🚹     | C              | MM minutes        | D             |
| am_michael   | 🚹     | B              | H hours           | C+            |
| am_onyx      | 🚹     | C              | MM minutes        | D             |
| am_puck      | 🚹     | B              | H hours           | C+            |
| am_santa     | 🚹     | C              | _M minutes_ 🤏    | D-            |

### Chinese (Mandarin) — v1.1 zh voices

| Name     | Gender | Name    | Gender | Name    | Gender |
| -------- | ------ | ------- | ------ | ------- | ------ |
| zf_001   | 🚺     | zf_046  | 🚺     | zm_052  | 🚹     |
| zf_002   | 🚺     | zf_047  | 🚺     | zm_053  | 🚹     |
| zf_003   | 🚺     | zf_048  | 🚺     | zm_054  | 🚹     |
| zf_004   | 🚺     | zf_049  | 🚺     | zm_055  | 🚹     |
| zf_005   | 🚺     | zf_051  | 🚺     | zm_056  | 🚹     |
| zf_006   | 🚺     | zf_059  | 🚺     | zm_057  | 🚹     |
| zf_007   | 🚺     | zf_060  | 🚺     | zm_058  | 🚹     |
| zf_008   | 🚺     | zf_067  | 🚺     | zm_061  | 🚹     |
| zf_017   | 🚺     | zf_070  | 🚺     | zm_062  | 🚹     |
| zf_018   | 🚺     | zf_071  | 🚺     | zm_063  | 🚹     |
| zf_019   | 🚺     | zf_072  | 🚺     | zm_064  | 🚹     |
| zf_021   | 🚺     | zf_073  | 🚺     | zm_065  | 🚹     |
| zf_022   | 🚺     | zf_074  | 🚺     | zm_066  | 🚹     |
| zf_023   | 🚺     | zf_075  | 🚺     | zm_068  | 🚹     |
| zf_024   | 🚺     | zf_076  | 🚺     | zm_069  | 🚹     |
| zf_026   | 🚺     | zf_077  | 🚺     | zm_080  | 🚹     |
| zf_027   | 🚺     | zf_078  | 🚺     | zm_081  | 🚹     |
| zf_028   | 🚺     | zf_079  | 🚺     | zm_082  | 🚹     |
| zf_032   | 🚺     | zf_083  | 🚺     | zm_089  | 🚹     |
| zf_036   | 🚺     | zf_084  | 🚺     | zm_091  | 🚹     |
| zf_038   | 🚺     | zf_085  | 🚺     | zm_095  | 🚹     |
| zf_039   | 🚺     | zf_086  | 🚺     | zm_096  | 🚹     |
| zf_040   | 🚺     | zf_087  | 🚺     | zm_097  | 🚹     |
| zf_042   | 🚺     | zf_088  | 🚺     | zm_098  | 🚹     |
| zf_043   | 🚺     | zf_090  | 🚺     | zm_100  | 🚹     |
| zf_044   | 🚺     | zf_092  | 🚺     | zm_009  | 🚹     |
| zf_092   | 🚺     | zf_093  | 🚺     | zm_010  | 🚹     |
| zf_094   | 🚺     | zf_099  | 🚺     | zm_011  | 🚹     |
| zm_012   | 🚹     | zm_020  | 🚹     | zm_029  | 🚹     |
| zm_013   | 🚹     | zm_025  | 🚹     | zm_030  | 🚹     |
| zm_014   | 🚹     | zm_031  | 🚹     | zm_033  | 🚹     |
| zm_015   | 🚹     | zm_034  | 🚹     | zm_035  | 🚹     |
| zm_016   | 🚹     | zm_037  | 🚹     | zm_041  | 🚹     |
| zm_045   | 🚹     | zm_050  | 🚹     |         |        |

Use with v1.1 zh model: `onnx-community/Kokoro-82M-v1.1-zh-ONNX`.

### British English

| Name        | Traits | Target Quality | Training Duration | Overall Grade |
| ----------- | ------ | -------------- | ----------------- | ------------- |
| bf_alice    | 🚺     | C              | MM minutes        | D             |
| bf_emma     | 🚺     | B              | **HH hours**      | B-            |
| bf_isabella | 🚺     | B              | MM minutes        | C             |
| bf_lily     | 🚺     | C              | MM minutes        | D             |
| bm_daniel   | 🚹     | C              | MM minutes        | D             |
| bm_fable    | 🚹     | B              | MM minutes        | C             |
| bm_george   | 🚹     | B              | MM minutes        | C             |
| bm_lewis    | 🚹     | C              | H hours           | D+            |
