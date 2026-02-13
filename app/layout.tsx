import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ResiDate | Timeless Experiences",
    description: "The premium platform for managing your time and appointments.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <h1 className="text-2xl font-bold uppercase tracking-widest font-serif">ResiDate</h1>
                {children}
            </body>
        </html>
    );
}
