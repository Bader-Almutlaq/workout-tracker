import { database, useDatabaseQuery } from '../../data/database';
import { Section } from '../../design/components/Section';
import { MeasurementUnitPicker } from '../body/MeasurementUnitPicker';

/** Body measurement display units, stored with the database. */
export function UnitsSection() {
  const query = useDatabaseQuery('measurement-sites', () => database.measurementSites());
  return (
    <Section label="Units">
      {query.status === 'ready' ? (
        <MeasurementUnitPicker units={query.value.units} />
      ) : (
        <p>{query.status === 'loading' ? 'Loading units…' : query.message}</p>
      )}
    </Section>
  );
}
