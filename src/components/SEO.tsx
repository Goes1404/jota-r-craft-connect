import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  title = 'JR Acessórios — Luxo e Tecnologia Exclusiva',
  description = 'Descubra a coleção exclusiva da JR Acessórios. Tecnologia de ponta, smartwatches e acessórios premium para o seu lifestyle de luxo.',
  image = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
  url = 'https://jracessorios.com.br',
  type = 'website',
  product,
}) => {
  const siteTitle = title.includes('JR Acessórios') ? title : `${title} | JR Acessórios`;

  const productJsonLd = product
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        brand: { '@type': 'Brand', name: product.brand || 'JR Acessórios' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BRL',
          price: product.price?.toFixed(2),
          availability: `https://schema.org/${product.availability ?? 'InStock'}`,
          seller: { '@type': 'Organization', name: 'JR Acessórios' },
        },
      })
    : null;

  const storeJsonLd = !product
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'JR Acessórios',
        description,
        url: 'https://jracessorios.com.br',
        image,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Rua Martim Afonso, 431',
          addressLocality: 'Osasco',
          addressRegion: 'SP',
          postalCode: '06233-130',
          addressCountry: 'BR',
        },
        telephone: '+55-11-99999-9999',
        priceRange: '$$',
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
      <meta property="og:site_name" content="JR Acessórios" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Mobile */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#0a0a0a" />

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
