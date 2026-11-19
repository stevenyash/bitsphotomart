'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactInfo {
  platform_email: string;
  platform_phone: string;
  platform_address: string;
}

export function FooterContactInfo() {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pricing/contact')
      .then(res => res.json())
      .then(data => {
        if (data.platform_email) {
          setContact(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching contact:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Loading...</span>
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>Loading...</span>
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Loading...</span>
        </li>
      </ul>
    );
  }

  if (!contact) {
    return (
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>No email configured</span>
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>No phone configured</span>
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>No address configured</span>
        </li>
      </ul>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      <li className="flex items-center gap-2 text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>{contact.platform_email}</span>
      </li>
      <li className="flex items-center gap-2 text-muted-foreground">
        <Phone className="h-4 w-4" />
        <span>{contact.platform_phone}</span>
      </li>
      <li className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{contact.platform_address}</span>
      </li>
    </ul>
  );
}
