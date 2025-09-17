'use client';

import { useImmer } from 'use-immer';
import { useRef, useEffect, useCallback } from 'react';
import './components.css';

interface GridProps {
    rows: number;
    cols: number;
}

export default function Grid({rows, cols}: GridProps) {
    const [grid, setGrid] = useImmer(Array.from({ length: rows }, () => Array(cols).fill(0)));
    const [isRunning, setIsRunning] = useImmer(false);
    const [generation, setGeneration] = useImmer(0);
    const [max, setMax] = useImmer(Number.MIN_SAFE_INTEGER);
    const [min, setMin] = useImmer(Number.MAX_SAFE_INTEGER);
    const lastUpdateTime = useRef(0);
    const frameDelay = 500;

    const updateGrid = useCallback(() => {
        let ma = Number.MIN_SAFE_INTEGER;
        let mi = Number.MAX_SAFE_INTEGER;

        setGrid(draft => {
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const current = draft[i][j];
                    const delta = Math.random() * 10;
                    const val = current >= 100 ? Math.floor(current - delta) : Math.ceil(current + delta);
                    draft[i][j] = val;
                    mi = Math.min(val, mi);
                    ma = Math.max(val, ma);
                }
            }
        });

        setMin(mi);
        setMax(ma);
        setGeneration(prev => prev + 1);
    }, [cols, rows, setGrid, setGeneration, setMax, setMin]);

    useEffect(() => {
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if(isRunning) {
                if(timestamp - lastUpdateTime.current > frameDelay) {
                    updateGrid();
                    lastUpdateTime.current = timestamp;
                }
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        if(isRunning) {
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            if(animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

    }, [isRunning, updateGrid]);

    return (
        <div>
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="row">
                    {row.map((cell, colIndex) => (
                        <button onClick={()=> {
                            updateGrid();
                        }}
                        key={colIndex}
                        className="cell">
                            {cell}
                        </button>
                    ))}
                </div>
            ))}
            <button onClick={() => { setIsRunning(prev => !prev); }} >
                    {isRunning ? 'stop' : 'start'}
            </button>
            <span style={{ marginLeft: '20px' }}> 
                {generation} {max} {min}
            </span>

        </div>
    )
}
