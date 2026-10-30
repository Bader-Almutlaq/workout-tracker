import { EmptyState } from '../../design/components/EmptyState';
import { LinkButton } from '../../design/components/LinkButton';
import styles from './NoMatch.module.css';

/** Shown when a search finds nothing: says so and offers to create the typed name as the owner's own exercise. */
export function NoMatch({ query }: { readonly query: string }) {
  if (query === '') return <EmptyState message="No exercise fits these filters." />;
  return (
    <div className={styles.box}>
      <EmptyState message={`No match. Try another name, or create “${query}”.`} />
      <LinkButton to={`/exercises/new?name=${encodeURIComponent(query)}`}>Create “{query}”</LinkButton>
    </div>
  );
}
