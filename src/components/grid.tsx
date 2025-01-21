'use client';

import { useImmer } from 'use-immer';
import './components.css';

interface GridProps {
    rows: number;
    cols: number;
}

export default function Grid({rows, cols}: GridProps) {
    const [grid, setGrid] = useImmer(Array.from({ length: rows }, () => Array(cols).fill(0)));

    function updateCell(row: number, col: number, value: number) {
        setGrid(draft => {
            draft[row][col] = value;
        });
    }

    return (
        <div>
            {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="row">
                    {row.map((cell, colIndex) => (
                        <button onClick={()=> {
                            updateCell(rowIndex, colIndex, grid[rowIndex][colIndex] + 1);
                        }}
                        key={colIndex}
                        className="cell">
                            {cell}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    )
}