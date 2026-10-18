import React from 'react';
import { getBaseUrl } from '@/lib/site-url';

export function JsonLd() {
  const baseUrl = getBaseUrl();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DPS Buzz',
    alternateName: ['DPS Buzz Community', 'DPS Buzz App'],
    url: baseUrl,
    description:
      'A student community website for students of classes 6 to 10 at Dilsukhnagar Public School, Hyderabad, India.',
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DPS Buzz',
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512.png`,
    description:
      'Student community platform for Dilsukhnagar Public School students in Hyderabad, India.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      addressCountry: 'IN',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}

export default JsonLd;
