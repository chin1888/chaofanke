import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export const defaultSEO = {
  title: 'ALWAHA - Premium Elektro-Shisha ohne Kompromisse',
  description: '德国高端电子烟品牌，首款无碳电子烟，5分钟快速启动，94%更少有害物质。探索设备、烟弹和配件。',
  keywords: 'ALWAHA,电子烟,Shisha,无碳电子烟,高端电子烟,电子烟设备,烟弹,德国品牌',
  ogImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
};

export function updateSEO(props: SEOProps) {
  const { title, description, keywords, ogImage, canonical } = props;
  
  if (title) {
    document.title = title;
  }
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && description) {
    metaDescription.setAttribute('content', description);
  }
  
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords && keywords) {
    metaKeywords.setAttribute('content', keywords);
  }
  
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && title) {
    ogTitle.setAttribute('content', title);
  }
  
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && description) {
    ogDesc.setAttribute('content', description);
  }
  
  const ogImageMeta = document.querySelector('meta[property="og:image"]');
  if (ogImageMeta && ogImage) {
    ogImageMeta.setAttribute('content', ogImage);
  }
  
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink && canonical) {
    canonicalLink.setAttribute('href', canonical);
  }
}

export function SEO({ title, description, keywords, ogImage, canonical }: SEOProps) {
  React.useEffect(() => {
    updateSEO({ title, description, keywords, ogImage, canonical });
  }, [title, description, keywords, ogImage, canonical]);
  
  return null;
}

export default SEO;
