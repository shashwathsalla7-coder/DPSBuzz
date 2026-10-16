import React from 'react';

export function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DPS Buzz',
    alternateName: ['DPS Buzz App', 'Dilsukhnagar Public School Buzz', 'DPS Social'],
    url: 'https://dpsbuzz.netlify.app',
    description:
      'The private and vibrant student social network for Dilsukhnagar Public School (DPS). Connect with classmates, share school moments, track notices, and download the official Android APK.',
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'Dilsukhnagar Public School',
      url: 'https://dpsbuzz.netlify.app',
      logo: 'https://dpsbuzz.netlify.app/icons/icon-512.png',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://dpsbuzz.netlify.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const schoolSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Dilsukhnagar Public School',
    alternateName: 'DPS Dilsukhnagar',
    url: 'https://dpsbuzz.netlify.app',
    logo: 'https://dpsbuzz.netlify.app/icons/icon-512.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      addressCountry: 'IN',
    },
    description: 'Premier educational institution in Hyderabad, Telangana.',
  };

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'DPS Buzz',
    operatingSystem: 'Android',
    applicationCategory: 'SocialNetworkingApplication',
    downloadUrl: 'https://dpsbuzz.netlify.app/download',
    fileFormat: 'application/vnd.android.package-archive',
    fileSize: '12.3MB',
    softwareVersion: '1.4',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '150',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
    </>
  );
}

export default JsonLd;
