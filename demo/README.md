# Kokoro TTS Demo

Browser-based local TTS demo powered by `kokoro-js` with Kokoro-82M-v1.1-zh-ONNX model.

浏览器端本地 TTS 演示，基于 `kokoro-js` 和 Kokoro-82M-v1.1-zh-ONNX 模型。

Everything runs **100% locally** — no CDN, no online model download, no external API calls. Suitable for LAN / intranet deployment.

一切均在**本地运行**，不涉及 CDN，无需在线下载模型，无外部 API 调用。适用于局域网 / 内网部署。

---

## Features / 功能

- **Streaming TTS**: generates audio chunk-by-chunk and plays while generating / 分段生成音频，边生成边播放
- **Mixed Chinese & English**: supports Mandarin and mixed Chinese/English text / 支持中文和中英混合文本
- **WebGPU acceleration**: auto-detects WebGPU, falls back to WASM / 自动检测 WebGPU，自动回退到 WASM
- **Local model**: Kokoro-82M-v1.1-zh-ONNX with 100+ Chinese voices bundled / 内置模型和语音文件

---

## Architecture / 架构

```
demo/
├── public/kokoro/          # Local model assets (ONNX, tokenizer, voices)
│   ├── onnx/model.onnx     # TTS model (~339 MB)
│   ├── tokenizer.json      # v1.1-zh tokenizer
│   ├── config.json
│   └── voices/             # Voice embedding files (.bin)
├── src/
│   ├── App.vue             # Main UI (Vue 3)
│   ├── worker.ts           # Web Worker: model loading + streaming inference
│   ├── worker-protocol.ts  # Worker message types
│   ├── constants.ts        # Config constants
│   └── utils.ts            # WebGPU detection
├── index.html
├── package.json            # Deps: @uzen/kokoro-js, vue, vite
└── vite.config.js
```

### Data flow / 数据流

```
Main Thread (Vue)               Web Worker
┌─────────────────┐            ┌──────────────────┐
│  Input text      │  generate  │  Load ONNX model  │
│  Voice select    │ ────────>  │  tts.stream()     │
│  Play audio      │            │  chunk by chunk   │
│  Status display  │ <────────  │  postMessage()    │
└─────────────────┘   audio    └──────────────────┘
                      chunks
```

---

## Prerequisites / 前置要求

- Node.js >= 18
- The `kokoro-js` parent package must be built first / 父级 `kokoro-js` 包需要先构建：

### Download model file / 下载模型文件

The ONNX model (`model.onnx`, ~339 MB) is not included in the repository due to GitHub's file size limit. Download it manually and place it in the correct location:

模型文件 (`model.onnx`, ~339 MB) 因超过 GitHub 文件大小限制，未包含在仓库中。请手动下载并放置到正确位置：

```bash
# Download from Hugging Face / 从 Hugging Face 下载
# Method 1: Use git LFS
git lfs clone https://huggingface.co/onnx-community/Kokoro-82M-v1.1-zh-ONNX
# Then copy model.onnx to demo/public/kokoro/onnx/

# Method 2: Download directly / 直接下载
# https://huggingface.co/onnx-community/Kokoro-82M-v1.1-zh-ONNX/resolve/main/onnx/model.onnx
```

Place the downloaded `model.onnx` file at:

```
demo/public/kokoro/onnx/model.onnx
```

```bash
cd ..
npm run build
cd demo
```

## Usage / 使用

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

> Browsers require WebGPU to be served over **localhost** or **HTTPS**. WASM fallback works on any origin.
>
> 浏览器要求 WebGPU 通过 **localhost** 或 **HTTPS** 提供服务，WASM 降级可在任意源下使用。

## Build / 构建

```bash
npm run build
npm run preview
```

Output goes to `dist/`.

---

## Model Assets / 模型文件

| File / 文件 | Size / 大小 | Description / 说明 |
|---|---|---|
| `public/kokoro/onnx/model.onnx` | ~339 MB | Kokoro-82M-v1.1-zh-ONNX |
| `public/kokoro/tokenizer.json` | ~5 KB | v1.1-zh tokenizer vocabulary |
| `public/kokoro/voices/zf_001.bin` | ~512 KB | Female Chinese voice / 中文女声 |
| `public/kokoro/voices/zm_009.bin` | ~512 KB | Male Chinese voice / 中文男声 |

Voice files are 256-dimensional float32 style embeddings (512 KB each at 509 token positions).

Voice `.bin` 文件是 256 维 float32 风格嵌入（509 个 token 位置，每个 512 KB）。

---

## Tech Stack / 技术栈

- **`@uzen/kokoro-js`** — Kokoro TTS runtime (Transformers.js + ONNX Runtime Web)
- **Vue 3** — UI framework (Composition API)
- **Vite 6** — Build tool and dev server
