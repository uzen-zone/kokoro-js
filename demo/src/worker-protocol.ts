export type WorkerRequest =
  | { type: "generate"; requestId: number; text: string; voice: string; device: string; maxChunkLength: number }
  | { type: "stop"; requestId?: number }
  | { type: "buffer_processed" };

export type Voice = {
  name: string;
  language: string;
  gender: string;
};

export type WorkerResponse =
  | { status: "ready"; voices: Record<string, Voice>; device: string; dtype: string }
  | { status: "error"; requestId?: number; error: string }
  | { status: "chunk"; requestId: number; chunkIndex: number; text: string; samples: ArrayBuffer; sampleRate: number; elapsedMs: number }
  | { status: "complete"; requestId: number; inferenceMs: number };
