# kokoro.js 中文扩展计划

## 目标
- 为 `kokoro.js` 增加浏览器本地的中文和中英混合 TTS 支持。
- 以 Python `kokoro` + `misaki` v1.1 中文前端作为行为参考。
- 保持 JS 包自包含且适合浏览器使用，运行时不依赖 Python。

## 当前状态
- `kokoro.js` 中文 demo 推理的模型资产位于 `demo/public/kokoro/`。
- 中文语音使用 v1.1 编号 voice（`zf_001`、`zm_010` 等），voice `.bin` 文件已复制到 `kokoro.js/voices/` 供 Node.js 直接加载。
- demo 默认 `webgpu + fp32`，不可用时回退 `wasm + fp32`；`fp16` 在浏览器中出现静音故不上默认路径。
- JS 中文 phonemize 输出 v1.1 zh tokenizer 符号，不再落到英文 espeak phonemization。
- **Golden 语料：149 条，115 match（77.2%），34 gap（22.8%）。**
- **全量测试：446 条，全部通过。**
- 中文 G2P 已对齐一批 `misaki` v1.1 `ZHFrontend` 注音、变调和儿化行为，但尚未完整移植 Python `zh_normalization`；`15:30`、`2026-06-19`、`3/4`、通用电话号码、温度/度量衡仍是待办。

## 已完成

### Sprint：Demo 重构 + chunk 拆分
- [x] **Demo 切分去重** (`demo/src/App.vue`, `demo/src/worker.ts`)
  - 移除 `splitLongText`/`splitTextForSpeech` 重复实现
  - worker 使用 `tts.stream(text, { maxChunkLength })` async generator
  - 文章展示按段落渲染，高亮按段落匹配
- [x] **超长 chunk 拆分** (`kokoro.js/src/kokoro.js`)
  - `stream()` 新增 `maxChunkLength` 选项（默认 200）
  - `_splitLongText()` 按逗号/分号边界拆分

### Sprint：中文标点 + 多音字消歧 + 轻量 gap 修补
- [x] **中文字符号归一化** (`kokoro.js/src/phonemize.js`)
  - 新增 `normalize_chinese_punctuation()` 将全角括号/引号转为半角
  - `/` 后加空格避免 split 误处理
- [x] **多音字消歧 — v2（Segmenter 后聚合）** (`kokoro.js/src/phonemize.js`)
  - 引入 `POLYPHONE_MERGE_PHRASES` Set + `mergePhrases()` 函数
  - 在 `Intl.Segmenter` 分词后、音调规则之前，将已知多音短语重新合并为完整 segment
  - 合并后 `pinyin-pro` 能利用短语上下文正确消歧（如 `开户行`→háng）
  - 硬编码注音表减少到仅 pinyin-pro 完全给错的条目：`发卡行`、`放款行`、`茧行`、`色差`、`借还款`、`还款`、`还款成功`、`时间为准`
  - 修复 `借还款`/`还款成功` 注音为 `huán`（归还）而非 `hái`（还是）
  - 删除 `customPinyin()` 方式（pinyin-pro v3.28.1 bug：`ge4`→`ge40`）
- [x] **轻量 gap 修补（C 方案）** (`kokoro.js/src/phonemize.js`)
  - 启用 `NEUTRAL_TONE_FINAL_PARTICLES`（吧/呢/吗/啊/呀/嘛/呗 → 轻声 5），零回归风险
  - 添加 4 条短语覆盖：`他的`、`好吧`、`慢慢地`、`听不到`，绕过 Intl.Segmenter 分词粒度过粗问题
  - 对应更新 golden corpus：4 条 gap → match
  - **match rate：66% → 69%**

### Sprint：通用声调和变调规则（上一阶段）

以下规则在 `kokoro.js/src/phonemize.js` 中实现：

| # | 规则 | 来源 | 效果 |
|---|------|------|------|
| 1 | MUST_NEUTRAL_TONE_WORDS（417 词） | `tone_sandhi.py` | 全词/末尾二字匹配 → 末字声调 5 |
| 2 | 叠词轻声（AA pattern） | `_neural_sandhi` | 对齐 Python `pos[0] in {n,v,a}`，排除副词 |
| 3 | V一V / V不V 预合并 | `_merge_yi` + `_yi_sandhi` | 合并为 3 字词 → 一/不 → 声调 5 |
| 4 | 粒子/后缀轻声 | `_neural_sandhi` | 的/地/得 → 5；们/子/上/下 → 5 |
| 5 | 儿化通用规则（R 插入声调前） | `zh_frontend.py` | must_erhua / not_erhua + 通用末尾 儿 检测 |
| 6 | `地` 多音字 | — | 结构助词覆写为 `de5`（非 `di4`） |
| 7 | 三字全三声变调（单+双 vs 双+单） | `_three_sandhi` | Intl.Segmenter 确定拆分 → 差异化变调 |
| 8 | 三声预合并上限 ≤ 3 字 | `pre_merge_for_modify` | 匹配 Python 的 total-length ≤ 3 约束 |
| 9 | 一 数字上下文保持声调 1 | `_yi_sandhi` | 回退 pinyin-pro 内部变调（如 一百→yi4） |
| 10 | 了/着/过合并到前词 | — | 解决 Intl.Segmenter 拆散问题 |

