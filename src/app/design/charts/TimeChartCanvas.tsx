import { useLayoutEffect, useState, type ReactNode } from 'react';
import type { TimeChartDomain, TimeChartProps } from './TimeChart.types';
import { ChartFrame } from './ChartFrame';
import { TimeChartPolicy } from './timeChartMath';
import { timeChartModel } from './timeChartModel';
import { useChartSize } from './useChartSize';
import { useTimeChartGesture } from './useTimeChartGesture';
import { TimeChartMarks } from './TimeChartMarks';
import { TimeChartLegend } from './TimeChartLegend';
import { TimeChartCallout } from './TimeChartCallout';
import { TimeChartTable } from './TimeChartTable';
import styles from './TimeChart.module.css';

/** One renderer for inline and expanded charts: axes, interaction, legend, callout and accessible bucket table. */
export function TimeChartCanvas({
  props,
  domain,
  history,
  expanded = false,
  rotated = false,
  onDomain,
  table = false,
  controls,
}: {
  readonly props: TimeChartProps;
  readonly domain: TimeChartDomain;
  readonly history: TimeChartDomain;
  readonly expanded?: boolean;
  readonly rotated?: boolean;
  readonly onDomain?: (domain: TimeChartDomain) => void;
  readonly table?: boolean;
  readonly controls: ReactNode;
}) {
  const { ref, width } = useChartSize(TimeChartPolicy.height);
  const [height, setHeight] = useState<number>(TimeChartPolicy.height);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null || !expanded) return;
    const measure = () => {
      if (element.clientHeight > 0) setHeight(Math.max(TimeChartPolicy.height, element.clientHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, ref, table]);
  const model = timeChartModel(props, domain, width, height, expanded);
  const interaction = useTimeChartGesture({
    model,
    ref,
    width,
    height,
    expanded,
    rotated,
    domain,
    history,
    ...(onDomain === undefined ? {} : { onDomain }),
  });
  return (
    <section className={styles.chart} aria-label={props.title}>
      <header className={styles.header}>
        <h2 className={styles.title}>{props.title}</h2>
        {controls}
      </header>
      <TimeChartLegend model={model} />
      <div
        hidden={table}
        ref={ref}
        className={`${styles.plot} ${interaction.selected !== null ? styles.interacting : ''}`}
        tabIndex={0}
        role="group"
        aria-label={`${props.title}; use arrow keys to inspect values`}
        {...interaction.handlers}
      >
        {model.dates.length === 0 ? (
          <div className={styles.empty}>No data in this range.</div>
        ) : (
          <ChartFrame width={width} height={height} scales={model.scales} label={props.title} unit={props.unit}>
            <TimeChartMarks model={model} kind={props.kind ?? 'line'} selected={interaction.selected} />
          </ChartFrame>
        )}
      </div>
      {interaction.selected !== null && !table && (
        <TimeChartCallout
          model={model}
          date={interaction.selected}
          props={props}
          width={width}
          openable={expanded && interaction.openable}
        />
      )}
      <TimeChartTable model={model} props={props} visible={table} expanded={expanded} />
    </section>
  );
}
