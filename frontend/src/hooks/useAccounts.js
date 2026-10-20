import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * The business's cash and bank accounts with their balance now, for "Received In" / "Paid From"
 * pickers. The default account comes first and is the one pickers start on.
 */
export default function useAccounts() {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    let ignore = false;
    api.get('/accounts/summary')
      .then(res => { if (!ignore) setAccounts(res.data?.accounts || []); })
      .catch(console.error);
    return () => { ignore = true; };
  }, []);

  const defaultAccountId = (accounts.find(a => a.isDefault) || accounts[0])?._id || '';
  return { accounts, defaultAccountId };
}
