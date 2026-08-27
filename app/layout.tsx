import type { Metadata } from "next";
import { Archivo, Poppins } from "next/font/google";
import "./globals.css";

// Stands in for Acumin Pro, the Adobe face the live site uses for headings.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

// The live site's actual body face, at the weights it actually uses.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Stage Point Capital, LLC",
    template: "%s | Stage Point Capital",
  },
  description:
    "Stage Point Capital, LLC is a private investment firm, founded by a New York-based single-family office in 2013, providing investments in commercial and residential real estate, management, and direct lending.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${poppins.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-slate">
        {children}
      </body>
    </html>
  );
}
