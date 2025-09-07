import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Orbitron, Exo_2 } from "next/font/google";
import { StructuredData } from "./components/StructuredData";

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
  weight: ["400", "900"],
});

const exo2 = Exo_2({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-exo-2",
  weight: ["400", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://base-drum.vercel.app";
  const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "BaseDrum";
  const description = "Create personalized techno tracks from your onchain data. Transform wallet activity into unique music and mint as NFTs!";
  const ogImageUrl = process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${baseUrl}/hero.png`;
  
  return {
    title: {
      default: `${appName} - Onchain Music Generator`,
      template: `%s | ${appName}`,
    },
    description,
    keywords: [
      "onchain music",
      "web3 beats",
      "techno generator", 
      "NFT music",
      "Base blockchain",
      "crypto music",
      "data driven music",
      "personalized beats"
    ],
    authors: [{ name: "BaseDrum Team" }],
    creator: "BaseDrum",
    publisher: "BaseDrum",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      title: `${appName} - Onchain Music Generator`,
      description,
      siteName: appName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${appName} - Create personalized techno tracks from your onchain data`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${appName} - Onchain Music Generator`, 
      description,
      images: [ogImageUrl],
      creator: "@basedrum",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${baseUrl}/hero.png`,
        button: {
          title: `Launch ${appName}`,
          action: {
            type: "launch_frame",
            name: appName,
            url: baseUrl,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE || `${baseUrl}/splash.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#000000",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://base-drum.vercel.app";
  const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "BaseDrum";
  const description = "Create personalized techno tracks from your onchain data. Transform wallet activity into unique music and mint as NFTs!";
  const ogImageUrl = process.env.NEXT_PUBLIC_APP_OG_IMAGE || `${baseUrl}/hero.png`;

  return (
    <html lang="en" className={`${orbitron.variable} ${exo2.variable}`} suppressHydrationWarning>
      <head>
        <StructuredData 
          url={baseUrl}
          name={appName}
          description={description}
          imageUrl={ogImageUrl}
        />
      </head>
      <body className="bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
