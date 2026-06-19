import { env as hf, StyleTextToSpeech2Model, AutoTokenizer, Tensor, RawAudio } from "@huggingface/transformers";
import { phonemize } from "./phonemize.js";
import { TextSplitterStream } from "./splitter.js";
import { getVoiceData, VOICES, setVoicePath } from "./voices.js";

const STYLE_DIM = 256;
const SAMPLE_RATE = 24000;

/**
 * @typedef {Object} GenerateOptions
 * @property {keyof typeof VOICES} [voice="zf_001"] The voice
 * @property {number} [speed=1] The speaking speed
 */

/**
 * @typedef {Object} StreamProperties
 * @property {RegExp} [split_pattern] The pattern to split the input text. If unset, the default sentence splitter will be used.
 * @property {number} [maxChunkLength=200] Maximum character length per chunk. Longer chunks are split at punctuation boundaries.
 * @typedef {GenerateOptions & StreamProperties} StreamGenerateOptions
 */

export class KokoroTTS {
  /**
   * Create a new KokoroTTS instance.
   * @param {import('@huggingface/transformers').StyleTextToSpeech2Model} model The model
   * @param {import('@huggingface/transformers').PreTrainedTokenizer} tokenizer The tokenizer
   */
  constructor(model, tokenizer) {
    this.model = model;
    this.tokenizer = tokenizer;
  }

  /**
   * Load a KokoroTTS model from the Hugging Face Hub.
   * @param {string} model_id The model id
   * @param {Object} options Additional options
   * @param {"fp32"|"fp16"|"q8"|"q4"|"q4f16"} [options.dtype="fp32"] The data type to use.
   * @param {"wasm"|"webgpu"|"cpu"|null} [options.device=null] The device to run the model on.
   * @param {string|null} [options.model_file_name=null] Override the ONNX model file name, excluding the .onnx suffix.
   * @param {string} [options.voicePath="/kokoro/voices"] Base path/directory for voice data files.
   * @param {import("@huggingface/transformers").ProgressCallback} [options.progress_callback=null] A callback function that is called with progress information.
   * @returns {Promise<KokoroTTS>} The loaded model
   */
  static async from_pretrained(model_id, { dtype = "fp32", device = null, model_file_name = null, voicePath = "/kokoro/voices", progress_callback = null } = {}) {
    setVoicePath(voicePath);

    const model = StyleTextToSpeech2Model.from_pretrained(model_id, { progress_callback, dtype, device, model_file_name });
    const tokenizer = AutoTokenizer.from_pretrained(model_id, { progress_callback });

    const info = await Promise.all([model, tokenizer]);
    return new KokoroTTS(...info);
  }

  get voices() {
    return VOICES;
  }

  list_voices() {
    console.table(VOICES);
  }

  _validate_voice(voice) {
    if (!VOICES.hasOwnProperty(voice)) {
      console.error(`Voice "${voice}" not found. Available voices:`);
      console.table(VOICES);
      throw new Error(`Voice "${voice}" not found. Should be one of: ${Object.keys(VOICES).join(", ")}.`);
    }
    const language = /** @type {"a"|"b"|"z"} */ (voice.at(0));
    return language;
  }

  /**
   * Generate audio from text.
   *
   * @param {string} text The input text
   * @param {GenerateOptions} options Additional options
   * @returns {Promise<RawAudio>} The generated audio
   */
  async generate(text, { voice = "zf_001", speed = 1 } = {}) {
    const language = this._validate_voice(voice);

    const phonemes = await phonemize(text, language);
    const { input_ids } = this.tokenizer(phonemes, {
      truncation: true,
    });

    return this.generate_from_ids(input_ids, { voice, speed });
  }

  /**
   * Generate audio from input ids.
   * @param {Tensor} input_ids The input ids
   * @param {GenerateOptions} options Additional options
   * @returns {Promise<RawAudio>} The generated audio
   */
  async generate_from_ids(input_ids, { voice = "zf_001", speed = 1 } = {}) {
    // Select voice style based on number of input tokens
    const num_tokens = Math.min(Math.max(input_ids.dims.at(-1) - 2, 0), 509);

    // Load voice style
    const data = await getVoiceData(voice);
    const offset = num_tokens * STYLE_DIM;
    const voiceData = data.slice(offset, offset + STYLE_DIM);

    // Prepare model inputs
    const inputs = {
      input_ids,
      style: new Tensor("float32", voiceData, [1, STYLE_DIM]),
      speed: new Tensor("float32", [speed], [1]),
    };

    // Generate audio
    const { waveform } = await this.model(inputs);
    return new RawAudio(waveform.data, SAMPLE_RATE);
  }

  /**
   * Split a long text into smaller chunks at punctuation boundaries.
   * Falls back to hard split at maxLength if no suitable boundary is found.
   * @param {string} text The text to split
   * @param {number} maxLength Maximum length of each chunk
   * @returns {string[]} Array of text chunks
   * @private
   */
  _splitLongText(text, maxLength) {
    const chunks = [];
    let remaining = text.trim();
    while (remaining.length > maxLength) {
      const window = remaining.slice(0, maxLength + 1);
      let splitAt = Math.max(
        window.lastIndexOf("，"),
        window.lastIndexOf("、"),
        window.lastIndexOf("；"),
        window.lastIndexOf(";"),
        window.lastIndexOf(","),
      );
      if (splitAt < maxLength * 0.4) {
        splitAt = maxLength;
      }
      chunks.push(remaining.slice(0, splitAt + 1).trim());
      remaining = remaining.slice(splitAt + 1).trim();
    }
    if (remaining) {
      chunks.push(remaining);
    }
    return chunks;
  }

  /**
   * Generate audio from text in a streaming fashion.
   * @param {string|TextSplitterStream} text The input text
   * @param {StreamGenerateOptions} options Additional options
   * @returns {AsyncGenerator<{text: string, phonemes: string, audio: RawAudio}, void, void>}
   */
  async *stream(text, { voice = "zf_001", speed = 1, split_pattern = null, maxChunkLength = 200 } = {}) {
    const language = this._validate_voice(voice);

    /** @type {TextSplitterStream} */
    let splitter;
    if (text instanceof TextSplitterStream) {
      splitter = text;
    } else if (typeof text === "string") {
      splitter = new TextSplitterStream();
      const chunks = split_pattern
        ? text
          .split(split_pattern)
          .map((chunk) => chunk.trim())
          .filter((chunk) => chunk.length > 0)
        : [text];
      splitter.push(...chunks);
      splitter.close();
    } else {
      throw new Error("Invalid input type. Expected string or TextSplitterStream.");
    }
    for await (const sentence of splitter) {
      const subChunks = sentence.length > maxChunkLength
        ? this._splitLongText(sentence, maxChunkLength)
        : [sentence];
      for (const chunk of subChunks) {
        const phonemes = await phonemize(chunk, language);
        const { input_ids } = this.tokenizer(phonemes, {
          truncation: true,
        });
        const audio = await this.generate_from_ids(input_ids, { voice, speed });
        yield { text: chunk, phonemes, audio };
      }
    }
  }
}

export const env = {
  set cacheDir(value) {
    hf.cacheDir = value
  },
  get cacheDir() {
    return hf.cacheDir
  },
  set allowLocalModels(value) {
    hf.allowLocalModels = value;
  },
  get allowLocalModels() {
    return hf.allowLocalModels;
  },
  set wasmPaths(value) {
    hf.backends.onnx.wasm.wasmPaths = value;
  },
  get wasmPaths() {
    return hf.backends.onnx.wasm.wasmPaths;
  },
};

export { TextSplitterStream };
