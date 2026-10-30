import type { SAHPoolUtil, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { vi } from 'vitest';

/** In-memory file-pool harness using real SQLite connections; only OPFS I/O is simulated. */
export class MemoryDevice {
  readonly files = new Map<string, Uint8Array>();
  readonly imports: string[] = [];
  readonly closes: string[] = [];
  readonly pool: SAHPoolUtil;
  readonly sqlite: Sqlite3Static;
  failImport: ((name: string) => boolean) | undefined;
  beforeImport: ((name: string) => Promise<void>) | undefined;

  constructor(sqlite: Sqlite3Static) {
    const { files, closes } = this;
    class MemoryPoolDatabase extends sqlite.oo1.DB {
      constructor(readonly fileName: string) {
        super(':memory:', 'c');
        const bytes = files.get(fileName);
        if (bytes !== undefined) {
          const pointer = sqlite.wasm.allocFromTypedArray(bytes);
          const flags = sqlite.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite.capi.SQLITE_DESERIALIZE_RESIZEABLE;
          const status = sqlite.capi.sqlite3_deserialize(this, 'main', pointer, bytes.length, bytes.length, flags);
          if (status !== 0) throw new Error(`Cannot reopen simulated file: ${status}`);
        }
      }
      override close(): void {
        files.set(this.fileName, sqlite.capi.sqlite3_js_db_export(this));
        closes.push(this.fileName);
        super.close();
      }
    }
    // The harness supplies exactly the SAH pool surface OnDeviceStore uses; SQLite itself is real.
    this.pool = {
      OpfsSAHPoolDb: MemoryPoolDatabase,
      reserveMinimumCapacity: vi.fn(async () => undefined),
      getFileNames: () => [...this.files.keys()],
      unlink: (name: string) => this.files.delete(name),
      importDb: async (name: string, bytes: Uint8Array) => {
        this.imports.push(name);
        await this.beforeImport?.(name);
        if (this.failImport?.(name) === true) throw new Error('Simulated disk full');
        this.files.set(name, bytes.slice());
      },
    } as unknown as SAHPoolUtil;
    this.sqlite = { ...sqlite, installOpfsSAHPoolVfs: vi.fn().mockResolvedValue(this.pool) };
  }
}
