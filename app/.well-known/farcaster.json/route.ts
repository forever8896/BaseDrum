function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://base-drum.vercel.app";
  const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "BaseDrum";
  const description = "Create personalized techno tracks from your onchain data. Transform wallet activity into unique music and mint as NFTs!";

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    baseBuilder: {
      allowedAddresses: process.env.BASE_BUILDER_ALLOWED_ADDRESSES ? 
        process.env.BASE_BUILDER_ALLOWED_ADDRESSES.split(',') : 
        []
    },
    frame: withValidProperties({
      version: "1",
      name: appName,
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || "Onchain Music Generator",
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || description,
      screenshotUrls: [
        process.env.NEXT_PUBLIC_APP_SCREENSHOT || `${baseUrl}/screenshot.png`
      ],
      iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `${baseUrl}/icon.png`,
      splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${baseUrl}/splash.png`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
      homeUrl: baseUrl,
      webhookUrl: `${baseUrl}/api/webhook`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || "music",
      tags: [
        "techno",
        "beats", 
        "onchain",
        "generator",
        "web3"
      ],
      heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${baseUrl}/hero.png`,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Your onchain data, your beat",
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || `${appName} - Onchain Music Generator`,
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || description,
      ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${baseUrl}/hero.png`,
      noindex: process.env.NODE_ENV !== 'production',
    }),
  });
}
