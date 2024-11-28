import React from 'react';
import { TypingEffect } from './TypingEffect';
import { LoadingSpinner } from './LoadingSpinner';

interface OutputEntry {
  type: 'system' | 'command' | 'error';
  content: string;
  effect?: 'typing' | 'loading';
}

interface TerminalOutputProps {
  entries: OutputEntry[];
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ entries }) => {
  return (
    <div>
      {entries.map((entry, index) => (
        <div 
          key={index} 
          className={`mb-2 ${
            entry.type === 'error' ? 'text-[#5f8787]' : 
            entry.type === 'command' ? 'text-[#99bbaa]' : 
            'text-[#c1c1c1]'
          }`}
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            fontFamily: '"EnvyCodeR Nerd Font", monospace',
          }}
        >
          {entry.effect === 'typing' ? (
            <TypingEffect content={entry.content} />
          ) : entry.effect === 'loading' ? (
            <LoadingSpinner text={entry.content} />
          ) : (
            entry.content
          )}
        </div>
      ))}
    </div>
  );
};
