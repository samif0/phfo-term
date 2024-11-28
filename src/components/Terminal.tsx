import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { useCommandHistory } from '../hooks/useCommandHistory';
import { useTabCompletion } from '../hooks/useTabCompletion';
import { useTerminalVisuals } from '../hooks/useTerminalVisuals';
import { CommandInput } from './terminal/CommandInput';
import { TerminalOutput } from './terminal/TerminalOutput';

interface HistoryEntry {
  type: 'system' | 'command' | 'error';
  content: string;
}

interface Commands {
  [key: string]: () => { type: 'system' | 'error'; content: string; effect?: 'typing' | 'loding'; } | null;
}

const Terminal: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      type: 'system',
      content: 'type "help" to get started.',
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { addToHistory, navigateHistory } = useCommandHistory();
  const availableCommands = ['help', 'cmd1', 'cmd2', 'cmd3', 'dog', 'clear'];
  const { completeCommand } = useTabCompletion(availableCommands);
  const { startTypingEffect, startLoadingEffect } = useTerminalVisuals();

  const commands: Commands = {
    help: () => ({
      type: 'system',
      content: `available commands:
- cmd1: placeholder command 1
- cmd2: placeholder command 2
- cmd3: placeholder command 3
- oatmeal: woof
- clear: clear terminal
- help: show this message`,
      effect: 'typing' as const
    }),
    cmd1: () => ({
      type: 'system',
      content: '<placeholder>',
      effect: 'typing' as const
    }),
    cmd2: () => ({
      type: 'system',
      content: '<placeholder>',
      effect: 'typing' as const
    }),
    cmd3: () => ({
      type: 'system',
      content: '<placeholder>',
      effect: 'typing' as const
    }),
    oatmeal: () => ({
      type: 'system',
      content: `

    ___
 __/_  .  .-"""-.
 \_,  | \-  /    ) -')
  "") '"'    \  (( "
 ___Y  ,    .'7 /|
(_,___/...-^ (_/_/

woof`,
      effect: 'typing' as const

    }),
    clear: () => {
      setHistory([]);
      return null;
    }
  };

  const handleCommand = (cmd: string): void => {
    const trimmedCmd = cmd.trim().toLowerCase();
    const command = commands[trimmedCmd];
    
    if (command) {
      const result = command();
      if (result) {
        setHistory(prev => [...prev, 
          { type: 'command', content: `$ ${cmd}` },
          result
        ]);
      }
    } else {
      setHistory(prev => [...prev,
        { type: 'command', content: `$ ${cmd}` },
        { type: 'error', content: `Command not found: ${cmd}. Type "help" for available commands.` }
      ]);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div 
      className="min-h-screen bg-[#000000] text-[#c1c1c1] p-4 relative"
      style={{
        fontFamily: '"EnvyCodeR Nerd Font", monospace',
        fontSize: '18px',
      }}
    >
      <div className="max-w-3xl mx-auto pb-16"> {/* Added padding at bottom to make room for fixed links */}
        <div className="rounded-lg p-4">
          {history.map((entry, index) => (
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
              {entry.content.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          ))}
          <div className="flex items-center">
            <span className="mr-2 text-[#99bbaa]">$</span>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-none outline-none text-[#c1c1c1] w-full"
              style={{
                fontFamily: '"EnvyCodeR Nerd Font", monospace',
                fontSize: '18px',
                caretColor: '#c1c1c1',
              }}
              autoFocus
            />
          </div>
          <div ref={bottomRef} />
        </div>
      </div>
      
      {/* Fixed position footer with social links */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#000000] p-4 border-t border-[#333333]">
        <div className="flex justify-center gap-4 max-w-3xl mx-auto">
          <a href="https://github.com/samif0" target="_blank" rel="noopener noreferrer" className="text-[#888888] hover:text-[#c1c1c1]">
            <Github className="w-6 h-6" />
          </a>
          <a href="mailto:samifawcett.nyc@gmail.com" className="text-[#888888] hover:text-[#c1c1c1]">
            <Mail className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
