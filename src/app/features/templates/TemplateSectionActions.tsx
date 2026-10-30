import { FolderPlus, Plus } from 'lucide-react';
import { Button } from '../../design/components/Button';
import { LinkButton } from '../../design/components/LinkButton';
import { NEW_TEMPLATE_PATH } from './templatePaths';
import styles from './TemplateSectionActions.module.css';

/** The two quiet buttons at the end of the template list: New template and New folder. */
export function TemplateSectionActions({ onNewFolder }: { readonly onNewFolder: () => void }) {
  return (
    <div className={styles.actions}>
      <LinkButton to={NEW_TEMPLATE_PATH}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        New template
      </LinkButton>
      <Button onPress={onNewFolder}>
        <FolderPlus size={16} strokeWidth={2} aria-hidden />
        New folder
      </Button>
    </div>
  );
}
