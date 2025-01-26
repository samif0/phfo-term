'use client';

import { useImmer } from 'use-immer';
import { useRef, useEffect } from 'react';
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

    function updateCell(row: number, col: number, value: number) {
        setGrid(draft => {
            draft[row][col] = value;
        });
    }

    function updateGrid() {
        setGrid(draft => {
            let ma = Number.MIN_SAFE_INTEGER;
            let mi = Number.MAX_SAFE_INTEGER;
            for(let i = 0; i < rows; i++) {
                for(let j = 0; j < cols; j++) {
                    const val = draft[i][j] >= 100 ? Math.floor(draft[i][j] - (Math.random()*10)) : Math.ceil(draft[i][j] + (Math.random()*10));
                    updateCell(i, j, val);
                    mi = Math.min(val, mi)
                    ma = Math.max(val, ma)
                }
            }
            setMin(mi)
            setMax(ma)
        });
        setGeneration(prev => prev + 1);
    }

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

    }, [isRunning]);

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