## Golden Corpus 历史

| 阶段 | 条目 | match | gap | 备注 |
|------|------|-------|-----|------|
| 初始 | 54 | 54 | 0 | `2a1f202` |
| 第一轮补齐 | 54 | 54 | 0 | `6ec49cc` |
| 通用规则 + 扩展语料 | 119 | 99 | 20 | `88d1341` |
| 数字上下文 `一` 声调 | 119 | 99 | 20 | `3785c2f` |
| 三字全三声变调规则 | 119 | **103** | **16** | `c414f90` |
| 大规模扩展（含更多真实用例） | **149** | **99** | **50** | 历史 |
| C 方案修补（4 条覆盖 + 句末粒子轻声） | **149** | **103** | **46** | 前一步 |
| C 方案修补 2（3 条儿化覆盖） | **149** | **106** | **43** | 历史 |
| 近期轻量规则补齐 | **149** | **115** | **34** | 当前 |

## 剩余 Gap 分类与根因

剩余 gap 不再只有一个根因。主要分为三类：`Intl.Segmenter` 与 `jieba.posseg` 分词粒度不同、JS 侧无 POS 信息、以及 Python `zh_normalization` 中的确定性文本归一化规则尚未移植。以下按差异类型分组：

### A. 词汇边界过粗 — Intl.Segmenter 把应拆的词合并

| 用例 | jieba 预期拆分 | Intl.Segmenter 实际拆分 |
|------|---------------|----------------------|
| `好吧` | 好 / 吧 | 好吧 |
| `慢慢地` | 慢慢 / 地 | 慢慢地 |
| `听不到` | 听 / 不到 | 听不到 |
| `他的书` | 他 / 的 / 书 | 他的 / 书 |
| `我想去` | 我想 / 去 | 我想去 |
| `我不太` | 我 / 不太 | 我不太 |

### B. 词汇边界过细 — Intl.Segmenter 把应合的词拆散

| 用例 | jieba 预期拆分 | Intl.Segmenter 实际拆分 |
|------|---------------|----------------------|
| `老板很好` | 老板很 / 好 | 老板 / 很好 |
| `一百一十一` | 一百一十 / 一 | 一百 / 一 / 十一 |
| `1980年` → `一九八零年` | 一九八 / 零 / 年 | 一九 / 八 / 零年 |
| `2008年...` → `二零零八年...` | 二零零八 / 年 / 八月 / 八日 | 二 / 零零 / 八年 / 八月 / 八日 |
| `撒欢儿` | 撒欢儿 | 撒 / 欢儿 |

### C. 三声过度合并 — capped merge 避免了部分但仍有残留

| 用例 | 现象 |
|------|------|
| `一点五倍` | 一点 + 五倍 → 三声合并为 一点五 → 点 变声调 2（正确应为单独 一点） |
| `寻老礼儿` | 寻 + 老礼儿 → 合并后声调错 |
| `妥妥儿` | 叠词 + 儿化组合，三声变调 + 轻声均未正确 |

### D. 数字序列分析差异 — 已修正声调，仅剩分词

| 用例 | 已修正 | 剩余差异 |
|------|--------|----------|
| `1980年` | 一 声调 1 ✓ | 分段 `一九八`→应为一词 |
| `价格为12.5元` / `增长3.5%` | — | 数字部分分词差异 |

### E. 文本归一化缺口 — Python `zh_normalization` 尚未移植

| 类别 | Python 规则 | JS 当前风险 |
|------|-------------|-------------|
| 时间 | `RE_TIME` / `RE_TIME_RANGE` | `15:30` 读作 `十五: 三十`，不是 `十五点半` |
| 横杠/斜杠日期 | `RE_DATE2` | `2026-06-19` 等格式不会转为中文日期 |
| 范围/分数/负数 | `RE_RANGE` / `RE_FRAC` / `RE_INTEGER` | 中文上下文里 `10-20`、`3/4`、`-10` 处理不完整 |
| 电话 | `RE_MOBILE_PHONE` / `RE_TELEPHONE` | 目前只有 `13800138000`、`10086` 特例 |
| 单位 | `RE_TEMPERATURE` / `replace_measure()` | `36.5℃`、`3kg`、`10cm` 等未系统覆盖 |

