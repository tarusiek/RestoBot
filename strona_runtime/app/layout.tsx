import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
});

const inter = Inter({ 
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Bistro Warszawa Cafe | Nowoczesna Kuchnia Premium",
  description: "Odkryj harmonię smaków w sercu Warszawy. Bistro Warszawa Cafe to miejsce, gdzie tradycja spotyka się z nowoczesnością. Rezerwacje: 22 854 17 48.",
  keywords: ["restauracja warszawa", "bistro warszawa cafe", "jedzenie warszawa", "premium dining", "al jerozolimskie"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${playfair.variable} ${inter.variable} dark scroll-smooth`}>
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        {children}
      </body>
    </html>
  );
}
