import { Banknote, Smartphone, Landmark, ScrollText } from 'lucide-react';

// Ways money can be received from a customer or paid to a vendor
export const PAYMENT_MODES = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'upi', label: 'UPI', icon: Smartphone },
  { key: 'bank_transfer', label: 'Bank', icon: Landmark },
  { key: 'cheque', label: 'Cheque', icon: ScrollText },
];
