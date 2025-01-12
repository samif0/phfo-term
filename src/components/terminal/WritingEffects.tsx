import React, { useState, useEffect } from 'react';

interface WritingEffectProps {
  text: string;
  speed?: number;
  className?: string;
}

export const WritingEffect: React.FC<WritingEffectProps> = ({
  text,
  speed = 40,
  className
}) => {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const lines = text.split('\n');
    let currentLineIndex = 0;
    let currentCharIndex = 0;
    const displayLines: string[] = [''];

    const writeText = setInterval(() => {
      if (currentLineIndex === lines.length) {
        setIsComplete(true);
        clearInterval(writeText);
        return;
      }

      if (currentCharIndex === lines[currentLineIndex].length) {
        currentLineIndex++;
        currentCharIndex = 0;
        if (currentLineIndex < lines.length) {
          displayLines.push('');
        }
      } else {
        displayLines[currentLineIndex] += lines[currentLineIndex][currentCharIndex];
        currentCharIndex++;
      }

      setDisplayedText([...displayLines]);
    }, speed);

    return () => clearInterval(writeText);
  }, [text, speed]);

  return (
    <div className={className}>
      {displayedText.map((line, index) => (
        <div 
          key={index}
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            fontFamily: '"EnvyCodeR Nerd Font", monospace',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};