import { useEffect, useRef, useState } from 'react';
import { ChartLayout } from './chartScales';

/** Observes a container's content width, including rotation; disconnects when unmounted. */
export function useChartSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(ChartLayout.minimumWidth);
  useEffect(() => {
    const container = ref.current;
    if (container === null) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) setWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
