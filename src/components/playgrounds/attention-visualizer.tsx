'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AutoModel,
  AutoTokenizer,
  env,
  type Tensor,
  type PreTrainedModel,
  type PreTrainedTokenizer,
} from '@xenova/transformers';
import type { PlaygroundControls } from '@/lib/playground-types';

const DEFAULT_TEXT = 'The moonlight spills across the ocean as the city sleeps.';
const MAX_INPUT_TOKENS = 64;

const LLAMA_CANDIDATES = [
  'Xenova/TinyLlama-1.1B-Chat-v1.0',
  'Xenova/distilgpt2',
];

interface AttentionRun {
  modelId: string;
  tokens: string[];
  layers: number[][][][]; // [layer][head][query][key]
  hiddenStates: Tensor[]; // [layer+1] [batch, seq, hidden]
}

function cleanToken(token: string): string {
  return token.replace(/^##/, '').replace(/^▁/, '').replace(/^Ġ/, '');
}

function convertAttentionTensors(attentions: Tensor[]): number[][][][] {
  return attentions.map((tensor) => {
    const [batch, heads, rows, cols] = tensor.dims;
    if (batch !== 1) {
      throw new Error('Only single-batch attention is supported.');
    }

    const values = Array.from(tensor.data as Iterable<number>);
    const headsData: number[][][] = [];
    let offset = 0;

    for (let h = 0; h < heads; h += 1) {
      const headRows: number[][] = [];
      for (let r = 0; r < rows; r += 1) {
        headRows.push(values.slice(offset, offset + cols));
        offset += cols;
      }
      headsData.push(headRows);
    }

    return headsData;
  });
}

function extractDecoderAttentions(output: unknown): Tensor[] | undefined {
  const maybeOutput = output as {
    attentions?: Tensor[];
    decoder_attentions?: Tensor[];
  };

  return maybeOutput.attentions ?? maybeOutput.decoder_attentions;
}

function extractHiddenStates(output: unknown): Tensor[] | undefined {
  const maybeOutput = output as {
    hidden_states?: Tensor[];
    decoder_hidden_states?: Tensor[];
  };

  return maybeOutput.hidden_states ?? maybeOutput.decoder_hidden_states;
}

function vectorFromHiddenState(tensor: Tensor, tokenIndex: number): number[] {
  const [batch, seq, hidden] = tensor.dims;
  if (batch !== 1) {
    throw new Error('Only single-batch hidden states are supported.');
  }

  if (tokenIndex < 0 || tokenIndex >= seq) {
    return [];
  }

  const data = Array.from(tensor.data as Iterable<number>);
  const offset = tokenIndex * hidden;
  return data.slice(offset, offset + hidden);
}

function l2Norm(values: number[]): number {
  const sumSq = values.reduce((sum, value) => sum + value * value, 0);
  return Math.sqrt(sumSq);
}

function subVectors(a: number[], b: number[]): number[] {
  const size = Math.min(a.length, b.length);
  const out = new Array<number>(size);
  for (let i = 0; i < size; i += 1) {
    out[i] = a[i] - b[i];
  }
  return out;
}

function entropy(probabilities: number[]): number {
  return -probabilities.reduce((acc, p) => {
    if (p <= 0) return acc;
    return acc + p * Math.log2(p);
  }, 0);
}

export default function AttentionVisualizer({ isRunning, isPaused, onStop }: PlaygroundControls) {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [status, setStatus] = useState<string>('Idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [run, setRun] = useState<AttentionRun | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const [selectedHead, setSelectedHead] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<number>(0);

  const tokenizerRef = useRef<PreTrainedTokenizer | null>(null);
  const modelRef = useRef<PreTrainedModel | null>(null);
  const modelIdRef = useRef<string | null>(null);
  const runningRef = useRef<boolean>(false);
  const envConfiguredRef = useRef<boolean>(false);

  const ensureModel = useCallback(async () => {
    if (!envConfiguredRef.current) {
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      envConfiguredRef.current = true;
    }

    if (tokenizerRef.current && modelRef.current && modelIdRef.current) {
      return {
        tokenizer: tokenizerRef.current,
        model: modelRef.current,
        modelId: modelIdRef.current,
      };
    }

    setError(null);

    let lastError: unknown = null;
    for (const candidate of LLAMA_CANDIDATES) {
      try {
        setStatus(`Loading tokenizer: ${candidate}`);
        const tokenizer = await AutoTokenizer.from_pretrained(candidate);

        setStatus(`Loading model: ${candidate}`);
        const model = await AutoModel.from_pretrained(candidate, {
          quantized: true,
          progress_callback: (info: unknown) => {
            const payload = info as { status?: string; progress?: number };
            if (typeof payload.progress === 'number') {
              setProgress(Math.round(payload.progress * 100));
            }
            if (payload.status) {
              setStatus(`${candidate}: ${payload.status}`);
            }
          },
        });

        tokenizerRef.current = tokenizer;
        modelRef.current = model;
        modelIdRef.current = candidate;
        setStatus(`Model ready (${candidate})`);
        setProgress(100);

        return { tokenizer, model, modelId: candidate };
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError instanceof Error) {
      if (lastError.message.includes('/models/')) {
        throw new Error('Model loading failed: local /models path was requested by the runtime. Check browser cache and refresh.');
      }
      throw lastError;
    }
    throw new Error('Failed to load a decoder model from all configured candidates.');
  }, []);

  const runDecoderBlockInspection = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      setError(null);
      const { tokenizer, model, modelId } = await ensureModel();
      const prompt = text.trim() ? text : DEFAULT_TEXT;

      setStatus('Tokenizing input...');
      const tokenized = await tokenizer(prompt, {
        truncation: true,
        max_length: MAX_INPUT_TOKENS,
      });

      const tokenIds = Array.from(tokenized.input_ids.data as Iterable<number>);
      const tokens = 'convert_ids_to_tokens' in tokenizer
        ? (tokenizer as { convert_ids_to_tokens: (ids: number[]) => string[] }).convert_ids_to_tokens(tokenIds)
        : tokenIds.map(String);

      setStatus('Running decoder...');
      const output = await model(tokenized, {
        output_attentions: true,
        output_hidden_states: true,
      });

      const attentionTensors = extractDecoderAttentions(output);
      if (!attentionTensors || attentionTensors.length === 0) {
        throw new Error('No decoder attentions were returned by the model.');
      }

      const hiddenStates = extractHiddenStates(output);
      if (!hiddenStates || hiddenStates.length < 2) {
        throw new Error('No decoder hidden states were returned by the model.');
      }

      const layers = convertAttentionTensors(attentionTensors);
      const lastLayer = layers.length - 1;

      setRun({
        modelId,
        tokens,
        layers,
        hiddenStates,
      });
      setSelectedLayer(lastLayer);
      setSelectedHead(0);
      setSelectedToken(tokens.length - 1);
      setStatus(`Ready: ${layers.length} decoder layers, ${layers[0].length} heads.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown decoder error.';
      setError(message);
      setStatus('Failed to run decoder block analysis.');
    } finally {
      runningRef.current = false;
      onStop();
    }
  }, [ensureModel, onStop, text]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      void runDecoderBlockInspection();
    }
  }, [isPaused, isRunning, runDecoderBlockInspection]);

  const activeRow = useMemo(() => {
    if (!run) return null;
    const row = run.layers[selectedLayer]?.[selectedHead]?.[selectedToken];
    return row ?? null;
  }, [run, selectedHead, selectedLayer, selectedToken]);

  const topAttention = useMemo(() => {
    if (!run || !activeRow) return [] as Array<{ index: number; weight: number }>;

    return activeRow
      .map((weight, index) => ({ index, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);
  }, [activeRow, run]);

  const blockMetrics = useMemo(() => {
    if (!run || !activeRow) return null;

    const before = vectorFromHiddenState(run.hiddenStates[selectedLayer], selectedToken);
    const after = vectorFromHiddenState(run.hiddenStates[selectedLayer + 1], selectedToken);
    if (before.length === 0 || after.length === 0) {
      return null;
    }

    const delta = subVectors(after, before);
    const totalProb = activeRow.reduce((sum, value) => sum + value, 0);
    const expectedSourceIndex = activeRow.reduce((sum, value, idx) => sum + value * idx, 0);

    return {
      totalProb,
      entropyBits: entropy(activeRow),
      expectedSourceIndex,
      beforeNorm: l2Norm(before),
      afterNorm: l2Norm(after),
      deltaNorm: l2Norm(delta),
    };
  }, [activeRow, run, selectedLayer, selectedToken]);

  return (
    <div className="space-y-4 overflow-auto h-full pr-1">
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
        <p>
          This playground runs a <strong>Llama-style decoder model</strong> and inspects one decoder block step-by-step
          for your prompt.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Pick a layer, head, and query token to inspect attention weights and the residual-stream change across that block.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="attention-input">Input text</label>
        <textarea
          id="attention-input"
          className="w-full h-28 rounded border border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 p-3 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type text to inspect a decoder block."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
          {status} {progress > 0 && progress < 100 ? `(${progress}%)` : ''}
        </span>
        {run && (
          <span className="px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200">
            {run.modelId}
          </span>
        )}
        {error && <span className="text-red-500">{error}</span>}
      </div>

      {run && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-gray-500">Decoder Layer</span>
              <select
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(Number(e.target.value))}
              >
                {run.layers.map((_, idx) => (
                  <option key={idx} value={idx}>Layer {idx}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-gray-500">Attention Head</span>
              <select
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                value={selectedHead}
                onChange={(e) => setSelectedHead(Number(e.target.value))}
              >
                {run.layers[selectedLayer].map((_, idx) => (
                  <option key={idx} value={idx}>Head {idx}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wide text-gray-500">Query Token</span>
              <select
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2"
                value={selectedToken}
                onChange={(e) => setSelectedToken(Number(e.target.value))}
              >
                {run.tokens.map((token, idx) => (
                  <option key={`${token}-${idx}`} value={idx}>
                    {idx}: {cleanToken(token) || token}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeRow && blockMetrics ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
                <h3 className="font-semibold text-sm">Decoder Block Computation (Selected Token)</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  For token <code>{cleanToken(run.tokens[selectedToken]) || run.tokens[selectedToken]}</code> in layer <code>{selectedLayer}</code>,
                  head <code>{selectedHead}</code>:
                </p>
                <p className="text-xs">
                  <code>scores = (QK^T / sqrt(d_k)) + causal_mask</code>
                </p>
                <p className="text-xs">
                  <code>attn = softmax(scores)</code> (row sum = {blockMetrics.totalProb.toFixed(4)})
                </p>
                <p className="text-xs">
                  <code>context = attn · V</code>, then residual stream updates from ||h||={blockMetrics.beforeNorm.toFixed(3)} to ||h&apos;||={blockMetrics.afterNorm.toFixed(3)} (||Δ||={blockMetrics.deltaNorm.toFixed(3)}).
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Attention entropy: {blockMetrics.entropyBits.toFixed(3)} bits. Expected source token index: {blockMetrics.expectedSourceIndex.toFixed(2)}.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <h4 className="font-semibold text-sm mb-3">Top Attention Contributions</h4>
                <div className="space-y-2">
                  {topAttention.map(({ index, weight }) => {
                    const pct = Math.max(0, Math.min(100, weight * 100));
                    return (
                      <div key={`attn-${index}`} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>
                            {index}: {cleanToken(run.tokens[index]) || run.tokens[index]}
                          </span>
                          <span>{pct.toFixed(2)}%</span>
                        </div>
                        <div className="h-2 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-auto">
                <table className="min-w-full text-[11px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-gray-100 dark:bg-gray-900 text-left px-2 py-1">Source token</th>
                      <th className="px-2 py-1 text-right">Weight</th>
                      <th className="px-2 py-1 text-right">Logit proxy ln(p)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRow.map((value, idx) => (
                      <tr key={`row-${idx}`} className={idx === selectedToken ? 'bg-amber-50/60 dark:bg-amber-900/20' : ''}>
                        <td className="sticky left-0 bg-inherit px-2 py-1 whitespace-nowrap">
                          {idx}: {cleanToken(run.tokens[idx]) || run.tokens[idx]}
                        </td>
                        <td className="px-2 py-1 text-right">{(value * 100).toFixed(4)}%</td>
                        <td className="px-2 py-1 text-right">{value > 0 ? Math.log(value).toFixed(5) : '-∞'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No decoder block data available for the selected layer/head/token.</p>
          )}
        </div>
      )}
    </div>
  );
}
