'use client';

import { useState, useEffect } from 'react';

interface Pricing {
  price_photo_from: string;
  price_hd_clip_from: string;
  price_4k_clip_from: string;
}

export function PricingDisplay() {
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
      <section className="bg-secondary py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground">Loading pricing...</p>
        </div>
      </section>
    );
  }

  if (!pricing) {
    return (
      <section className="bg-secondary py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground">No pricing configured</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-secondary py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-primary font-bold text-lg">Photos</p>
            <p className="text-foreground">From KES {Number(pricing.price_photo_from).toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-primary font-bold text-lg">HD Clips</p>
            <p className="text-foreground">From KES {Number(pricing.price_hd_clip_from).toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-primary font-bold text-lg">4K Clips</p>
            <p className="text-foreground">From KES {Number(pricing.price_4k_clip_from).toLocaleString()}</p>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-primary font-bold text-lg">Extended Licenses</p>
            <p className="text-foreground">Request a quote</p>
          </div>
        </div>
      </div>
    </section>
  );
}
