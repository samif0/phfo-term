'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AutoTokenizer, env, type PreTrainedTokenizer } from '@xenova/transformers';
import type { PlaygroundControls } from '@/lib/playground-types';

const DEFAULT_TEXT = 'The moonlight spills across the ocean as the city sleeps.';
const MAX_INPUT_TOKENS = 64;

const TOKENIZER_CANDIDATES = [
  'Xenova/TinyLlama-1.1B-Chat-v1.0',
  'Xenova/distilgpt2',
];

interface AttentionRun {
  modelId: string;
  tokens: string[];
  layers: number[][][][]; // [layer][head][query][key]
  hiddenStates: number[][][]; // [layer+1][token][hidden_dim]
}

interface SimulationConfig {
  numLayers: number;
  numHeads: number;
  headDim: number;
  hiddenDim: number;
}

const DEFAULT_SIM_CONFIG: SimulationConfig = {
  numLayers: 6,
  numHeads: 4,
  headDim: 16,
  hiddenDim: 64,
};

function cleanToken(token: string): string {
  return token.replace(/^##/, '').replace(/^▁/, '').replace(/^Ġ/, '');
}

function dot(a: number[], b: number[]): number {
  const size = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < size; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function softmax(values: number[]): number[] {
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - max));
  const denom = exps.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(denom) || denom === 0) {
    return values.map(() => 0);
  }
  return exps.map((value) => value / denom);
}

function tokenEmbedding(tokenId: number, position: number, hiddenDim: number): number[] {
  const out = new Array<number>(hiddenDim);
  const a = tokenId + 1;
  const p = position + 1;

  for (let d = 0; d < hiddenDim; d += 1) {
    const k = d + 1;
    const s1 = Math.sin(a * k * 0.011 + p * 0.17);
    const s2 = Math.cos((a + 7) * (k + 3) * 0.007 + p * 0.13);
    out[d] = 0.6 * s1 + 0.4 * s2;
  }

  return out;
}

function project(
  vector: number[],
  layer: number,
  head: number,
  kind: 'q' | 'k' | 'v',
  outputDim: number
): number[] {
  const out = new Array<number>(outputDim);
  const kindScale = kind === 'q' ? 1 : kind === 'k' ? 1.31 : 1.73;

  for (let od = 0; od < outputDim; od += 1) {
    let acc = 0;
    for (let i = 0; i < vector.length; i += 1) {
      const phase = (layer + 1) * (head + 1) * (od + 1) * kindScale;
      acc += vector[i] * Math.sin((i + 1) * 0.021 * phase);
    }
    out[od] = acc / Math.sqrt(vector.length);
  }

  return out;
}

function combineHeads(contextsForToken: number[][], hiddenDim: number): number[] {
  const out = new Array<number>(hiddenDim).fill(0);

  for (let d = 0; d < hiddenDim; d += 1) {
    let sum = 0;
    for (let h = 0; h < contextsForToken.length; h += 1) {
      const ctx = contextsForToken[h];
      const base = ctx[d % ctx.length];
      const coeff = 0.35 + 0.15 * Math.sin((d + 1) * (h + 1) * 0.09);
      sum += base * coeff;
    }
    out[d] = sum / contextsForToken.length;
  }

  return out;
}

function simulateDecoderBlock(
  tokenIds: number[],
  config: SimulationConfig = DEFAULT_SIM_CONFIG
): Pick<AttentionRun, 'layers' | 'hiddenStates'> {
  const { numLayers, numHeads, headDim, hiddenDim } = config;

  let hidden = tokenIds.map((tokenId, position) => tokenEmbedding(tokenId, position, hiddenDim));
  const hiddenStates: number[][][] = [hidden.map((row) => [...row])];
  const layers: number[][][][] = [];

  for (let layer = 0; layer < numLayers; layer += 1) {
    const layerHeads: number[][][] = [];
    const contextsPerHead: number[][][] = Array.from({ length: numHeads }, () =>
      Array.from({ length: hidden.length }, () => new Array<number>(headDim).fill(0))
    );

    for (let head = 0; head < numHeads; head += 1) {
      const q = hidden.map((vector) => project(vector, layer, head, 'q', headDim));
      const k = hidden.map((vector) => project(vector, layer, head, 'k', headDim));
      const v = hidden.map((vector) => project(vector, layer, head, 'v', headDim));

      const headRows: number[][] = [];
      for (let query = 0; query < hidden.length; query += 1) {
        const scores = new Array<number>(hidden.length).fill(-1e9);

        for (let key = 0; key <= query; key += 1) {
          scores[key] = dot(q[query], k[key]) / Math.sqrt(headDim);
        }

        const weights = softmax(scores);
        headRows.push(weights);

        const context = new Array<number>(headDim).fill(0);
        for (let key = 0; key < hidden.length; key += 1) {
          const weight = weights[key];
          const valueVec = v[key];
          for (let d = 0; d < headDim; d += 1) {
            context[d] += weight * valueVec[d];
          }
        }
        contextsPerHead[head][query] = context;
      }

      layerHeads.push(headRows);
    }

    const nextHidden: number[][] = [];
    for (let token = 0; token < hidden.length; token += 1) {
      const contextsForToken = contextsPerHead.map((headContexts) => headContexts[token]);
      const combined = combineHeads(contextsForToken, hiddenDim);

      const ff = new Array<number>(hiddenDim);
      for (let d = 0; d < hiddenDim; d += 1) {
        ff[d] = Math.tanh(hidden[token][d] * 0.8 + combined[d] * 0.6 + Math.sin((layer + 1) * (d + 1) * 0.03));
      }

      const updated = new Array<number>(hiddenDim);
      for (let d = 0; d < hiddenDim; d += 1) {
        updated[d] = hidden[token][d] + 0.25 * combined[d] + 0.2 * ff[d];
      }

      nextHidden.push(updated);
    }

    hidden = nextHidden;
    hiddenStates.push(hidden.map((row) => [...row]));
    layers.push(layerHeads);
  }

  return { layers, hiddenStates };
}

