import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ReservaPro | Timeless Experiences",
    description: "The premium platform for managing your time and appointments.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
