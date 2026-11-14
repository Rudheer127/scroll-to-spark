import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

/**
 * Runs before first paint so a saved dark choice never flashes light, and a collapsed sidebar
 * never flashes open. The landing page follows the theme too.
 */
const HEAD_SCRIPT = `try{var d=document.documentElement;if(localStorage.getItem("theme")==="dark")d.dataset.theme="dark";if(localStorage.getItem("sidebar")==="collapsed")d.dataset.sidebar="collapsed"}catch(e){}`;

export const metadata: Metadata = {
  title: "Scroll to Spark",
  description:
    "Turn a moment of feeling helpless into one small, real thing you can do for your community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
