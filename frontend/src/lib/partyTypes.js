import { ShoppingCart, User } from 'lucide-react';

// The two kinds of party; each is still saved through its own endpoint
export const PARTY_TYPES = {
  customer: { label: 'Customer', hint: 'Buys bricks from you', icon: User, endpoint: '/customers' },
  vendor: { label: 'Vendor', hint: 'You buy raw material from them', icon: ShoppingCart, endpoint: '/vendors' },
};
