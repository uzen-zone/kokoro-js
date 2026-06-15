# Changelog

## Unreleased

### Added
- Added Chinese phonemization for `kokoro.js` using v1.1 zh tokenizer symbols.
- Added numbered v1.1 zh ONNX voices and updated the default voice data URL.
- Added Chinese phonemizer regression tests and a Chinese extension plan under `docs/`.
- Added demo support for `onnx-community/Kokoro-82M-v1.1-zh-ONNX` with WebGPU-first initialization and wasm fallback.

### Changed
- Upgraded `@huggingface/transformers` to `^4.2.0` for improved WebGPU behavior.
- Made the package build script Windows-compatible.
- Updated demo defaults to Chinese text and v1.1 zh voices.
- Aligned Chinese mixed-English fallback with Python `misaki` v1.1 golden output by emitting `❓` for English spans.
- Documented the `fp16` ONNX diagnostic result while keeping the demo default on `fp32`.

### Fixed
- Prevented failed voice downloads from being treated as voice data.
- Avoided Chinese text falling through to English phonemization.
- Matched the remaining Chinese golden corpus gaps, including `小院儿` erhua handling.
