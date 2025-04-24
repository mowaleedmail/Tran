import "./styles/globals.css";
import Header from "@/components/header";
import type { Metadata, Viewport } from "next";
import { Rubik, Roboto } from "next/font/google";

// Initialize Rubik font
const rubik = Rubik({
  subsets: ["latin", "arabic"],
  variable: "--font-rubik",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Initialize Roboto font
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Tran - Translation Application",
  description: "Powerful translation app with advanced features",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tran",
  },
  icons: [
    { rel: "apple-touch-icon", sizes: "180x180", url: "/icons/icon-180x180.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/icons/icon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/icons/icon-16x16.png" },
    { rel: "mask-icon", url: "/icons/icon-512x512.png", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="auto">
      <head>
        <meta name="application-name" content="Tran" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white" />
        <meta name="apple-mobile-web-app-title" content="Tran" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
        
        {/* iOS splash screens */}
        {/* iPhone SE, 5s, 5c, 5 */}
        <link rel="apple-touch-startup-image" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" href="/icons/icon-512x512.png" />
        {/* iPhone 6s, 6, 7, 8 */}
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/icons/icon-512x512.png" />
        {/* iPhone 6s Plus, 6 Plus, 7 Plus, 8 Plus, X, XS, XR */}
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" href="/icons/icon-512x512.png" />
        {/* iPhone XS Max */}
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" href="/icons/icon-512x512.png" />
        {/* iPad Pro 10.5" */}
        <link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" href="/icons/icon-512x512.png" />
        {/* iPad Pro 11" */}
        <link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" href="/icons/icon-512x512.png" />
        {/* iPad Pro 12.9" */}
        <link rel="apple-touch-startup-image" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" href="/icons/icon-512x512.png" />
        
        <script src="/sw-register.js" defer></script>
      </head>
      <body
        className={`${rubik.variable} ${roboto.variable} min-h-svh bg-neutral-100 font-rubik font-normal antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