## 后续建议

### P0：补齐 misaki `zh_normalization` 可确定规则

这些规则在 Python `misaki/misaki/zh_normalization/text_normalization.py` 已存在，但 JS 侧 `normalize_chinese_numbers()` 尚未完整移植。优先做，因为它们不依赖 POS，也比继续堆短语覆盖更稳。

- [ ] **时间表达式**：移植 `RE_TIME` / `RE_TIME_RANGE`，例如 `15:30` → `十五点半`，`8:05` → `八点零五分`，`8:30-12:30` → `八点半至十二点半`。
- [ ] **斜杠/横杠日期**：移植 `RE_DATE2`，例如 `2026-06-19` / `2026/06/19` → `二零二六年六月十九日`。
- [ ] **数字范围**：移植 `RE_RANGE`，例如 `10-20` 在中文上下文中应读作 `十到二十`，避免误走英文 `to` 或负号路径。
- [ ] **分数与负数**：移植 `RE_FRAC` / `RE_INTEGER`，例如 `3/4` → `四分之三`，`-10` → `负十`。
- [ ] **电话号码**：移植 `RE_MOBILE_PHONE` / `RE_TELEPHONE`，替代当前 `13800138000`、`10086` 的特例硬编码。
- [ ] **温度和度量衡**：移植 `RE_TEMPERATURE` / `replace_measure()`，覆盖 `36.5℃`、`3kg`、`10cm` 等真实输入。
- [ ] **量词数字**：移植 `RE_POSITIVE_QUANTIFIERS`，让 `4个半小时`、`299元`、`5.2%` 等与 misaki 的数字分词和变调更接近。

验收方式：每条规则新增 `phonemize.test.js` 定向用例，并把对应 `zh-misaki-golden.json` 中可对齐样例从 `gap` 改为 `match`。

### P1：收敛现有 golden gap

- [x] **重新统计 gap 列表**：当前 fixture 实际有 34 个 `gap`，`当前状态` 已更新为 115 match / 34 gap。
- [ ] **短英文/缩写策略**：决定 `AI`、`GDP`、`English`、`Kokoro` 是否继续保留 JS 英文读音，还是严格复刻 Python `unk=❓` 行为。
- [ ] **长句分词边界**：针对 `的/地/得/了`、短助词、常见动宾结构，补有限的 Segmenter 后处理，避免无界扩展短语覆盖。
- [ ] **三声/轻声组合残留**：继续处理 `一举两得`、`学不好`、`聪明`、`喜欢` 等由分词和 POS 缺失引发的变调差异。
- [ ] **数字序列分词**：处理 `2023年`、`239元`、`299元` 等数字归一化后被拆得过细的问题。

### P2：决定分词路线

- [ ] **保守路线**：继续使用 `Intl.Segmenter` + 小规模后处理，目标是覆盖 demo 和常见文本，不追求完全复刻 jieba。
- [ ] **对齐路线**：评估 `jieba-wasm`、`segmentit` 或轻量词典分词器，目标是显著减少由分词粒度导致的 gap。
- [ ] **浏览器成本评估**：记录包体积、初始化耗时、Worker 兼容性和离线可用性，再决定是否引入依赖。

### P3：TTS 与发布质量

- [ ] **端到端中文 TTS 验证**：用 v1.1 zh 模型跑短句、长句、中英混合、数字时间样例，确认音频可懂且无静音。
- [ ] **Demo 体验**：完善 voice/model 选择、错误提示、长文本进度和移动端可用性。
- [ ] **npm 发布准备**：审查 `kokoro.js/voices` 体积、`files` 白名单、README 示例和 v1.1 中文模型说明。

## 验证命令
- 定向 phonemizer 测试：`npm --prefix kokoro.js exec vitest run tests/phonemize.test.js`
- 库全量测试：`npm --prefix kokoro.js test`
- 库构建：`npm --prefix kokoro.js run build`
- Demo 构建：`npm --prefix demo run build`

## 待定事项
- 是否引入浏览器友好的中文分词依赖（如 `jieba-wasm`），替代目前规则驱动的 Intl.Segmenter 后处理
- 是否把 Python `TextNormalizer` 视为必须对齐目标；当前 Python `ZHG2P` 主路径只走 `cn2an.transform()`，并没有调用完整 `zh_normalization`
- 是否在 demo 里暴露运行时 voice/model 选择器
- `fp16` 浏览器静音问题 — 当前不作为默认路径
- 数字归一化是否引入小型 JS 依赖（如 `cn2an` 的 JS 版本）
