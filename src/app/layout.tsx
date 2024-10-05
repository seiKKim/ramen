import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Cash from "../app/cash/page";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lama Dev E-Commerce Application",
  description: "A complete e-commerce application with Next.js and Wix",
};

export default function RootLayout() {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Cash />
      </body>
    </html>
  );
}
