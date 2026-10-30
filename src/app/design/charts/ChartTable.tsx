import { useId, useState } from 'react';
import styles from './ChartTable.module.css';

/** Accessible table alternative for a chart; rows have stable keys and preformatted display cells. */
export function ChartTable({
  caption,
  columns,
  rows,
}: {
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly { readonly key: string; readonly cells: readonly string[] }[];
}) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={shown}
        aria-controls={id}
        onClick={() => setShown(!shown)}
      >
        {shown ? 'Hide table' : 'Show as table'}
      </button>
      {shown && (
        <div className={styles.scroll} id={id}>
          <table className={styles.table}>
            <caption>{caption}</caption>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) =>
                    index === 0 ? (
                      <th scope="row" key={index}>
                        {cell}
                      </th>
                    ) : (
                      <td key={index}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