function l2Norm(values: number[]): number {
  let sumSq = 0;
  for (let i = 0; i < values.length; i += 1) {
    sumSq += values[i] * values[i];
  }
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

function rowFromHiddenState(hiddenState: number[][], tokenIndex: number): number[] {
  if (tokenIndex < 0 || tokenIndex >= hiddenState.length) {
    return [];
  }
  return hiddenState[tokenIndex];
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
  const tokenizerIdRef = useRef<string | null>(null);
  const runningRef = useRef<boolean>(false);
  const envConfiguredRef = useRef<boolean>(false);

  const ensureTokenizer = useCallback(async () => {
    if (!envConfiguredRef.current) {
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      envConfiguredRef.current = true;
    }

    if (tokenizerRef.current && tokenizerIdRef.current) {
      return { tokenizer: tokenizerRef.current, tokenizerId: tokenizerIdRef.current };
    }

    let lastError: unknown = null;
    for (const candidate of TOKENIZER_CANDIDATES) {
      try {
        setStatus(`Loading tokenizer: ${candidate}`);
        const tokenizer = await AutoTokenizer.from_pretrained(candidate);
        tokenizerRef.current = tokenizer;
        tokenizerIdRef.current = candidate;
        setProgress(100);
        setStatus(`Tokenizer ready (${candidate})`);
        return { tokenizer, tokenizerId: candidate };
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to load tokenizer from all configured candidates.');
  }, []);

  const runDecoderBlockInspection = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      setError(null);
      setProgress(0);

      const prompt = text.trim() ? text : DEFAULT_TEXT;
      const { tokenizer, tokenizerId } = await ensureTokenizer();

      setStatus('Tokenizing input...');
      const tokenized = await tokenizer(prompt, {
        truncation: true,
        max_length: MAX_INPUT_TOKENS,
      });

      const tokenIds = Array.from(tokenized.input_ids.data as Iterable<number>);
      if (tokenIds.length < 2) {
        throw new Error('Please provide a longer input so at least two tokens are available.');
      }

      const tokens = 'convert_ids_to_tokens' in tokenizer
        ? (tokenizer as { convert_ids_to_tokens: (ids: number[]) => string[] }).convert_ids_to_tokens(tokenIds)
        : tokenIds.map(String);

      setStatus('Simulating Llama-style decoder block computations...');
      setProgress(40);

      const simulation = simulateDecoderBlock(tokenIds);
      const lastLayer = simulation.layers.length - 1;

      setRun({
        modelId: `${tokenizerId} (tokenizer)`,
        tokens,
        layers: simulation.layers,
        hiddenStates: simulation.hiddenStates,
      });
      setSelectedLayer(lastLayer);
      setSelectedHead(0);
      setSelectedToken(tokens.length - 1);
      setProgress(100);
      setStatus(`Ready: ${simulation.layers.length} simulated decoder layers, ${simulation.layers[0].length} heads.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown decoder error.';
      setError(message);
      setStatus('Failed to run decoder block analysis.');
    } finally {
      runningRef.current = false;
      onStop();
    }
  }, [ensureTokenizer, onStop, text]);

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

    const before = rowFromHiddenState(run.hiddenStates[selectedLayer], selectedToken);
    const after = rowFromHiddenState(run.hiddenStates[selectedLayer + 1], selectedToken);
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
          This playground uses a <strong>Llama-family tokenizer</strong> and runs a deterministic
          <strong> decoder-style block simulation</strong> in-browser.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Pick a layer, head, and query token to inspect masked attention weights and residual-stream updates.
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
