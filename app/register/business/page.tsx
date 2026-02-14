"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useBusinessStore } from "@/lib/store";

export default function BusinessRegistrationPage() {
    const { addBusiness } = useBusinessStore();
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
        businessName: "",
        location: "",
        email: "",
        category: "wellness",
        description: "",
        services: [
            { id: '1', name: 'Signature Service', price: 150, duration: 60 }
        ]
    });
    const [error, setError] = React.useState<string | null>(null);

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (step === 3) {
            // Save business to the persistent store
            const result = await addBusiness({
                name: formData.businessName,
                location: formData.location,
                category: formData.category,
                description: formData.description,
                email: formData.email,
                services: formData.services
            });

            if (result && 'error' in result && result.error) {
                setError(result.error);
                setStep(1); // Go back to where email is shown
                return;
            }

            // Also keep the simple greeting name
            localStorage.setItem('registered_business_name', formData.businessName);
        }
        setStep(step + 1);
    };

    const addService = () => {
        const newService = {
            id: Math.random().toString(36).substring(2, 9),
            name: "",
            price: 0,
            duration: 60
        };
        setFormData({ ...formData, services: [...formData.services, newService] });
    };

    const updateService = (id: string, field: string, value: any) => {
        const next = formData.services.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        );
        setFormData({ ...formData, services: next });
    };

    const removeService = (id: string) => {
        if (formData.services.length <= 1) return;
        setFormData({ ...formData, services: formData.services.filter(s => s.id !== id) });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col">
            <header className="py-8 px-4 md:px-12 border-b border-navy/5 bg-white">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-navy hover:opacity-70 transition-opacity">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-widest">Back to Discovery</span>
                    </Link>
                    <div className="text-xl font-serif uppercase tracking-widest text-navy">Partner Portal</div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <div className="w-full max-w-2xl bg-white shadow-2xl p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">

                    {/* Stepper */}
                    <div className="flex justify-between items-center mb-12">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step >= s ? "bg-navy border-navy text-white" : "border-navy/10 text-navy/30"
                                    }`}>
                                    {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                                </div>
                                {s < 4 && <div className={`w-12 md:w-16 h-px mx-2 ${step > s ? "bg-navy" : "bg-navy/10"}`} />}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif text-navy">Welcome, Partner</h2>
                                <p className="text-slate font-light">Let's begin by establishing your sanctuary's core identity.</p>
                            </div>
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest font-bold text-navy opacity-60">Business Name</label>
                                    <input
                                        required
                                        className="w-full bg-cream border-b border-navy/20 py-4 px-0 focus:outline-none focus:border-navy transition-all text-lg font-light placeholder:opacity-30"
                                        placeholder="e.g., Azure Retreat"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest font-bold text-navy opacity-60">Location</label>
                                    <input
                                        required
                                        className="w-full bg-cream border-b border-navy/20 py-4 px-0 focus:outline-none focus:border-navy transition-all text-lg font-light placeholder:opacity-30"
                                        placeholder="e.g., Santorini • Greece"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest font-bold text-navy opacity-60">Business Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full bg-cream border-b border-navy/20 py-4 px-0 focus:outline-none focus:border-navy transition-all text-lg font-light placeholder:opacity-30"
                                        placeholder="partner@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 text-sm border-l-4 border-red-600 animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}
                                <Button size="lg" className="w-full btn-hero mt-8">Continue Onboarding</Button>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif text-navy">Define Your Essence</h2>
                                <p className="text-slate font-light">Describe what makes your experience extraordinary.</p>
                            </div>
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest font-bold text-navy opacity-60">Category</label>
                                    <select
                                        className="w-full bg-cream border-b border-navy/20 py-4 px-0 focus:outline-none focus:border-navy transition-all text-lg font-light appearance-none"
                                        value={formData.category === 'wellness' || formData.category === 'adventure' || formData.category === 'urban' || formData.category === 'private' ? formData.category : 'other'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, category: val === 'other' ? "" : val });
                                        }}
                                    >
                                        <option value="wellness">Wellness & Spa</option>
                                        <option value="adventure">Adventure & Nature</option>
                                        <option value="urban">Urban Luxury</option>
                                        <option value="private">Private Islands</option>
                                        <option value="other">Other...</option>
                                    </select>
                                </div>
                                {(formData.category === "" || !['wellness', 'adventure', 'urban', 'private'].includes(formData.category)) && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs uppercase tracking-widest font-bold text-navy opacity-60">Custom Category</label>
                                        <input
                                            required
                                            className="w-full bg-cream border-b border-navy/20 py-4 px-0 focus:outline-none focus:border-navy transition-all text-lg font-light placeholder:opacity-30"
                                            placeholder="e.g., Boutique Vineyard"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest font-bold text-navy opacity-60">Description</label>
                                    <textarea
                                        required
                                        className="w-full bg-cream border-b border-navy/20 py-4 px-0 focus:outline-none focus:border-navy transition-all text-lg font-light placeholder:opacity-30 h-32 resize-none"
                                        placeholder="Tell your story..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 text-sm border-l-4 border-red-600 animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <Button type="button" variant="ghost" className="w-1/3" onClick={() => setStep(1)}>Back</Button>
                                    <Button size="lg" className="w-2/3 btn-hero">Next: Curate Menu</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif text-navy">Curate Your Menu</h2>
                                <p className="text-slate font-light">Define the experiences and rituals you offer.</p>
                            </div>
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {formData.services.map((service, index) => (
                                        <div key={service.id} className="p-6 bg-cream border border-navy/5 space-y-4 relative group animate-in fade-in slide-in-from-bottom-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-navy opacity-40">Service Name</label>
                                                    <input
                                                        required
                                                        placeholder="e.g., Volcanic Stone Ritual"
                                                        className="w-full bg-transparent border-b border-navy/10 py-2 focus:outline-none focus:border-navy transition-all"
                                                        value={service.name}
                                                        onChange={(e) => updateService(service.id, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-navy opacity-40">Price ($)</label>
                                                        <input
                                                            required
                                                            type="number"
                                                            placeholder="150"
                                                            className="w-full bg-transparent border-b border-navy/10 py-2 focus:outline-none focus:border-navy transition-all"
                                                            value={service.price}
                                                            onChange={(e) => updateService(service.id, 'price', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-navy opacity-40">Min</label>
                                                        <input
                                                            required
                                                            type="number"
                                                            placeholder="60"
                                                            className="w-full bg-transparent border-b border-navy/10 py-2 focus:outline-none focus:border-navy transition-all"
                                                            value={service.duration}
                                                            onChange={(e) => updateService(service.id, 'duration', Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {formData.services.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeService(service.id)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={addService}
                                    className="w-full border-dashed border-2 border-navy/10 py-8 hover:bg-cream hover:border-navy/20 transition-all text-navy/40 uppercase tracking-widest text-xs"
                                >
                                    + Add Luxury Experience
                                </Button>

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" className="w-1/3" onClick={() => setStep(2)}>Back</Button>
                                    <Button size="lg" className="w-2/3 btn-hero">Finalize Registration</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-8 py-8">
                            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-serif text-navy">Application Received</h2>
                                <p className="text-slate font-light max-w-md mx-auto">
                                    Thank you for choosing to partner with us, <strong>{formData.businessName}</strong>.
                                    Our curation team will review your application within 48 hours.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Link href="/dashboard">
                                    <Button size="lg" className="w-full btn-hero">Explore Partner Dashboard</Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="ghost" className="text-navy/60">Back to Landing Page</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
