import type { Metadata } from "next";
import "./globals.css";
import ChatbotProvider from "@/components/ChatbotProvider";

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
                {children}
                <ChatbotProvider />
            </body>
        </html>
    );
}
