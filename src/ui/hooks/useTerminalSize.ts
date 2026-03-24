import { useState, useEffect } from 'react';
import { useStdout } from 'ink';

interface TerminalSize {
  columns: number;
  rows: number;
}

/**
 * useTerminalSize
 * 替代 Ink 4 中不存在的 useStdoutDimensions
 * 监听终端 resize 事件，返回当前终端尺寸
 */
export function useTerminalSize(): [number, number] {
  const { stdout } = useStdout();

  const [size, setSize] = useState<TerminalSize>({
    columns: stdout?.columns ?? process.stdout.columns ?? 80,
    rows:    stdout?.rows    ?? process.stdout.rows    ?? 24,
  });

  useEffect(() => {
    if (!stdout) return;

    const handleResize = () => {
      setSize({
        columns: stdout.columns ?? 80,
        rows:    stdout.rows    ?? 24,
      });
    };

    stdout.on('resize', handleResize);
    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  return [size.columns, size.rows];
}
