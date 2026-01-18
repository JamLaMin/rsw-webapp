'use client';

import { useEffect, useRef, useState } from 'react';

export default function BarcodeCatcher({ onBarcode }: { onBarcode: (code: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [buffer, setBuffer] = useState('');

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    window.addEventListener('click', focus);
    return () => window.removeEventListener('click', focus);
  }, []);

  return (
    <input
      ref={inputRef}
      value={buffer}
      onChange={(e) => setBuffer(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const code = buffer.trim();
          setBuffer('');
          if (code) onBarcode(code);
        }
      }}
      style={{ position: 'absolute', left: -9999, top: -9999 }}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
