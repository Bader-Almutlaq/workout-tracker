import { describe, expect, it } from 'vitest';
import { FileReadError, readPickedFiles, type FilePicker } from './readPickedFiles';

/** A picker that behaves like iOS Safari: clearing it makes every picked file unreadable. */
function safariPicker(names: readonly string[]): FilePicker & { readonly cleared: () => boolean } {
  let value = 'C:\\fakepath\\picked.csv';
  const files = names.map((name) => new File([`contents of ${name}`], name));
  return {
    files,
    get value() {
      return value;
    },
    set value(next: string) {
      value = next;
    },
    cleared: () => value === '',
  };
}

function readUnlessCleared(picker: { readonly cleared: () => boolean }) {
  return async (file: File) => {
    await Promise.resolve();
    if (picker.cleared()) throw new Error('The object can not be found here.');
    return { name: file.name, text: await file.text() };
  };
}

describe('readPickedFiles', () => {
  it('reads every file before clearing the picker (regression: iOS import failed)', async () => {
    const picker = safariPicker(['a.csv', 'b.csv']);
    const contents = await readPickedFiles(picker, readUnlessCleared(picker));
    expect(contents).toEqual([
      { name: 'a.csv', text: 'contents of a.csv' },
      { name: 'b.csv', text: 'contents of b.csv' },
    ]);
    expect(picker.value).toBe('');
  });

  it('clears the picker when a read fails, so the same file can be picked again', async () => {
    const picker = safariPicker(['bad.csv']);
    await expect(readPickedFiles(picker, () => Promise.reject(new Error('unreadable')))).rejects.toThrow('unreadable');
    expect(picker.value).toBe('');
  });

  it('names the file that could not be read', async () => {
    const picker = safariPicker(['good.csv', 'bad.csv']);
    const read = (file: File) =>
      file.name === 'bad.csv' ? Promise.reject(new Error('The object can not be found here.')) : file.text();
    const failure = readPickedFiles(picker, read);
    await expect(failure).rejects.toBeInstanceOf(FileReadError);
    await expect(failure).rejects.toThrow('"bad.csv" (The object can not be found here.)');
  });

  it('returns nothing for an empty pick', async () => {
    const picker = safariPicker([]);
    expect(await readPickedFiles(picker, readUnlessCleared(picker))).toEqual([]);
    expect(picker.value).toBe('');
  });
});
