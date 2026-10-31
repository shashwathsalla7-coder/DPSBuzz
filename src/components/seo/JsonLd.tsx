import React from 'react';
import { getBaseUrl } from '@/lib/site-url';

export function JsonLd() {
  const baseUrl = getBaseUrl();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'DPSBus',
    legalName: 'DPSBus Student Community',
    alternateName: [
      'DPSBus',
      'DPS Bus',
      'DPS Buzz',
      'DPSBus School Social Media App',
      'DPS Buzz Community',
    ],
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icons/icon-512.png`,
      width: 512,
      height: 512,
      caption: 'DPSBus Official Logo',
    },
    image: `${baseUrl}/opengraph-image`,
    description:
      'DPSBus is the official school social media app and student community for students of classes 6 to 10.',
    knowsAbout: [
      'School Social Media App',
      'Student Community Platform',
      'Education Technology',
      'Child Online Safety',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      postalCode: '500060',
      addressCountry: 'IN',
    },
    sameAs: [
      'https://www.instagram.com/dpsbus',
      'https://twitter.com/dpsbus',
      'https://x.com/dpsbus',
      'https://github.com/dpsbus',
      'https://www.youtube.com/@dpsbus',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@dpsbus.in',
      url: `${baseUrl}/contact`,
      availableLanguage: ['English', 'Hindi', 'Telugu'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'DPSBus',
    alternateName: [
      'DPSBus',
      'DPS Bus',
      'DPS Buzz',
      'DPSBus Community',
      'DPSBus App',
    ],
    url: baseUrl,
    description:
      'DPSBus is the official school social media app and student network for classes 6 to 10.',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    inLanguage: 'en-IN',
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${baseUrl}/#software`,
    name: 'DPSBus',
    applicationCategory: 'SocialNetworkingApplication',
    applicationSubCategory: 'School Social Media App',
    operatingSystem: 'Android, iOS, Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description:
      'DPSBus is a safe, moderated school social media app for verified students in classes 6-10 to connect with classmates, collaborate on studies, and view school announcements.',
    url: `${baseUrl}/download`,
    author: {
      '@id': `${baseUrl}/#organization`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
    </>
  );
}

export default JsonLd;
