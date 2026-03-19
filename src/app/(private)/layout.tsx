import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { Toaster } from "sonner";
import { requireAuth } from "@/lib/auth";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors />
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
