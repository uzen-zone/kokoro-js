# ONNX Node Generation Results

Test command: each model was loaded with `KokoroTTS.from_pretrained("./demo/public/kokoro", { dtype: "fp32", device: "cpu", model_file_name })` and generated `测试一下。` with voice `zm_009`.

| Model file | Result | WAV output | Notes |
| --- | --- | --- | --- |
| `model.onnx` | OK | `model.wav` | `46800` samples, peak `0.43832284212112427`, RMS `0.051106199283119005` |
| `model_fp16.onnx` | OK | `model_fp16.wav` | `46800` samples, peak `0.346435546875`, RMS `0.049531409506874825` |
| `model_q4.onnx` | OK | `model_q4.wav` | `47400` samples, peak `0.6525919437408447`, RMS `0.085280516752246` |
| `model_q4f16.onnx` | OK | `model_q4f16.wav` | `45000` samples, peak `0.3173828125`, RMS `0.04992969742234501` |
| `model_q8f16.onnx` | FAIL | none | Node process crashed with exit code `-1073741819` during load |
| `model_quantized.onnx` | FAIL | none | Same bytes as `model_q8f16.onnx`; Node process crashed with exit code `-1073741819` during load |
| `model_uint8.onnx` | OK | `model_uint8.wav` | `39600` samples, peak `0.6007677316665649`, RMS `0.07687514090115774` |
| `model_uint8f16.onnx` | OK | `model_uint8f16.wav` | `39000` samples, peak `0.62353515625`, RMS `0.07177913216242998` |
