import type { MeasurementGroup } from '../../../core/measurements/MeasurementQueries';
import { BottomSheet } from '../../design/components/BottomSheet';
import { Button } from '../../design/components/Button';

/** Hidden body parts become visible after their first log; custom creation reuses the existing editor. */
export function AddBodyPartSheet({
  groups,
  onChoose,
  onNew,
  onClose,
}: {
  readonly groups: readonly MeasurementGroup[];
  readonly onChoose: (key: string) => void;
  readonly onNew: () => void;
  readonly onClose: () => void;
}) {
  return (
    <BottomSheet title="Add body part" onClose={onClose}>
      {groups.map((group) => (
        <Button
          key={group.key}
          onPress={() => {
            const first = group.sites[0];
            if (first !== undefined) onChoose(first.site.key);
          }}
        >
          {group.name}
        </Button>
      ))}
      <Button onPress={onNew}>New body part…</Button>
      <Button onPress={onClose}>Cancel</Button>
    </BottomSheet>
  );
}
