'use client';

import { getStripe } from '@/lib/stripe'; // Adjust path
import { useState } from 'react';

export default function CheckoutButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    const response = await fetch('/api/checkout_sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const session = await response.json();
    const stripe = await getStripe();

    if (session.url && stripe) {
      window.location.href = session.url;
    } else {
      console.error('Não foi possivel carregar o Stripe ou URL comprometida.');
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Processing...' : 'Checkout'}
    </button>
  );
}