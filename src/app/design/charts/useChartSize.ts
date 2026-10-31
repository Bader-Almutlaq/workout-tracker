import { useLayoutEffect, useRef, useState } from 'react';
import { ChartLayout } from './chartScales';

/**
 * Observes a container's content width, including rotation; disconnects when unmounted.
 * Measures before the first paint so a chart never flashes at the fallback width.
 */
export function useChartSize(height?: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(ChartLayout.minimumWidth);
  useLayoutEffect(() => {
    const container = ref.current;
    if (container === null) return;
    setWidth(container.clientWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return { ref, width, height: height ?? ChartLayout.height };
}
