"use client";

import * as React from "react";
import { ResidateAI } from "@/lib/residate-ai";
import { cn } from "@/lib/utils";
import { X, Send, RotateCcw } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

// Simple markdown-like renderer for bold text and line breaks
function renderMessage(text: string) {
    const parts = text.split(/(\*\*.*?\*\*|\n|•)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="font-semibold" style={{ color: "#1a2342" }}>{part.slice(2, -2)}</strong>;
        }
        if (part === "\n") return <br key={i} />;
        if (part === "•") return <span key={i} style={{ color: "#c9a84c", marginRight: "4px" }}>•</span>;
        return <span key={i}>{part}</span>;
    });
}

export default function AureliaChatbot() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [input, setInput] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    const [hasGreeted, setHasGreeted] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const aiRef = React.useRef<ResidateAI | null>(null);

    // Ensure component only renders client-side
    React.useEffect(() => {
        setMounted(true);
        aiRef.current = new ResidateAI();
    }, []);

    // Update AI context when page changes
    React.useEffect(() => {
        if (aiRef.current && mounted) {
            aiRef.current.updateContext({ currentPage: window.location.pathname });
        }
    }, [mounted]);

    // Auto-scroll to bottom
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Focus input when chat opens
    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Mensaje de bienvenida al abrir por primera vez
    React.useEffect(() => {
        if (isOpen && !hasGreeted && messages.length === 0) {
            setIsTyping(true);
            const hour = new Date().getHours();
            const saludo = hour < 12 ? "¡Buenos días" : hour < 20 ? "¡Buenas tardes" : "¡Buenas noches";

            setTimeout(() => {
                setMessages([{
                    role: "assistant",
                    content: `${saludo}! 🤍 Soy **Aurelia**, tu asistente personal en ResiDate.\n\nPuedo ayudarte con:\n• Reservas y citas\n• Panel de control y negocio\n• Configuración de Smart Reserve™\n• Cualquier pregunta o tema que quieras explorar\n\n¿En qué puedo ayudarte?`,
                    timestamp: Date.now(),
                }]);
                setIsTyping(false);
                setHasGreeted(true);
            }, 800);
        }
    }, [isOpen, hasGreeted, messages.length]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || !aiRef.current) return;

        // Update page context before processing
        aiRef.current.updateContext({ currentPage: window.location.pathname });

        const userMessage: Message = {
            role: "user",
            content: trimmed,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        try {
            // Small delay for natural feel, then await async AI response
            await new Promise(r => setTimeout(r, Math.min(300 + trimmed.length * 10, 800)));
            const response = await aiRef.current!.process(trimmed);

            const assistantMessage: Message = {
                role: "assistant",
                content: response,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            console.error("Aurelia error:", err);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Vaya, ha ocurrido un error al procesar tu mensaje. ¿Puedes intentarlo de nuevo? 🔧",
                timestamp: Date.now(),
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReset = () => {
        if (aiRef.current) {
            aiRef.current.reset();
        }
        setMessages([]);
        setHasGreeted(false);
    };

    if (!mounted) return null;

    return (
        <>
            {/* Floating Button - using inline styles for guaranteed rendering */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                id="aurelia-toggle"
                aria-label={isOpen ? "Cerrar chat" : "Abrir asistente Aurelia"}
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 99999,
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isOpen ? "1px solid rgba(26,35,66,0.1)" : "none",
                    cursor: "pointer",
                    backgroundColor: isOpen ? "#ffffff" : "#1a2342",
                    color: isOpen ? "#1a2342" : "#ffffff",
                    boxShadow: "0 8px 32px rgba(26,35,66,0.35)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isOpen ? "scale(0.9)" : "scale(1)",
                    padding: 0,
                }}
            >
                {isOpen ? (
                    <X style={{ width: "20px", height: "20px" }} />
                ) : (
                    <svg viewBox="0 0 24 24" style={{ width: "28px", height: "28px" }} fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C6.48 2 2 5.58 2 10c0 2.24 1.12 4.27 2.94 5.72L4 20l4.28-2.14C9.47 18.29 10.7 18.5 12 18.5c5.52 0 10-3.58 10-8S17.52 2 12 2z" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="7.5" y="13" fill="currentColor" fontSize="7" fontFamily="serif" fontWeight="bold" stroke="none">R</text>
                    </svg>
                )}
            </button>

            {/* Pulse ring behind button */}
            {!isOpen && (
                <span
                    style={{
                        position: "fixed",
                        bottom: "24px",
                        right: "24px",
                        zIndex: 99998,
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(201, 168, 76, 0.15)",
                        pointerEvents: "none",
                        animation: "aurelia-ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
                    }}
                />
            )}

            {/* Keyframes injected via globals.css */}

            {/* Chat Window */}
            <div
                style={{
                    position: "fixed",
                    bottom: "96px",
                    right: "24px",
                    zIndex: 99999,
                    width: "380px",
                    maxWidth: "calc(100vw - 2rem)",
                    height: "520px",
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(26,35,66,0.08)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "4px",
                    overflow: "hidden",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "scale(1) translateY(0)" : "scale(0.95) translateY(12px)",
                    pointerEvents: isOpen ? "auto" : "none",
                    transformOrigin: "bottom right",
                }}
            >
                {/* Header */}
                <div style={{
                    backgroundColor: "#1a2342",
                    color: "#ffffff",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#c9a84c",
                            fontFamily: "serif",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}>
                            A
                        </div>
                        <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 500, margin: 0, letterSpacing: "0.5px" }}>Aurelia</h4>
                            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px", opacity: 0.4, margin: 0 }}>Asistente ResiDate</p>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        title="Reiniciar conversación"
                        style={{
                            backgroundColor: "transparent",
                            border: "none",
                            color: "rgba(255,255,255,0.3)",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        <RotateCcw style={{ width: "14px", height: "14px" }} />
                    </button>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    backgroundColor: "#faf8f5",
                }}>
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: "85%",
                                    padding: "12px 16px",
                                    fontSize: "13px",
                                    lineHeight: 1.6,
                                    borderRadius: msg.role === "user" ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                                    backgroundColor: msg.role === "user" ? "#1a2342" : "#ffffff",
                                    color: msg.role === "user" ? "#ffffff" : "rgba(26,35,66,0.75)",
                                    border: msg.role === "user" ? "none" : "1px solid rgba(26,35,66,0.05)",
                                    boxShadow: msg.role === "assistant" ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
                                }}
                            >
                                {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                            <div style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid rgba(26,35,66,0.05)",
                                borderRadius: "2px 12px 12px 12px",
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            }}>
                                <span className="animate-bounce" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "rgba(26,35,66,0.25)", animationDelay: "0ms" }} />
                                <span className="animate-bounce" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "rgba(26,35,66,0.25)", animationDelay: "150ms" }} />
                                <span className="animate-bounce" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "rgba(26,35,66,0.25)", animationDelay: "300ms" }} />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(26,35,66,0.05)",
                    backgroundColor: "#ffffff",
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pregúntale lo que quieras a Aurelia..."
                            disabled={isTyping}
                            style={{
                                flex: 1,
                                backgroundColor: "rgba(250,248,245,0.5)",
                                border: "1px solid rgba(26,35,66,0.06)",
                                padding: "10px 16px",
                                fontSize: "13px",
                                color: "#1a2342",
                                borderRadius: "2px",
                                outline: "none",
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            style={{
                                width: "40px",
                                height: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "none",
                                cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                                borderRadius: "2px",
                                backgroundColor: input.trim() && !isTyping ? "#1a2342" : "rgba(26,35,66,0.05)",
                                color: input.trim() && !isTyping ? "#ffffff" : "rgba(26,35,66,0.2)",
                                transition: "all 0.2s",
                            }}
                        >
                            <Send style={{ width: "16px", height: "16px" }} />
                        </button>
                    </div>
                    <p style={{
                        fontSize: "9px",
                        textAlign: "center",
                        marginTop: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        color: "rgba(26,35,66,0.15)",
                        userSelect: "none",
                    }}>Impulsado por ResiDate AI</p>
                </div>
            </div>
        </>
    );
}
