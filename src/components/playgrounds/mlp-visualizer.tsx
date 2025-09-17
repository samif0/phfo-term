'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlaygroundControls } from '@/lib/playground-types';
import { useTheme } from '@/components/theme-provider';

interface DataPoint {
  x: number;
  y: number;
  label: number;
}

interface NetworkState {
  layerSizes: number[];
  weights: number[][][];
  biases: number[][];
}

interface TrainingMetrics {
  step: number;
  loss: number;
  accuracy: number;
}

type HoveredItem =
  | { type: 'node'; layer: number; index: number; bias: number | null }
  | { type: 'edge'; layer: number; source: number; target: number; weight: number };

const MAX_INPUTS = 8;
const MAX_HIDDEN_NODES = 8;
const MAX_LAYERS = 4;
const DATASET_SIZE_PER_CLASS = 120;

const CLASS_COLORS = ['#0EA5E9', '#F97316', '#22C55E', '#A855F7', '#F43F5E', '#EAB308'];

const POSITIVE_WEIGHT_COLOR = {
  light: '#16A34A',
  dark: '#22C55E',
};

const NEGATIVE_WEIGHT_COLOR = {
  light: '#DC2626',
  dark: '#F87171',
};

function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function relu(x: number): number {
  return x > 0 ? x : 0;
}

function reluDerivative(x: number): number {
  return x > 0 ? 1 : 0;
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map(value => Math.exp(value - maxLogit));
  const sumExps = exps.reduce((acc, value) => acc + value, 0) || 1;
  return exps.map(value => value / sumExps);
}

function oneHot(index: number, size: number): number[] {
  return Array.from({ length: size }, (_, i) => (i === index ? 1 : 0));
}

function argMax(values: number[]): number {
  return values.reduce((bestIndex, value, index, arr) => (value > arr[bestIndex] ? index : bestIndex), 0);
}

function buildInput(point: DataPoint, inputSize: number): number[] {
  const derived = [
    point.x,
    point.y,
    point.x * point.y,
    point.x * point.x,
    point.y * point.y,
    Math.sin(point.x * Math.PI),
    Math.sin(point.y * Math.PI),
    Math.cos(point.x * Math.PI),
    Math.cos(point.y * Math.PI),
  ];

  if (derived.length < inputSize) {
    while (derived.length < inputSize) {
      derived.push(0);
    }
  }

  return derived.slice(0, inputSize);
}

function generateDataset(numClasses: number): DataPoint[] {
  const points: DataPoint[] = [];
  const radius = 0.65;
  const spread = 0.18;

  for (let label = 0; label < numClasses; label++) {
    const angle = (label / numClasses) * Math.PI * 2;
    const cx = Math.cos(angle) * radius;
    const cy = Math.sin(angle) * radius;

    for (let i = 0; i < DATASET_SIZE_PER_CLASS; i++) {
      const jitterX = randn() * spread;
      const jitterY = randn() * spread;
      points.push({
        x: cx + jitterX,
        y: cy + jitterY,
        label,
      });
    }
  }

  return points;
}

function forwardWithTracking(input: number[], network: NetworkState) {
  const activations: number[][] = [input];
  const zs: number[][] = [];

  for (let layer = 0; layer < network.weights.length; layer++) {
    const weightMatrix = network.weights[layer];
    const biasVector = network.biases[layer];
    const previousActivation = activations[layer];

    const z = weightMatrix.map((weightsRow, neuronIndex) => {
      const bias = biasVector[neuronIndex];
      let sum = bias;
      for (let j = 0; j < weightsRow.length; j++) {
        sum += weightsRow[j] * previousActivation[j];
      }
      return sum;
    });

    zs.push(z);

    if (layer === network.weights.length - 1) {
      activations.push(softmax(z));
    } else {
      activations.push(z.map(relu));
    }
  }

  return { activations, zs };
}

