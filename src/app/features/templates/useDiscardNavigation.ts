import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { TemplateDraft } from '../../../core/templates/TemplateDraft';

/** Guards the editor's links and tabs when the draft differs from its initial saved state. */
export function useDiscardNavigation(initial: TemplateDraft, draft: TemplateDraft) {
  const navigate = useNavigate();
  const [destination, setDestination] = useState<string | undefined>(undefined);
  const isDirty = JSON.stringify(initial) !== JSON.stringify(draft);

  useEffect(() => {
    if (!isDirty) return;
    const intercept = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a');
      if (link === null || link.target !== '' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      if (base !== '' && url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return;
      event.preventDefault();
      event.stopPropagation();
      setDestination(`${url.pathname.slice(base.length) || '/'}${url.search}${url.hash}`);
    };
    document.addEventListener('click', intercept, true);
    return () => document.removeEventListener('click', intercept, true);
  }, [isDirty]);

  return {
    pending: destination !== undefined,
    keepEditing: () => setDestination(undefined),
    discard: () => {
      if (destination !== undefined) navigate(destination);
    },
  };
}
