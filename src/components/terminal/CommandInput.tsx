import React, { KeyboardEvent, ChangeEvent } from 'react';

interface CommandInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  value,
  onChange,
  onKeyDown
}) => {
  return (
    <div className="flex items-center">
      <span className="mr-2 text-[#99bbaa]">$</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent border-none outline-none text-[#c1c1c1] w-full"
        style={{
          fontFamily: '"EnvyCodeR Nerd Font", monospace',
          fontSize: '18px',
          caretColor: '#c1c1c1',
        }}
        autoFocus
      />
    </div>
  );
};
