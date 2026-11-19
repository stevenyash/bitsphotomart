'use client';

import { useState, useEffect } from 'react';

interface Pricing {
  price_photo_from: string;
  price_hd_clip_from: string;
  price_4k_clip_from: string;
}

export function FooterPricing() {
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
    return (
      <ul className="space-y-1 text-muted-foreground">
        <li>Loading...</li>
        <li>Loading...</li>
        <li>Loading...</li>
      </ul>
    );
  }

  if (!pricing) {
    return (
      <ul className="space-y-1 text-muted-foreground">
        <li>No pricing configured</li>
        <li>No pricing configured</li>
        <li>No pricing configured</li>
      </ul>
    );
  }

  return (
    <ul className="space-y-1 text-muted-foreground">
      <li>Photos: from {Number(pricing.price_photo_from).toLocaleString()} KES</li>
      <li>HD Clips: from {Number(pricing.price_hd_clip_from).toLocaleString()} KES</li>
      <li>4K Clips: from {Number(pricing.price_4k_clip_from).toLocaleString()} KES</li>
    </ul>
  );
}
