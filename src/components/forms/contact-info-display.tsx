'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactInfo {
  platform_email: string;
  platform_phone: string;
  platform_address: string;
}

export function ContactInfoDisplay() {
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
    return <div className="text-muted-foreground">Loading contact info...</div>;
  }

  if (!contact) {
    return <div className="text-muted-foreground">No contact info configured</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">Email</p>
          <p className="text-muted-foreground">{contact.platform_email}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Phone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">Phone</p>
          <p className="text-muted-foreground">{contact.platform_phone}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">Location</p>
          <p className="text-muted-foreground">{contact.platform_address}</p>
        </div>
      </div>
    </div>
  );
}
