'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AutoModel, AutoTokenizer, type Tensor, type PreTrainedModel, type PreTrainedTokenizer } from '@xenova/transformers';
import type { PlaygroundControls } from '@/lib/playground-types';

const DEFAULT_TEXT = 'Transformers rely on attention to decide which words to emphasize.';

interface AttentionMap {
  layers: number[][][][]; // [layer][head][query][key]
  tokens: string[];
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

function cleanToken(token: string): string {
  return token.replace(/^##/, '').replace(/^▁/, '').replace(/^Ġ/, '');
}

export default function AttentionVisualizer({ isRunning, isPaused, onStop }: PlaygroundControls) {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [status, setStatus] = useState<string>('Idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [attention, setAttention] = useState<AttentionMap | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const [selectedHead, setSelectedHead] = useState<number>(0);

  const extractAttentions = useCallback((output: unknown): Tensor[] | undefined => {
    const maybeAttentions = output as {
      attentions?: Tensor[];
      encoder_attentions?: Tensor[];
      cross_attentions?: Tensor[];
    };

    return (
      maybeAttentions.attentions ?? maybeAttentions.encoder_attentions ?? maybeAttentions.cross_attentions
    );
  }, []);

  const tokenizerRef = useRef<PreTrainedTokenizer | null>(null);
  const modelRef = useRef<PreTrainedModel | null>(null);
  const runningRef = useRef<boolean>(false);

  const ensureModel = useCallback(async () => {
    if (tokenizerRef.current && modelRef.current) {
      return { tokenizer: tokenizerRef.current, model: modelRef.current };
    }

    setStatus('Loading model...');
    setError(null);

    const tokenizerPromise = AutoTokenizer.from_pretrained('Xenova/distilbert-base-uncased');
    const modelPromise = AutoModel.from_pretrained('Xenova/distilbert-base-uncased', {
      quantized: true,
      config: {
        architectures: ['DistilBertModel'],
        model_type: 'distilbert',
        output_attentions: true,
      },
      progress_callback: (info: unknown) => {
        const payload = info as { status?: string; progress?: number };
        if (typeof payload.progress === 'number') {
          setProgress(Math.round(payload.progress * 100));
        }
        if (payload.status) {
          setStatus(payload.status);
        }
      },
    });

    const [tokenizer, model] = await Promise.all([tokenizerPromise, modelPromise]);
    tokenizerRef.current = tokenizer;
    modelRef.current = model;
    setStatus('Model ready');
    setProgress(100);
    return { tokenizer, model };
  }, []);

  const captureAttention = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      const { tokenizer, model } = await ensureModel();
      const prompt = text.trim() ? text : DEFAULT_TEXT;

      setStatus('Tokenizing input...');
      const tokenized = await tokenizer(prompt, { truncation: true, max_length: 80 });

      const tokenIds = Array.from(tokenized.input_ids.data as Iterable<number>);
      const tokens = 'convert_ids_to_tokens' in tokenizer
        ? (tokenizer as { convert_ids_to_tokens: (ids: number[]) => string[] }).convert_ids_to_tokens(tokenIds)
        : tokenIds.map(String);

      setStatus('Running transformer...');
      const output = await model(tokenized, { output_attentions: true });
      const attentions = (output as { attentions?: Tensor[] }).attentions;

      if (!attentions || attentions.length === 0) {
        throw new Error('No attention scores were returned by the model.');
      }

      const layers = convertAttentionTensors(attentions);
      setAttention({ tokens, layers });
      setSelectedLayer(layers.length - 1);
      setSelectedHead(0);
      setStatus(`Captured ${layers.length} layers with ${layers[0].length} heads.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error while running the model.';
      setError(message);
      setStatus('Failed to collect attention.');
    } finally {
      runningRef.current = false;
      onStop();
    }
  }, [ensureModel, extractAttentions, onStop, text]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      void captureAttention();
    }
  }, [captureAttention, isPaused, isRunning]);

  const activeHead = useMemo(() => {
    if (!attention) return null;
    return attention.layers[selectedLayer]?.[selectedHead] ?? null;
  }, [attention, selectedHead, selectedLayer]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
        <p>
          This playground runs a vanilla DistilBERT transformer in the browser and displays the self-attention scores
          for your text. Enter any sentence and press Run above to see where the model focuses.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tokens are shown as produced by the tokenizer; subword markers like <code>##</code> and <code>▁</code> are removed
          for readability.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="attention-input">Input text</label>
        <textarea
          id="attention-input"
          className="w-full h-28 rounded border border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 p-3 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a sentence or short paragraph to inspect."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
          {status} {progress > 0 && progress < 100 ? `(${progress}%)` : ''}
        </span>
        {error && <span className="text-red-500">{error}</span>}
      </div>

      {attention && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 items-center text-sm">
            <label className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-500">Layer</span>
              <select
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1"
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(Number(e.target.value))}
              >
                {attention.layers.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Layer {idx}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-500">Head</span>
              <select
                className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1"
                value={selectedHead}
                onChange={(e) => setSelectedHead(Number(e.target.value))}
              >
                {attention.layers[selectedLayer].map((_, idx) => (
                  <option key={idx} value={idx}>
                    Head {idx}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeHead ? (
            <div className="overflow-auto border border-gray-200 dark:border-gray-800 rounded-lg">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-gray-100 dark:bg-gray-900 text-left px-2 py-1">Token →</th>
                    {attention.tokens.map((token, idx) => (
                      <th key={idx} className="px-2 py-1 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {cleanToken(token)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeHead.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <th className="sticky left-0 bg-gray-100 dark:bg-gray-900 text-left px-2 py-1 font-medium whitespace-nowrap">
                        {cleanToken(attention.tokens[rowIdx])}
                      </th>
                      {row.map((value, colIdx) => {
                        const intensity = Math.min(Math.max(value, 0), 1);
                        const background = `rgba(16, 185, 129, ${intensity})`;
                        const textColor = intensity > 0.6 ? 'text-white' : 'text-gray-900 dark:text-gray-100';
                        return (
                          <td
                            key={colIdx}
                            className={`text-center px-2 py-1 ${textColor}`}
                            style={{ backgroundColor: background }}
                            title={`Attention from "${cleanToken(attention.tokens[rowIdx])}" to "${cleanToken(attention.tokens[colIdx])}": ${(value * 100).toFixed(2)}%`}
                          >
                            {(value * 100).toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No attention head selected.</p>
          )}
        </div>
      )}
    </div>
  );
}
