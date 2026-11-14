import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

/** Runs before first paint so a saved dark choice never flashes light. The landing page stays light. */
const THEME_SCRIPT = `try{if(localStorage.getItem("theme")==="dark"&&location.pathname.indexOf("/welcome")!==0)document.documentElement.dataset.theme="dark"}catch(e){}`;

export const metadata: Metadata = {
  title: "Scroll to Spark",
  description:
    "Turn a moment of feeling helpless into one small, real thing you can do for your community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
