import { redirect } from 'next/navigation';

export default function BusinessBookingPage({ params }: { params: { businessId: string } }) {
    // Redirige automáticamente /book/nombre-negocio a /book?id=nombre-negocio
    redirect(`/book?id=${params.businessId}`);
}
