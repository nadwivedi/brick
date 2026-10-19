import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Opens a page's "add" form when the page is reached with ?new=1 (the dashboard quick actions),
 * once `ready` says the page has loaded what the form needs. The flag is then dropped from the
 * URL, so refreshing or going back does not open the form again.
 */
export default function useOpenOnNew(ready, open) {
  const [params, setParams] = useSearchParams();
  const wanted = params.get('new') === '1';

  useEffect(() => {
    if (!wanted || !ready) return;
    open();
    setParams(p => { p.delete('new'); return p; }, { replace: true });
  }, [wanted, ready]);
}
