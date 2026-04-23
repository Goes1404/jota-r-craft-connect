import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title = 'JR Acessórios — Luxo e Tecnologia Exclusiva', 
  description = 'Descubra a coleção exclusiva da JR Acessórios. Tecnologia de ponta, smartwatches e acessórios premium para o seu lifestyle de luxo.', 
  image = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
  url = 'https://jracessorios.com.br',
  type = 'website'
}) => {
  const siteTitle = title.includes('JR Acessórios') ? title : `${title} | JR Acessórios`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Mobile App */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#0a0a0a" />
    </Helmet>
  );
};

export default SEO;
