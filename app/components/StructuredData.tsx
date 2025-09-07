interface StructuredDataProps {
  url: string;
  name: string;
  description: string;
  imageUrl: string;
}

export function StructuredData({ url, name, description, imageUrl }: StructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "description": description,
    "url": url,
    "image": imageUrl,
    "applicationCategory": "MusicApplication",
    "operatingSystem": "Web",
    "creator": {
      "@type": "Organization",
      "name": "BaseDrum Team"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "keywords": "onchain music, web3 beats, techno generator, NFT music, blockchain music",
    "audience": {
      "@type": "Audience",
      "audienceType": "Web3 enthusiasts, Music creators, NFT collectors"
    },
    "featureList": [
      "Generate personalized techno tracks from onchain data",
      "Transform wallet transactions into music patterns",
      "Mint music as NFTs",
      "Share beats on social platforms"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 