'use client';

import { useState, useEffect } from 'react';

interface PaymentSettings {
  enable_mpesa: boolean;
  enable_stripe: boolean;
}

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>({
    enable_mpesa: true,
    enable_stripe: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          enable_mpesa: data.enable_mpesa === 'true',
          enable_stripe: data.enable_stripe === 'true',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
