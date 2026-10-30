import { ErrorBanner } from '../../design/components/ErrorBanner';
import { loggingQueue, useLoggingError } from './loggingQueue';

/** Shows why the last logging write failed, until dismissed or the next write. Shows nothing when all is well. */
export function LoggingErrorBanner() {
  const message = useLoggingError();
  if (message === undefined) return null;
  return <ErrorBanner message={message} onDismiss={() => loggingQueue.dismissError()} />;
}
