# Changelog

## Unreleased

### Added
- Added Chinese phonemization for `kokoro.js` using v1.1 zh tokenizer symbols.
- Added numbered v1.1 zh ONNX voices and updated the default voice data URL.
- Added Chinese phonemizer regression tests and a Chinese extension plan under `docs/`.
- Added demo support for `onnx-community/Kokoro-82M-v1.1-zh-ONNX` with WebGPU-first initialization and wasm fallback.
- Added MUST_NEUTRAL_TONE_WORDS (417 words ported from Python `tone_sandhi.py`) for automatic neutral-tone marking.
- Added reduplication-based neutral tone detection (AA pattern, POS-filtered to exclude adverbs like `慢慢`).
- Added V一V / V不V pre-merge and tone sandhi (e.g. `看一看`→yi5, `看不懂`→bu5).
- Added particle/suffix neutral tone rules (`的/地/得/了/着/过/们/子/上/下`→tone 5).
- Added erhua general rules (`must_erhua`/`not_erhua` sets, R-merge before tone number, e.g. `元4`→`元R4`).
- Added consecutive tone-3 pre-merge with length cap ≤3 (matching Python `_merge_continuous_three_tones`).
- Added 3-char all-tone-3 sandhi correction (mono+di vs di+mono, matching Python `_three_sandhi`).
- Added 4-char all-tone-3 sandhi (split 2+2, first of each pair→tone 2).
- Added `一` numeric-context tone reversion (reverts pinyin-pro's internal sandhi for digit sequences).
- Added `地` polyphone override (structural particle→`de5`, not `di4`).
- Expanded Chinese golden corpus from 54 to 119 entries (103 match, 16 gap recorded).

### Changed
- Upgraded `@huggingface/transformers` to `^4.2.0` for improved WebGPU behavior.
- Made the package build script Windows-compatible.
- Updated demo defaults to Chinese text and v1.1 zh voices.
- Aligned Chinese mixed-English fallback with Python `misaki` v1.1 golden output by emitting `❓` for English spans.
- Documented the `fp16` ONNX diagnostic result while keeping the demo default on `fp32`.
- Expanded Chinese golden coverage for more `misaki` v1.1 segmentation, tone sandhi, erhua, numeric, and mixed-English cases.
- Replaced single-phrase overrides with generic tone sandhi rules from Python `tone_sandhi.py`.
- Capped tone-3 pre-merge at total length ≤3 to prevent over-merging.

### Fixed
- Prevented failed voice downloads from being treated as voice data.
- Avoided Chinese text falling through to English phonemization.
- Matched the remaining Chinese golden corpus gaps, including `小院儿` erhua handling.
- Matched additional Python `misaki` v1.1 outputs for focused phrase, erhua, and number-normalization gaps.
- Fixed erhua R placement: R now inserted before tone number (e.g. `元R4` not `元4R`).
- Fixed `地` reading when used as structural particle (e.g. `慢慢地`→de5 not di4).
- Fixed `一` tone in Chinese digit sequences (e.g. `一百`→yi1, not yi4 from pinyin-pro sandhi).
- Fixed 3-char all-tone-3 words with mono+di split (e.g. `纸老虎`→zhi3 not zhi2).
- Fixed `你买水果` segmentation (removed blocking phrase override, now handled by generic rules).
