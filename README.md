# Kokoro TTS

<p align="center">
    <a href="https://www.npmjs.com/package/@uzen/kokoro-js"><img alt="NPM" src="https://img.shields.io/npm/v/@uzen%2Fkokoro-js"></a>
    <a href="https://www.npmjs.com/package/@uzen/kokoro-js"><img alt="NPM Downloads" src="https://img.shields.io/npm/dw/@uzen%2Fkokoro-js"></a>
    <a href="https://www.jsdelivr.com/package/npm/@uzen/kokoro-js"><img alt="jsDelivr Hits" src="https://img.shields.io/jsdelivr/npm/hw/@uzen%2Fkokoro-js"></a>
    <a href="https://www.npmjs.com/package/@uzen/kokoro-js"><img alt="License" src="https://img.shields.io/npm/l/@uzen%2Fkokoro-js?color=blue"></a>
</p>

Language: English | [简体中文](./README-zh.md)

`@uzen/kokoro-js` is a JavaScript runtime wrapper for Kokoro TTS based on [Transformers.js](https://huggingface.co/docs/transformers.js). This fork is wired for the Kokoro-82M-v1.1-zh-ONNX model and supports Mandarin plus mixed Chinese/English text through the built-in phonemizer.

## Goals

- Add browser-local Mandarin and mixed Chinese/English TTS support to `kokoro.js`.
- Use Python `kokoro` plus `misaki` v1.1 Chinese frontend behavior as the reference for Chinese phonemization, normalization, tone sandhi, and erhua handling.
- Keep the JavaScript package self-contained and browser-friendly at runtime; Python is used only as a behavior reference, not as a runtime dependency.
- Target practical web inference with the Kokoro-82M-v1.1-zh-ONNX model, local voice assets, and a WebGPU-first default path.
- Preserve usable English spans in mixed text by routing them through the existing English phonemizer path instead of dropping them.

## Current Status

- Chinese phonemization now emits v1.1 Chinese tokenizer symbols directly instead of falling back to English espeak phonemization.
- The implementation covers common Mandarin normalization cases including time expressions, dates, numeric ranges, fractions, negative numbers, percentages, phone numbers, temperatures, measurements, money, and quantified numbers.
- Tone-related handling includes selected neutral-tone words and particles, reduplication, `一`/`不` sandhi, third-tone sandhi, and erhua handling.
- Golden corpus tracking is based on Python `misaki` v1.1 outputs; the current plan records 164 examples with 143 matches and 21 known gaps.
- Remaining gaps mainly come from `Intl.Segmenter` versus `jieba.posseg` segmentation differences, missing POS information in the browser path, and long-tail text normalization cases.

## Features

- Runs Kokoro TTS in browser and Node.js through Transformers.js.
- Supports the Kokoro-82M-v1.1-zh-ONNX model: `onnx-community/Kokoro-82M-v1.1-zh-ONNX`.
- Supports Mandarin text and mixed Chinese/English text with explicit Chinese phonemization.
- Provides local voice loading through `voicePath`; voice `.bin` files are not bundled in the npm package.
- Supports single-shot generation through `tts.generate()` and chunked generation through `tts.stream()`.

## Known Limitations

- Voice assets must be hosted or copied by the application before inference can run.
- The registered English voice set is limited to `af_maple`, `af_sol`, and `bf_vale`.
- Chinese phonemization is implemented in JavaScript and may still differ from Python `misaki` on long-tail polyphones or text normalization cases.
- Browser performance depends on WebGPU availability; use `wasm` only as a fallback when `webgpu` is unavailable.
- `fp32`, `fp16`, and `q4f16` are recommended; `q8` and `q4` are supported by the loader but not recommended for this model.

## Install

```bash
npm i @uzen/kokoro-js
```

Installing this package also installs its runtime dependencies, including `@huggingface/transformers`. Transformers.js brings in ONNX Runtime packages such as `onnxruntime-web` as transitive dependencies; applications do not need to install them separately.

## Model And Voices

Use the Kokoro-82M-v1.1-zh-ONNX model:

```txt
onnx-community/Kokoro-82M-v1.1-zh-ONNX
```

Voice `.bin` files are not bundled in the npm package. Download the voice files you need from the model repository and expose them through `voicePath`.

- Browser/Vite apps: put files such as `zf_001.bin` under `public/kokoro/voices/`; the default `voicePath` is `/kokoro/voices`.
- Node.js: put the files in a local directory and pass that directory as `voicePath`, for example `voicePath: "./voices"`.

Current registered voices are the Kokoro-82M-v1.1-zh-ONNX Chinese voices plus two American English voices and one British English voice:

```txt
af_maple, af_sol, bf_vale
zf_001, zf_002, zf_003, zf_004, zf_005, zf_006, zf_007, zf_008,
zf_017, zf_018, zf_019, zf_021, zf_022, zf_023, zf_024, zf_026,
zf_027, zf_028, zf_032, zf_036, zf_038, zf_039, zf_040, zf_042,
zf_043, zf_044, zf_046, zf_047, zf_048, zf_049, zf_051, zf_059,
zf_060, zf_067, zf_070, zf_071, zf_072, zf_073, zf_074, zf_075,
zf_076, zf_077, zf_078, zf_079, zf_083, zf_084, zf_085, zf_086,
zf_087, zf_088, zf_090, zf_092, zf_093, zf_094, zf_099,
zm_009, zm_010, zm_011, zm_012, zm_013, zm_014, zm_015, zm_016,
zm_020, zm_025, zm_029, zm_030, zm_031, zm_033, zm_034, zm_035,
zm_037, zm_041, zm_045, zm_050, zm_052, zm_053, zm_054, zm_055,
zm_056, zm_057, zm_058, zm_061, zm_062, zm_063, zm_064, zm_065,
zm_066, zm_068, zm_069, zm_080, zm_081, zm_082, zm_089, zm_091,
zm_095, zm_096, zm_097, zm_098, zm_100
```

Call `tts.list_voices()` or read `tts.voices` at runtime for the authoritative list from the installed package.

## Generate Speech

```js
import { KokoroTTS } from "@uzen/kokoro-js";

const model_id = "onnx-community/Kokoro-82M-v1.1-zh-ONNX";
const tts = await KokoroTTS.from_pretrained(model_id, {
  dtype: "fp32",
  device: "webgpu",
  voicePath: "/kokoro/voices",
});

const audio = await tts.generate("你好，欢迎使用 Kokoro 中文语音。", {
  voice: "zf_001",
  speed: 1,
});

audio.save("audio.wav");
```

Use `"fp32"` as the default `dtype` and `"webgpu"` as the default browser `device`. Recommended `dtype` values are `"fp32"`, `"fp16"`, and `"q4f16"`. Other supported quantized variants such as `"q8"` and `"q4"` are not recommended for this model. Supported `device` values are `"webgpu"`, `"wasm"`, `"cpu"`, or `null`; browser apps should prefer `"webgpu"` when available and can fall back to `"wasm"`, while Node.js uses `"cpu"`.

## Stream Speech

```js
import { KokoroTTS, TextSplitterStream } from "@uzen/kokoro-js";

const model_id = "onnx-community/Kokoro-82M-v1.1-zh-ONNX";
const tts = await KokoroTTS.from_pretrained(model_id, {
  dtype: "fp32",
  device: "webgpu",
});

const splitter = new TextSplitterStream();
const stream = tts.stream(splitter, { voice: "zf_001" });

(async () => {
  let index = 0;
  for await (const { text, phonemes, audio } of stream) {
    console.log({ text, phonemes });
    audio.save(`audio-${index++}.wav`);
  }
})();

splitter.push("Kokoro 支持中文和中英 mixed text。它可以分段生成音频。");
splitter.close();
```

`tts.stream()` also accepts a string directly. By default it uses `TextSplitterStream` sentence splitting and further splits long chunks at punctuation boundaries.

## API Notes

- `KokoroTTS.from_pretrained(model_id, options)` loads the model and tokenizer through Transformers.js.
- `tts.generate(text, { voice, speed })` returns a Transformers.js `RawAudio` object.
- `tts.stream(textOrSplitter, options)` yields `{ text, phonemes, audio }` for each generated chunk.
- `voicePath` is a base path, not a full file path; the runtime loads `${voicePath}/${voice}.bin` in browsers and resolves the same pattern from the local filesystem in Node.js.
- Chinese voices begin with `zf_` or `zm_` and use the Chinese phonemizer path. English voices beginning with `af_` or `bf_` use the English phonemizer path.