function forwardInference(input: number[], network: NetworkState): number[] {
  let activations = input;

  for (let layer = 0; layer < network.weights.length; layer++) {
    const weightMatrix = network.weights[layer];
    const biasVector = network.biases[layer];

    const z = weightMatrix.map((weightsRow, neuronIndex) => {
      let sum = biasVector[neuronIndex];
      for (let j = 0; j < weightsRow.length; j++) {
        sum += weightsRow[j] * activations[j];
      }
      return sum;
    });

    activations = layer === network.weights.length - 1 ? softmax(z) : z.map(relu);
  }

  return activations;
}

function performTrainingEpoch(
  dataset: DataPoint[],
  network: NetworkState,
  inputSize: number,
  outputSize: number,
  learningRate: number,
): { loss: number; accuracy: number } {
  if (!dataset.length) {
    return { loss: 0, accuracy: 0 };
  }

  const weightGrads = network.weights.map(layer => layer.map(row => row.map(() => 0)));
  const biasGrads = network.biases.map(layer => layer.map(() => 0));

  let totalLoss = 0;
  let correct = 0;

  for (const point of dataset) {
    const input = buildInput(point, inputSize);
    const { activations, zs } = forwardWithTracking(input, network);
    const output = activations[activations.length - 1];
    const target = oneHot(point.label, outputSize);

    totalLoss += -target.reduce((sum, value, idx) => sum + value * Math.log(output[idx] + 1e-8), 0);

    if (argMax(output) === point.label) {
      correct += 1;
    }

    let delta = output.map((value, idx) => value - target[idx]);
    const lastLayerIndex = network.weights.length - 1;

    for (let i = 0; i < delta.length; i++) {
      biasGrads[lastLayerIndex][i] += delta[i];
      for (let j = 0; j < activations[lastLayerIndex].length; j++) {
        weightGrads[lastLayerIndex][i][j] += delta[i] * activations[lastLayerIndex][j];
      }
    }

    for (let layer = network.weights.length - 2; layer >= 0; layer--) {
      const nextWeights = network.weights[layer + 1];
      const currentZ = zs[layer];
      const newDelta = currentZ.map((_, idx) => {
        let sum = 0;
        for (let k = 0; k < delta.length; k++) {
          sum += nextWeights[k][idx] * delta[k];
        }
        return sum * reluDerivative(currentZ[idx]);
      });

      for (let i = 0; i < newDelta.length; i++) {
        biasGrads[layer][i] += newDelta[i];
        for (let j = 0; j < activations[layer].length; j++) {
          weightGrads[layer][i][j] += newDelta[i] * activations[layer][j];
        }
      }

      delta = newDelta;
    }
  }

  const scale = learningRate / dataset.length;

  for (let layer = 0; layer < network.weights.length; layer++) {
    for (let i = 0; i < network.weights[layer].length; i++) {
      network.biases[layer][i] -= scale * biasGrads[layer][i];
      for (let j = 0; j < network.weights[layer][i].length; j++) {
        network.weights[layer][i][j] -= scale * weightGrads[layer][i][j];
      }
    }
  }

  return {
    loss: totalLoss / dataset.length,
    accuracy: correct / dataset.length,
  };
}

function weightStrokeColor(weight: number, theme: 'dark' | 'light'): string {
  const palette = weight >= 0 ? POSITIVE_WEIGHT_COLOR : NEGATIVE_WEIGHT_COLOR;
  const intensity = Math.min(1, Math.abs(weight));
  if (theme === 'dark') {
    return lightenColor(palette.dark, 0.2 * (1 - intensity));
  }
  return lightenColor(palette.light, 0.2 * (1 - intensity));
}

