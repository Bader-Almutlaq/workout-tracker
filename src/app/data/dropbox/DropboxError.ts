/** A safe, owner-readable Dropbox failure; never includes response bodies, codes, or credentials. */
export class DropboxError extends Error {
  override readonly name = 'DropboxError';

  constructor(
    readonly kind: 'connection' | 'code' | 'revoked' | 'storage' | 'response',
    message: string,
  ) {
    super(message);
  }
}
