import React from 'react';

interface Props {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ colors, value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-xl transition-all dark:ring-offset-slate-900 ${
            value === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : ''
          }`}
          style={{ background: color }}
        />
      ))}
    </div>
  );
}
