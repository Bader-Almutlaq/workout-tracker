/** The parts of an `<input type="file">` that reading a pick needs. */
export interface FilePicker {
  readonly files: ArrayLike<File> | null;
  value: string;
}

/** A picked file that the phone could not read. The message names the file and says what to try. */
export class FileReadError extends Error {
  readonly kind = 'fileRead';

  constructor(
    readonly fileName: string,
    override readonly cause: unknown,
  ) {
    const reason = cause instanceof Error ? ` (${cause.message})` : '';
    super(
      `The phone couldn't read "${fileName}"${reason}. Choose the files again. If they are in iCloud Drive, ` +
        'open them once in the Files app so they download, or move them to On My iPhone.',
    );
  }
}

/**
 * Reads every file chosen in a file picker, then clears the picker so the same file can be chosen again.
 *
 * iOS Safari deletes its copies of the picked files as soon as the picker is cleared, and reading them
 * afterwards fails with "The object can not be found here." So the picker is cleared only once every read
 * has finished, including when a read fails. Capture the picker before any `await`: React clears
 * `event.currentTarget` once the handler returns.
 * @throws FileReadError naming the first file that could not be read.
 */
export async function readPickedFiles<Contents>(
  picker: FilePicker,
  read: (file: File) => Promise<Contents>,
): Promise<Contents[]> {
  const files = Array.from(picker.files ?? []);
  try {
    return await Promise.all(
      files.map((file) =>
        read(file).catch((error: unknown) => {
          throw new FileReadError(file.name, error);
        }),
      ),
    );
  } finally {
    picker.value = '';
  }
}
