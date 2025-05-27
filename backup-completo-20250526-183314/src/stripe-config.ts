export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
}

export const products: Product[] = [
  {
    id: 'prod_SH4WCuyg3VxWGq',
    priceId: 'price_1RMWNEH2pA9wm7hmFdDemhl4',
    name: 'GamePath AI - Alliance',
    description: 'Enterprise solution for teams of up to 5 players. Includes all premium features, business analytics, 24/7 support, and Advanced Optimizer.',
    mode: 'subscription'
  },
  {
    id: 'prod_SH4T95DqSD3LNq',
    priceId: 'price_1RMWKnH2pA9wm7hmLpmpGkn5',
    name: 'GamePath AI - Co-op',
    description: 'Premium gaming solution for up to 2 players with advanced route optimization, detailed analytics, and priority support. VPN Integration included.',
    mode: 'subscription'
  },
  {
    id: 'prod_SH4PyIZexMLbI2',
    priceId: 'price_1RMWH0H2pA9wm7hmJBlbDQJD',
    name: 'GamePath AI - Player',
    description: 'Basic AI-powered game optimization for individual players. Includes intelligent routing, performance enhancement, and access to global servers.',
    mode: 'subscription'
  }
];