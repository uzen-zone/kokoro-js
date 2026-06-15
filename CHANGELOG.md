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

### Fixed
- Prevented failed voice downloads from being treated as voice data.
- Avoided Chinese text falling through to English phonemization.
