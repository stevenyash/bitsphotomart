'use client';

import { useState, useEffect } from 'react';

interface Pricing {
  price_photo_from: string;
  price_hd_clip_from: string;
  price_4k_clip_from: string;
}

export function PricingSection() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (data.price_photo_from) {
          setPricing(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching pricing:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">Loading pricing...</div>;
  }

  if (!pricing) {
    return <div className="text-muted-foreground">No pricing configured</div>;
  }

  return (
    <ul className="space-y-2 text-[var(--foreground)]">
      <li><strong>Photos:</strong> from {Number(pricing.price_photo_from).toLocaleString()} KES</li>
      <li><strong>HD Clips:</strong> from {Number(pricing.price_hd_clip_from).toLocaleString()} KES</li>
      <li><strong>4K Clips:</strong> from {Number(pricing.price_4k_clip_from).toLocaleString()} KES</li>
    </ul>
  );
}
