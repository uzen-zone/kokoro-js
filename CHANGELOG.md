# Changelog

## Unreleased

### Added
- Added `_splitLongText()` and `maxChunkLength` option (default 200) for `stream()` to handle long text chunks at punctuation boundaries.
- Added `kokoro.js/voices/` directory with 103 local voice `.bin` files for Node.js loading (mirrors `demo/public/kokoro/voices/`).
- Added Chinese polyphone phrase overrides for 14 entries (开户行, 发卡行, 行号, 各地, 色差, 掺和, 借还款, 还款成功, 时间为准, etc.) to fix G2P disambiguation bypassing `Intl.Segmenter` fragmentation.
- Added `normalize_chinese_punctuation()` for full-width bracket/quote normalization.
- Added `PLAN.md` with the current Chinese extension status, known `misaki` alignment gaps, and a prioritized backlog for `zh_normalization` parity.
- Added Chinese `HH:MM` and time-range normalization for examples such as `15:30`, `8:05`, and `8:30-12:30`.
- Added Chinese slash/dash date normalization for examples such as `2026-06-19` and `2026/06/19`.

### Changed
- Refactored demo worker and UI: removed duplicate `splitLongText`/`splitTextForSpeech`, delegate chunking to `tts.stream()`. Article rendering simplified to paragraph-level with improved highlight matching.
- Replaced `customPinyin()` approach (broken in pinyin-pro v3.28.1, produces `ge4`→`ge40`) with direct zhuyin overrides in `CHINESE_PHRASE_OVERRIDES`.
- Refactored Chinese polyphone disambiguation to hybrid approach: **post-segmentation phrase merging** + limited override table. Added `POLYPHONE_MERGE_PHRASES` Set and `mergePhrases()` to rejoin known phrases split by `Intl.Segmenter` before passing to `pinyin-pro`. Only entries where pinyin-pro itself gives wrong output remain in override table.

### Fixed
- Fixed `借还款`/`还款成功` zhuyin from `hái` (还是) to `huán` (归还). Updated golden corpus accordingly.
- Added Chinese phonemization for `kokoro.js` using v1.1 zh tokenizer symbols.
- Added numbered v1.1 zh ONNX voices and updated the default voice data URL.
- Added Chinese phonemizer regression tests and a Chinese extension plan.
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
- Expanded Chinese mixed-English handling: JS currently phonemizes English spans with the existing English path, while the golden fixture records Python `misaki` `unk=❓` gaps where behavior intentionally differs.
- Documented the `fp16` ONNX diagnostic result while keeping the demo default on `fp32`.
- Expanded Chinese golden coverage for more `misaki` v1.1 segmentation, tone sandhi, erhua, numeric, and mixed-English cases.
- Replaced single-phrase overrides with generic tone sandhi rules from Python `tone_sandhi.py`.
- Capped tone-3 pre-merge at total length ≤3 to prevent over-merging.
- Documented remaining Python `misaki.zh_normalization` parity gaps, including fractions, ranges, phones, temperatures, and measurements.

### Fixed
- Prevented failed voice downloads from being treated as voice data.
- Avoided Chinese text falling through to English phonemization.
- Matched additional Python `misaki` v1.1 outputs for focused phrase, erhua, number-normalization, time-normalization, and date-normalization gaps; the current golden corpus is 156 entries with 122 match and 34 recorded gaps.
- Fixed erhua R placement: R now inserted before tone number (e.g. `元R4` not `元4R`).
- Fixed `地` reading when used as structural particle (e.g. `慢慢地`→de5 not di4).
- Fixed `一` tone in Chinese digit sequences (e.g. `一百`→yi1, not yi4 from pinyin-pro sandhi).
- Fixed 3-char all-tone-3 words with mono+di split (e.g. `纸老虎`→zhi3 not zhi2).
- Fixed `你买水果` segmentation (removed blocking phrase override, now handled by generic rules).
