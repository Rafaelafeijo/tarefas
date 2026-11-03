import type { Metadata } from "next";
import { Anek_Latin, Roboto, Sora } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc/provider";
import "./globals.css";

const anekLatin = Anek_Latin({ variable: "--font-anek-latin", subsets: ["latin"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tasks",
  description: "A simple task manager.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${anekLatin.variable} ${roboto.variable} ${sora.variable} antialiased`}>
        <TRPCProvider>
          <main className="mx-auto max-w-3xl px-[15px] py-[30px]">{children}</main>
        </TRPCProvider>
      </body>
    </html>
  );
}