function lightenColor(hex: string, amount: number): string {
  const normalized = Math.min(Math.max(amount, 0), 1);
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 0xff) * (1 + normalized)));
  const g = Math.min(255, Math.floor(((num >> 8) & 0xff) * (1 + normalized)));
  const b = Math.min(255, Math.floor((num & 0xff) * (1 + normalized)));
  return `#${[r, g, b]
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

export default function MLPVisualizer({
  isRunning,
  isPaused,
}: PlaygroundControls) {
  const { theme } = useTheme();
  const [inputSize, setInputSize] = useState(2);
  const [outputSize, setOutputSize] = useState(3);
  const [hiddenLayers, setHiddenLayers] = useState<number[]>([4, 4]);
  const [learningRate, setLearningRate] = useState(0.05);
  const [dataset, setDataset] = useState<DataPoint[]>(() => generateDataset(3));
  const [renderTick, setRenderTick] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);

  const networkRef = useRef<NetworkState | null>(null);
  const metricsRef = useRef<TrainingMetrics>({ step: 0, loss: 0, accuracy: 0 });

  const resetMetrics = useCallback(() => {
    metricsRef.current = { step: 0, loss: 0, accuracy: 0 };
    setStep(0);
    setLoss(null);
    setAccuracy(null);
  }, []);

  const resetNetwork = useCallback(() => {
    const sizes = [inputSize, ...hiddenLayers, outputSize];
    if (sizes.some(size => size <= 0)) {
      return;
    }

    const weights = sizes.slice(0, -1).map((layerSize, idx) => {
      const nextSize = sizes[idx + 1];
      const scale = Math.sqrt(2 / layerSize);
      return Array.from({ length: nextSize }, () =>
        Array.from({ length: layerSize }, () => randn() * scale),
      );
    });

    const biases = sizes.slice(1).map(size => Array.from({ length: size }, () => randn() * 0.01));

    networkRef.current = {
      layerSizes: sizes,
      weights,
      biases,
    };

    resetMetrics();
    setRenderTick(prev => prev + 1);
  }, [hiddenLayers, inputSize, outputSize, resetMetrics]);

  useEffect(() => {
    resetNetwork();
  }, [resetNetwork]);

  useEffect(() => {
    setDataset(generateDataset(outputSize));
  }, [outputSize]);

  const applyTrainingStep = useCallback(
    (forceUpdate = false) => {
      if (!networkRef.current) {
        return;
      }

      const metrics = performTrainingEpoch(dataset, networkRef.current, inputSize, outputSize, learningRate);
      metricsRef.current = {
        step: metricsRef.current.step + 1,
        loss: metrics.loss,
        accuracy: metrics.accuracy,
      };

      if (forceUpdate || metricsRef.current.step % 5 === 0) {
        setStep(metricsRef.current.step);
        setLoss(metrics.loss);
        setAccuracy(metrics.accuracy);
        setRenderTick(prev => prev + 1);
      }
    },
    [dataset, inputSize, learningRate, outputSize],
  );

  useEffect(() => {
    if (!isRunning || isPaused) {
      return;
    }

    let frameId: number;

    const loop = () => {
      applyTrainingStep(false);
      applyTrainingStep(false);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [applyTrainingStep, isPaused, isRunning]);

  const predictions = useMemo(() => {
    void renderTick; // ensure memo invalidates when training advances
    if (!networkRef.current) {
      return [] as { point: DataPoint; predicted: number; confidence: number }[];
    }

    return dataset.map(point => {
      const input = buildInput(point, inputSize);
      const output = forwardInference(input, networkRef.current!);
      const predicted = argMax(output);
      return {
        point,
        predicted,
        confidence: output[predicted] ?? 0,
      };
    });
  }, [dataset, inputSize, renderTick]);

  const handleHiddenLayerSizeChange = (index: number, value: number) => {
    setHiddenLayers(prev => {
      const updated = [...prev];
      updated[index] = Math.max(1, Math.min(MAX_HIDDEN_NODES, value));
      return updated;
    });
  };

  const handleAddLayer = () => {
    setHiddenLayers(prev => {
      if (prev.length >= MAX_LAYERS) {
        return prev;
      }
      return [...prev, 4];
    });
  };

  const handleRemoveLayer = (index: number) => {
    setHiddenLayers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRegenerateData = () => {
    setDataset(generateDataset(outputSize));
    resetMetrics();
    setRenderTick(prev => prev + 1);
  };

  const handleStep = () => {
    applyTrainingStep(true);
  };

  const handleResetWeights = () => {
    resetNetwork();
  };

  const network = networkRef.current;
  const svgWidth = 560;
  const svgHeight = 360;
  const marginX = 50;
  const marginY = 40;

  const nodePositions = useMemo(() => {
    if (!network) {
      return [] as { x: number; y: number }[][];
    }

    return network.layerSizes.map((size, layerIdx) => {
      const xStep = network.layerSizes.length > 1 ? (svgWidth - marginX * 2) / (network.layerSizes.length - 1) : 0;
      const yStep = size > 1 ? (svgHeight - marginY * 2) / (size - 1) : 0;
      const baseY = size > 1 ? marginY : svgHeight / 2;

      return Array.from({ length: size }, (_, neuronIdx) => ({
        x: marginX + layerIdx * xStep,
        y: baseY + neuronIdx * yStep,
      }));
    });
  }, [network, marginX, marginY, svgHeight, svgWidth]);

  const plotSize = 320;
  const plotMargin = 24;

  const themeKey = theme ?? 'light';

  const layerDescriptor = useCallback(
    (layerIndex: number) => {
      if (!networkRef.current) {
        return `Layer ${layerIndex}`;
      }
      const lastLayerIndex = networkRef.current.layerSizes.length - 1;
      if (layerIndex === 0) return 'Input layer';
      if (layerIndex === lastLayerIndex) return 'Output layer';
      return `Hidden layer ${layerIndex}`;
    },
    [],
  );

  const hoveredSummary = useMemo(() => {
    if (!hoveredItem) {
      return null;
    }

    if (hoveredItem.type === 'node') {
      const biasValue = hoveredItem.bias;
      const network = networkRef.current;
      const incoming = hoveredItem.layer === 0
        ? 0
        : network?.weights[hoveredItem.layer - 1]?.[hoveredItem.index]?.length ?? 0;
      const outgoing = hoveredItem.layer >= (network?.layerSizes.length ?? 1) - 1
        ? 0
        : network?.weights[hoveredItem.layer]?.length ?? 0;
      return {
        heading: `${layerDescriptor(hoveredItem.layer)} · Node ${hoveredItem.index}`,
        lines: [
          biasValue === null ? 'Input node (no bias term)' : `Bias: ${biasValue.toFixed(4)}`,
          `Incoming connections: ${incoming}`,
          `Outgoing connections: ${outgoing}`,
        ],
      };
    }

    const baseLayerName = layerDescriptor(hoveredItem.layer);
    return {
      heading: `${baseLayerName} → ${layerDescriptor(hoveredItem.layer + 1)}`,
      lines: [
        `From neuron ${hoveredItem.source} to neuron ${hoveredItem.target}`,
        `Weight: ${hoveredItem.weight.toFixed(4)}`,
      ],
    };
  }, [hoveredItem, layerDescriptor]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden lg:flex-row">
      <div className="w-full space-y-6 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:w-80">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Architecture</h3>
          <div className="mt-3 space-y-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Input Nodes</span>
              <input
                type="range"
                min={2}
                max={MAX_INPUTS}
                value={inputSize}
                onChange={event => setInputSize(Number(event.target.value))}
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">{inputSize} features</span>
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <span>Hidden Layers</span>
                <button
                  type="button"
                  className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                  onClick={handleAddLayer}
                  disabled={hiddenLayers.length >= MAX_LAYERS}
                >
                  + Add
                </button>
              </div>

              {hiddenLayers.length === 0 && (
                <div className="rounded border border-dashed border-gray-300 p-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No hidden layers — the network becomes logistic regression.
                </div>
              )}

              {hiddenLayers.map((size, index) => (
                <div key={index} className="rounded border border-gray-200 p-2 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                    <span>Layer {index + 1}</span>
                    <button
                      type="button"
                      className="text-xs text-rose-500 hover:underline dark:text-rose-400"
                      onClick={() => handleRemoveLayer(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={MAX_HIDDEN_NODES}
                    value={size}
                    className="mt-2"
                    onChange={event => handleHiddenLayerSizeChange(index, Number(event.target.value))}
                  />
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{size} neurons</div>
                </div>
              ))}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Output Nodes</span>
              <input
                type="range"
                min={2}
                max={Math.min(CLASS_COLORS.length, 5)}
                value={outputSize}
                onChange={event => setOutputSize(Number(event.target.value))}
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">{outputSize} classes</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Training</h3>
          <div className="mt-3 space-y-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Learning Rate</span>
              <input
                type="range"
                min={0.005}
                max={0.2}
                step={0.005}
                value={learningRate}
                onChange={event => setLearningRate(Number(event.target.value))}
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">{learningRate.toFixed(3)}</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetWeights}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Reset Weights
              </button>
              <button
                type="button"
                onClick={handleRegenerateData}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                New Dataset
              </button>
            </div>

            <button
              type="button"
              onClick={handleStep}
              className="w-full rounded bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
              disabled={!network}
            >
              Step Once
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Metrics</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Epoch</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{step}</div>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Loss</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{loss !== null ? loss.toFixed(3) : '—'}</div>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Accuracy</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {accuracy !== null ? `${(accuracy * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Classes</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{outputSize}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Data Distribution & Predictions</h3>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row">
            <svg width={plotSize} height={plotSize} className="rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
              <rect width={plotSize} height={plotSize} fill={themeKey === 'dark' ? '#0f172a' : '#f8fafc'} rx={6} />
              <line
                x1={plotMargin}
                x2={plotSize - plotMargin}
                y1={plotSize / 2}
                y2={plotSize / 2}
                stroke={themeKey === 'dark' ? '#1e293b' : '#cbd5f5'}
                strokeDasharray="4 4"
              />
              <line
                y1={plotMargin}
                y2={plotSize - plotMargin}
                x1={plotSize / 2}
                x2={plotSize / 2}
                stroke={themeKey === 'dark' ? '#1e293b' : '#cbd5f5'}
                strokeDasharray="4 4"
              />
              {predictions.map(({ point, predicted }, index) => {
                const sx = plotMargin + ((point.x + 1) / 2) * (plotSize - plotMargin * 2);
                const sy = plotMargin + ((1 - (point.y + 1) / 2)) * (plotSize - plotMargin * 2);
                const actualColor = CLASS_COLORS[point.label % CLASS_COLORS.length];
                const predictedColor = CLASS_COLORS[predicted % CLASS_COLORS.length];
                const mismatch = predicted !== point.label;

                return (
                  <circle
                    key={index}
                    cx={sx}
                    cy={sy}
                    r={mismatch ? 4 : 3}
                    fill={predictedColor}
                    stroke={mismatch ? actualColor : themeKey === 'dark' ? '#0f172a' : '#ffffff'}
                    strokeWidth={mismatch ? 1.5 : 1}
                    opacity={0.85}
                  >
                    <title>
                      {`Actual ${point.label} → Pred ${predicted}`}
                    </title>
                  </circle>
                );
              })}
            </svg>

            <div className="flex-1 space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                Points are sampled from distinct clusters in 2D space. Fill color shows the predicted class, while the outline
                denotes the actual class. Larger outlined points mark misclassifications.
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: outputSize }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-700">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: CLASS_COLORS[idx % CLASS_COLORS.length] }}
                    />
                    <span>Class {idx}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Network Topology</h3>
          <div className="mt-4 overflow-x-auto">
            <svg
              width={svgWidth}
              height={svgHeight}
              className="max-w-full"
              onMouseLeave={() => setHoveredItem(null)}
            >
              <rect width={svgWidth} height={svgHeight} rx={12} fill={themeKey === 'dark' ? '#111827' : '#f8fafc'} />
              {network && nodePositions.length > 1 && (
                <g>
                  {network.weights.map((matrix, layerIdx) => (
                    <g key={`layer-${layerIdx}-edges`}>
                      {matrix.map((row, targetIdx) => (
                        <g key={`edge-${layerIdx}-${targetIdx}`}>
                          {row.map((weight, sourceIdx) => {
                            const source = nodePositions[layerIdx]?.[sourceIdx];
                            const target = nodePositions[layerIdx + 1]?.[targetIdx];
                            if (!source || !target) {
                              return null;
                            }
                            const midX = (source.x + target.x) / 2;
                            const midY = (source.y + target.y) / 2;
                            const showLabel =
                              network.layerSizes[layerIdx] <= 5 && network.layerSizes[layerIdx + 1] <= 5;
                            const strokeWidth = 0.8 + Math.min(3.5, Math.abs(weight) * 2);
                            const isHoveredEdge =
                              hoveredItem?.type === 'edge' &&
                              hoveredItem.layer === layerIdx &&
                              hoveredItem.source === sourceIdx &&
                              hoveredItem.target === targetIdx;

                            return (
                              <g key={`edge-${layerIdx}-${sourceIdx}-${targetIdx}`}>
                                <line
                                  x1={source.x}
                                  y1={source.y}
                                  x2={target.x}
                                  y2={target.y}
                                  stroke={weightStrokeColor(weight, themeKey)}
                                  strokeWidth={isHoveredEdge ? strokeWidth + 1.2 : strokeWidth}
                                  strokeOpacity={isHoveredEdge ? 1 : 0.85}
                                  className="cursor-pointer"
                                  onMouseEnter={() =>
                                    setHoveredItem({
                                      type: 'edge',
                                      layer: layerIdx,
                                      source: sourceIdx,
                                      target: targetIdx,
                                      weight,
                                    })
                                  }
                                  onMouseLeave={() => setHoveredItem(null)}
                                >
                                  <title>{`Weight: ${weight.toFixed(3)}`}</title>
                                </line>
                                {showLabel && (
                                  <text
                                    x={midX}
                                    y={midY - 4}
                                    className="text-[9px] font-mono"
                                    textAnchor="middle"
                                    fill={themeKey === 'dark' ? '#E2E8F0' : '#1E293B'}
                                    onMouseEnter={() =>
                                      setHoveredItem({
                                        type: 'edge',
                                        layer: layerIdx,
                                        source: sourceIdx,
                                        target: targetIdx,
                                        weight,
                                      })
                                    }
                                    onMouseLeave={() => setHoveredItem(null)}
                                  >
                                    {weight.toFixed(2)}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </g>
                      ))}
                    </g>
                  ))}

                  {nodePositions.map((layer, layerIdx) => (
                    <g key={`layer-${layerIdx}-nodes`}>
                      {layer.map((node, neuronIdx) => {
                        const isInputLayer = layerIdx === 0;
                        const bias = !isInputLayer ? network.biases[layerIdx - 1][neuronIdx] : 0;
                        const biasMagnitude = Math.min(1, Math.abs(bias));
                        const fill = isInputLayer
                          ? themeKey === 'dark' ? '#1f2937' : '#ffffff'
                          : bias >= 0
                            ? `rgba(34,197,94,${0.2 + biasMagnitude * 0.5})`
                            : `rgba(248,113,113,${0.2 + biasMagnitude * 0.5})`;
                        const stroke = isInputLayer
                          ? themeKey === 'dark' ? '#6b7280' : '#94a3b8'
                          : bias >= 0
                            ? '#22c55e'
                            : '#f87171';
                        const isHoveredNode =
                          hoveredItem?.type === 'node' &&
                          hoveredItem.layer === layerIdx &&
                          hoveredItem.index === neuronIdx;

                        return (
                          <g key={`node-${layerIdx}-${neuronIdx}`}>
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={isHoveredNode ? 18 : 16}
                              fill={fill}
                              stroke={stroke}
                              strokeWidth={isHoveredNode ? 2 : isInputLayer ? 1 : 1.2}
                              className="cursor-pointer transition-all"
                              onMouseEnter={() =>
                                setHoveredItem({
                                  type: 'node',
                                  layer: layerIdx,
                                  index: neuronIdx,
                                  bias: isInputLayer ? null : bias,
                                })
                              }
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <title>
                                {isInputLayer ? `Input ${neuronIdx}` : `Bias ${bias.toFixed(3)}`}
                              </title>
                            </circle>
                            <text
                              x={node.x}
                              y={node.y + 3}
                              className="text-[11px] font-semibold"
                              textAnchor="middle"
                              fill={themeKey === 'dark' ? '#E2E8F0' : '#1F2937'}
                              onMouseEnter={() =>
                                setHoveredItem({
                                  type: 'node',
                                  layer: layerIdx,
                                  index: neuronIdx,
                                  bias: isInputLayer ? null : bias,
                                })
                              }
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              {isInputLayer ? `x${neuronIdx}` : bias.toFixed(2)}
                            </text>
                            <text
                              x={node.x}
                              y={node.y + 28}
                              className="text-[10px]"
                              textAnchor="middle"
                              fill={themeKey === 'dark' ? '#94A3B8' : '#475569'}
                              onMouseEnter={() =>
                                setHoveredItem({
                                  type: 'node',
                                  layer: layerIdx,
                                  index: neuronIdx,
                                  bias: isInputLayer ? null : bias,
                                })
                              }
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              {layerIdx === network.layerSizes.length - 1
                                ? `Output ${neuronIdx}`
                                : layerIdx === 0
                                  ? 'Input'
                                  : `Hidden ${layerIdx}`}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  ))}
                </g>
              )}
            </svg>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Edge thickness encodes weight magnitude; color shows sign. Hover over nodes and connections to inspect exact values.
            Biases appear inside nodes, and small networks surface numeric labels directly on each edge.
          </p>
          <div className="mt-3 rounded border border-dashed border-gray-300 bg-white/60 p-3 text-xs text-gray-600 backdrop-blur dark:border-gray-700 dark:bg-slate-900/40 dark:text-gray-300">
            {hoveredSummary ? (
              <div className="space-y-1">
                <div className="font-semibold uppercase tracking-wide text-[11px] text-gray-500 dark:text-gray-400">
                  {hoveredSummary.heading}
                </div>
                {hoveredSummary.lines.map((line, idx) => (
                  <div key={idx} className="text-xs">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div>Hover a node or edge to reveal exact weights, biases, and connectivity counts.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Weight Snapshot</h3>
          {network ? (
            <div className="mt-3 space-y-3 text-xs">
              {network.weights.map((matrix, layerIdx) => (
                <div key={layerIdx} className="rounded border border-gray-200 p-3 dark:border-gray-700">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Layer {layerIdx}: {network.layerSizes[layerIdx]} → {network.layerSizes[layerIdx + 1]}
                  </div>
                  <pre className="overflow-auto rounded bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-100 dark:bg-slate-800 dark:text-slate-100">
{matrix
  .map(row => row.map(weight => weight.toFixed(2)).join('\t'))
  .join('\n')}
                  </pre>
                  <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                    Biases: {network.biases[layerIdx].map(bias => bias.toFixed(2)).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Initialize the network to inspect its weights.</p>
          )}
        </div>
      </div>
    </div>
  );
}
