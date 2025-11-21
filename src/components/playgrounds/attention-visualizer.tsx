'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AutoModel, AutoTokenizer, Tensor, env, type PreTrainedModel, type PreTrainedTokenizer } from '@xenova/transformers';
import type { PlaygroundControls } from '@/lib/playground-types';

const DEFAULT_TEXT = 'Transformers use self-attention to decide which words to focus on.';

interface AttentionMap {
  layers: number[][][][]; // [layer][head][query][key]
  tokens: string[];
}

function tensorToHeads(tensor: Tensor): number[][][] {
  const [batch, heads, seqQ, seqK] = tensor.dims;
  if (batch !== 1) {
    throw new Error('Only single-batch attention maps are supported in this playground.');
  }

  const result: number[][][] = [];
  const data = Array.from(tensor.data as Float32Array | number[]);
  let offset = 0;

  for (let h = 0; h < heads; h += 1) {
    const headMatrix: number[][] = [];
    for (let i = 0; i < seqQ; i += 1) {
      headMatrix.push(data.slice(offset, offset + seqK));
      offset += seqK;
    }
    result.push(headMatrix);
  }

  return result;
}

function formatToken(token: string): string {
  const specialTokens = new Set(['[CLS]', '[SEP]', '<s>', '</s>']);
  if (specialTokens.has(token)) {
    return token;
  }

  // Clean up common BERT/RoBERTa subword markers.
  return token.replace(/^##/, '').replace(/^Ġ/, '').replace(/^▁/, '');
}

export default function AttentionVisualizer({ isRunning, isPaused, onStop }: PlaygroundControls) {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [status, setStatus] = useState<string>('Model not loaded');
  const [error, setError] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [attention, setAttention] = useState<AttentionMap | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const [selectedHead, setSelectedHead] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<number>(0);
  const [scoreMode, setScoreMode] = useState<'head' | 'layer-average'>('head');

  const tokenizerRef = useRef<PreTrainedTokenizer | null>(null);
  const modelRef = useRef<PreTrainedModel | null>(null);
  const isAnalyzing = useRef<boolean>(false);

  useEffect(() => {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
  }, []);

  useEffect(() => {
    if (!attention) return;
    if (selectedLayer >= attention.layers.length) {
      setSelectedLayer(Math.max(attention.layers.length - 1, 0));
      setSelectedHead(0);
      return;
    }

    const layer = attention.layers[selectedLayer];
    if (selectedHead >= layer.length) {
      setSelectedHead(0);
    }

    if (selectedToken >= attention.tokens.length) {
      setSelectedToken(0);
    }
  }, [attention, selectedHead, selectedLayer, selectedToken]);

  const ensureModel = useCallback(async () => {
    if (tokenizerRef.current && modelRef.current) {
      return { tokenizer: tokenizerRef.current, model: modelRef.current };
    }

    setLoadingModel(true);
    setStatus('Downloading tokenizer and model...');
    setError(null);

    const tokenizerPromise = AutoTokenizer.from_pretrained('Xenova/roberta-base');
    const modelPromise = AutoModel.from_pretrained('Xenova/roberta-base', {
      quantized: true,
      progress_callback: (info: unknown) => {
        const progressInfo = info as { status?: string; progress?: number };
        if (typeof progressInfo.progress === 'number') {
          setProgress(Math.round(progressInfo.progress * 100));
        }
        if (progressInfo.status) {
          setStatus(progressInfo.status);
        }
      },
      config: {
        // Ensure the model generates attention tensors when we ask for them during inference.
        output_attentions: true,
      },
    });

    const [tokenizer, model] = await Promise.all([tokenizerPromise, modelPromise]);
    // Some models may ignore the config flag above when quantized; force it on for safety.
    if (model.config) {
      model.config.output_attentions = true;
    }
    tokenizerRef.current = tokenizer;
    modelRef.current = model;

    setStatus('Model ready');
    setLoadingModel(false);
    setProgress(100);

    return { tokenizer, model };
  }, []);

  const runAttentionAnalysis = useCallback(async () => {
    if (isAnalyzing.current) return;

    isAnalyzing.current = true;
    setError(null);
    setStatus('Preparing input...');

    try {
      const { tokenizer, model } = await ensureModel();
      const prompt = text.trim() ? text : DEFAULT_TEXT;
      const tokenized = await tokenizer(prompt, { truncation: true, max_length: 64 });

      const tokenIds = Array.from(tokenized.input_ids.data as Iterable<number>);
      const readableTokens =
        'convert_ids_to_tokens' in tokenizer
          ? (tokenizer as { convert_ids_to_tokens: (ids: number[]) => string[] })
              .convert_ids_to_tokens(tokenIds)
              .map(formatToken)
          : tokenIds.map((id) => String(id));

      setStatus('Running transformer...');
      const output = await model(tokenized, { output_attentions: true });

      const attentions =
        (output as { attentions?: Tensor[]; encoder_attentions?: Tensor[] }).attentions ??
        (output as { attentions?: Tensor[]; encoder_attentions?: Tensor[] }).encoder_attentions;
      if (!attentions || attentions.length === 0) {
        throw new Error('The model did not return attention maps.');
      }

      const layerMaps = attentions.map(tensorToHeads);
      setAttention({ tokens: readableTokens, layers: layerMaps });
      setSelectedLayer(layerMaps.length - 1);
      setSelectedHead(0);
      setSelectedToken(0);
      setStatus(`Captured ${layerMaps.length} layers with ${layerMaps[0].length} heads each.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error while running the model.';
      setError(message);
      setStatus('Encountered an error');
    } finally {
      isAnalyzing.current = false;
      onStop();
    }
  }, [ensureModel, onStop, text]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      void runAttentionAnalysis();
    }
  }, [isPaused, isRunning, runAttentionAnalysis]);

  const activeHead = useMemo(() => {
    if (!attention) return null;
    const layer = attention.layers[selectedLayer];
    if (!layer) return null;
    return layer[selectedHead] ?? null;
  }, [attention, selectedHead, selectedLayer]);

  const topFocus = useMemo(() => {
    if (!attention || !activeHead) return [] as { token: string; weight: number }[];
    return activeHead.map((row, idx) => ({
      token: attention.tokens[idx],
      weight: row.reduce((sum, value) => sum + value, 0) / row.length,
    }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [activeHead, attention]);

  const calculatorScores = useMemo(() => {
    if (!attention) return [] as { token: string; raw: number; normalized: number }[];

    const layer = attention.layers[selectedLayer];
    if (!layer) return [];

    const collectFromHead = (headIdx: number) => {
      const head = layer[headIdx];
      if (!head) return [] as number[];
      return head[selectedToken] ?? [];
    };

    const tokenCount = attention.tokens.length;

    if (scoreMode === 'head') {
      const row = collectFromHead(selectedHead);
      const total = row.reduce((sum, value) => sum + value, 0) || 1;
      return row.map((raw, idx) => ({
        token: attention.tokens[idx],
        raw,
        normalized: raw / total,
      }));
    }

    // layer-average: mean over all heads in the selected layer
    const sums = Array.from({ length: tokenCount }, () => 0);
    layer.forEach((head) => {
      const row = head[selectedToken];
      if (!row) return;
      row.forEach((value, idx) => {
        sums[idx] += value;
      });
    });

    const headCount = layer.length || 1;
    const averaged = sums.map((value) => value / headCount);
    const total = averaged.reduce((sum, value) => sum + value, 0) || 1;

    return averaged.map((raw, idx) => ({
      token: attention.tokens[idx],
      raw,
      normalized: raw / total,
    }));
  }, [attention, scoreMode, selectedHead, selectedLayer, selectedToken]);

  const sortedScores = useMemo(
    () => calculatorScores.map((entry, idx) => ({ ...entry, idx })).sort((a, b) => b.raw - a.raw),
    [calculatorScores],
  );

  return (
    <div className="space-y-4 h-full">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Enter text and press the Run button above. The playground loads a modern RoBERTa-base transformer from Hugging Face and displays the self-attention weights for your input.
      </p>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-4 text-sm">
        <div className="font-semibold mb-2">How this attention playground teaches the model&apos;s focus</div>
        <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300">
          <li>Press <strong>Run</strong> to download a quantized RoBERTa transformer and tokenizer directly in the browser.</li>
          <li>The tokenizer splits your text into subword tokens that become the rows/columns of the attention matrix.</li>
          <li>Each row is a query token distributing attention across all key tokens (columns); darker cells mean stronger focus.</li>
          <li>The calculator below summarizes those weights so you can see which words a token attends to most.</li>
        </ol>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="attention-text">Input text</label>
        <textarea
          id="attention-text"
          className="w-full h-28 rounded border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-900/60 p-3 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a sentence or short paragraph to inspect."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
          {status}
          {loadingModel ? ` (${progress}%)` : ''}
        </span>
        {error && <span className="text-red-500">{error}</span>}
      </div>

      {attention && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Layer</label>
              <select
                className="ml-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 text-sm"
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(Number(e.target.value))}
              >
                {attention.layers.map((_, idx) => (
                  <option key={idx} value={idx}>Layer {idx}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Head</label>
              <select
                className="ml-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 text-sm"
                value={selectedHead}
                onChange={(e) => setSelectedHead(Number(e.target.value))}
              >
                {attention.layers[selectedLayer].map((_, idx) => (
                  <option key={idx} value={idx}>Head {idx}</option>
                ))}
              </select>
            </div>
          </div>

          {activeHead ? (
            <div className="space-y-3">
              <div className="overflow-auto border border-gray-200 dark:border-gray-800 rounded-lg">
                <table className="min-w-full text-[11px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-gray-100 dark:bg-gray-900 text-left px-2 py-1">Token →</th>
                      {attention.tokens.map((token, idx) => (
                        <th key={idx} className="px-2 py-1 whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {formatToken(token)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeHead.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <th className="sticky left-0 bg-gray-100 dark:bg-gray-900 text-left px-2 py-1 font-medium whitespace-nowrap">
                          {formatToken(attention.tokens[rowIdx])}
                        </th>
                        {row.map((value, colIdx) => {
                          const intensity = Math.min(Math.max(value, 0), 1);
                          const background = `rgba(79, 70, 229, ${intensity})`;
                          const textColor = intensity > 0.6 ? 'text-white' : 'text-gray-900 dark:text-gray-100';
                          return (
                            <td
                              key={colIdx}
                              className={`text-center px-2 py-1 ${textColor}`}
                              style={{ backgroundColor: background }}
                              title={`Attention from "${attention.tokens[rowIdx]}" to "${attention.tokens[colIdx]}": ${(value * 100).toFixed(2)}%`}
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

              <div className="space-y-1 text-sm">
                <div className="font-semibold">Top focusing tokens (average outgoing weight)</div>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                  {topFocus.map((item, idx) => (
                    <li key={idx}>{formatToken(item.token)} — {(item.weight * 100).toFixed(1)}%</li>
                  ))}
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3 bg-white/60 dark:bg-gray-900/40">
                <div className="flex flex-col gap-1">
                  <div className="font-semibold">Attention score calculator</div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Pick a query token to see how the model distributes its attention. Use it to explain why certain words influence the representation more than others.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center text-sm">
                  <label className="font-medium" htmlFor="token-picker">Query token</label>
                  <select
                    id="token-picker"
                    className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-1"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(Number(e.target.value))}
                  >
                    {attention.tokens.map((token, idx) => (
                      <option key={idx} value={idx}>
                        {idx}: {formatToken(token)}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="score-mode"
                        value="head"
                        checked={scoreMode === 'head'}
                        onChange={() => setScoreMode('head')}
                      />
                      Selected head only
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="score-mode"
                        value="layer-average"
                        checked={scoreMode === 'layer-average'}
                        onChange={() => setScoreMode('layer-average')}
                      />
                      Average across layer
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  {sortedScores.map((score) => {
                    const width = `${Math.min(score.normalized * 100, 100).toFixed(1)}%`;
                    return (
                      <div key={score.idx} className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="w-24 truncate" title={formatToken(score.token)}>
                          {formatToken(score.token)}
                        </span>
                        <div className="flex-1 h-3 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width }}
                            aria-label={`Attention weight to ${formatToken(score.token)}`}
                          />
                        </div>
                        <span className="w-20 text-right text-gray-700 dark:text-gray-200">
                          {(score.raw * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Explanation: attention scores are probabilities that sum to 1 for each query token. Higher bars mean the selected token is focusing more on that position when constructing its contextual embedding.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No attention head selected.</p>
          )}
        </div>
      )}
    </div>
  );
}
