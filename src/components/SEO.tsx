import React from 'react';
import { Helmet } from 'react-helmet-async';
import { STORE } from '@/config/store';

interface ProductJsonLd {
  name: string;
  description?: string;
  image?: string;
  price?: number;
  availability?: 'InStock' | 'OutOfStock';
  brand?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  product?: ProductJsonLd;
}

const SEO: React.FC<SEOProps> = ({
  title = STORE.seo.defaultTitle,
  description = STORE.seo.defaultDescription,
  image = STORE.seo.defaultImage,
  url = STORE.domain,
  type = 'website',
  product,
}) => {
  const siteTitle = title.includes(STORE.name) ? title : `${title} | ${STORE.name}`;

  const productJsonLd = product
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        brand: { '@type': 'Brand', name: product.brand || STORE.name },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BRL',
          price: product.price?.toFixed(2),
          availability: `https://schema.org/${product.availability ?? 'InStock'}`,
          seller: { '@type': 'Organization', name: STORE.name },
        },
      })
    : null;

  const storeJsonLd = !product
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: STORE.name,
        description,
        url: STORE.domain,
        image,
        address: {
          '@type': 'PostalAddress',
          streetAddress: STORE.address.street,
          addressLocality: STORE.address.city,
          addressRegion: STORE.address.state,
          postalCode: STORE.address.zip,
          addressCountry: STORE.address.country,
        },
        telephone: STORE.contact.phone,
        priceRange: STORE.seo.priceRange,
      })
    : null;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content={STORE.name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Mobile */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content={STORE.theme.pwaTheme} />

      {/* JSON-LD Structured Data */}
      {productJsonLd && (
        <script type="application/ld+json">{productJsonLd}</script>
      )}
      {storeJsonLd && (
        <script type="application/ld+json">{storeJsonLd}</script>
      )}
    </Helmet>
  );
};

export default SEO;
