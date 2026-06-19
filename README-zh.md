# Kokoro TTS

<p align="center">
    <a href="https://www.npmjs.com/package/@uzen/kokoro-js"><img alt="NPM" src="https://img.shields.io/npm/v/@uzen%2Fkokoro-js"></a>
    <a href="https://www.npmjs.com/package/@uzen/kokoro-js"><img alt="NPM Downloads" src="https://img.shields.io/npm/dw/@uzen%2Fkokoro-js"></a>
    <a href="https://www.jsdelivr.com/package/npm/@uzen/kokoro-js"><img alt="jsDelivr Hits" src="https://img.shields.io/jsdelivr/npm/hw/@uzen%2Fkokoro-js"></a>
    <a href="https://www.npmjs.com/package/@uzen/kokoro-js"><img alt="License" src="https://img.shields.io/npm/l/@uzen%2Fkokoro-js?color=blue"></a>
</p>

语言：[English](./README.md) | 简体中文

`@uzen/kokoro-js` 是基于 [Transformers.js](https://huggingface.co/docs/transformers.js) 的 Kokoro TTS JavaScript 运行时封装。当前版本面向 Kokoro-82M-v1.1-zh-ONNX 模型接线，内置中文音素化流程，支持普通话以及中英混合文本。

## 目标

- 为 `kokoro.js` 增加浏览器本地的普通话和中英混合 TTS 支持。
- 以 Python `kokoro` 和 `misaki` v1.1 中文前端作为中文音素化、文本归一化、变调和儿化行为参考。
- 保持 JavaScript 包运行时自包含且适合浏览器使用；Python 只作为行为参考，不作为运行时依赖。
- 面向 Kokoro-82M-v1.1-zh-ONNX 模型、本地 voice 资产和 WebGPU 优先路径，提供可实际部署的 Web 推理体验。
- 中英混合文本中的英文片段保留可读输出，走现有英文音素化路径，而不是丢弃或替换为未知符号。

## 当前状态

- 中文音素化会直接输出 v1.1 中文 tokenizer 符号，不再回落到英文 espeak 音素化。
- 已覆盖常见普通话文本归一化场景，包括时间、日期、数字范围、分数、负数、百分比、电话号码、温度、度量衡、金额和量词数字。
- 已实现一批声调相关规则，包括常见轻声词和粒子、叠词轻声、`一`/`不` 变调、三声变调和儿化处理。
- Golden corpus 以 Python `misaki` v1.1 输出作为参考；当前计划记录 164 条样例，其中 143 条 match，21 条已知 gap。
- 剩余 gap 主要来自 `Intl.Segmenter` 与 `jieba.posseg` 的分词差异、浏览器路径缺少 POS 信息，以及长尾文本归一化规则尚未完全覆盖。

## 特点

- 通过 Transformers.js 在浏览器和 Node.js 中运行 Kokoro TTS。
- 支持 Kokoro-82M-v1.1-zh-ONNX 模型：`onnx-community/Kokoro-82M-v1.1-zh-ONNX`。
- 支持普通话文本和中英混合文本，中文会走显式中文音素化路径。
- 通过 `voicePath` 加载本地 voice 文件；npm 包不内置 voice `.bin` 文件。
- 支持 `tts.generate()` 一次性生成，也支持 `tts.stream()` 分段生成。

## 待优化项

- 推理前需要应用自行托管或复制 voice `.bin` 文件。
- 当前注册的英文 voice 只有 `af_maple`、`af_sol` 和 `bf_vale`。
- 中文音素化由 JavaScript 实现，长尾多音字或文本归一化场景可能仍与 Python `misaki` 有差异。
- 浏览器性能依赖 WebGPU 可用性；只有在 `webgpu` 不可用时才建议回退到 `wasm`。
- 推荐使用 `fp32`、`fp16` 和 `q4f16`；`q8`、`q4` 虽然可由加载器支持，但不推荐用于该模型。

## 安装

```bash
npm i @uzen/kokoro-js
```

安装本包时会同时安装运行依赖，包括 `@huggingface/transformers`。Transformers.js 会进一步带入 ONNX Runtime 相关传递依赖，例如 `onnxruntime-web`；应用不需要单独安装这些包。

## 模型和声音

使用 Kokoro-82M-v1.1-zh-ONNX 模型：

```txt
onnx-community/Kokoro-82M-v1.1-zh-ONNX
```

voice `.bin` 文件不会打包进 npm 包。请从模型仓库下载需要的 voice 文件，并通过 `voicePath` 暴露给运行时。

- 浏览器/Vite 应用：把 `zf_001.bin` 这类文件放到 `public/kokoro/voices/`；默认 `voicePath` 是 `/kokoro/voices`。
- Node.js：把 voice 文件放到本地目录，并把该目录作为 `voicePath` 传入，例如 `voicePath: "./voices"`。

当前注册的 voice 包括 Kokoro-82M-v1.1-zh-ONNX 中文 voice、两个美式英语 voice 和一个英式英语 voice：

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

运行时请以 `tts.list_voices()` 或 `tts.voices` 返回的结果为准。

## 生成语音

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

默认推荐使用 `"fp32"` 作为 `dtype`，浏览器默认推荐使用 `"webgpu"` 作为 `device`。推荐的 `dtype` 是 `"fp32"`、`"fp16"` 和 `"q4f16"`；`"q8"`、`"q4"` 等量化版本虽然可由加载器支持，但不推荐用于该模型。支持的 `device` 包括 `"webgpu"`、`"wasm"`、`"cpu"` 或 `null`；浏览器优先使用 `"webgpu"`，不可用时回退到 `"wasm"`，Node.js 使用 `"cpu"`。

## 流式生成

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

`tts.stream()` 也可以直接接收字符串。默认会使用 `TextSplitterStream` 进行句子切分，并对过长片段按标点继续切分。

## API 说明

- `KokoroTTS.from_pretrained(model_id, options)` 通过 Transformers.js 加载模型和 tokenizer。
- `tts.generate(text, { voice, speed })` 返回 Transformers.js 的 `RawAudio` 对象。
- `tts.stream(textOrSplitter, options)` 为每个生成片段产出 `{ text, phonemes, audio }`。
- `voicePath` 是基础路径，不是完整文件路径；浏览器会加载 `${voicePath}/${voice}.bin`，Node.js 会按同样模式从本地文件系统解析。
- `zf_` 和 `zm_` 开头的中文 voice 使用中文音素化路径；`af_` 和 `bf_` 开头的英文 voice 使用英文音素化路径。
