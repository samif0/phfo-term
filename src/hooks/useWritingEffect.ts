import { useState, useEffect } from 'react';

export const useWritingEffect = (text: string, speed: number = 50) => {
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

  return { displayedText, isComplete };
};