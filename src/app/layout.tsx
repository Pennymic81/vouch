import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Vouch — Get your project built, and know it's built right",
    template: "%s · Vouch",
  },
  description:
    "Describe your idea in plain words. Vouch turns it into a clear plan, matches you with a proven developer or AI engineer, and checks every milestone before you pay.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
