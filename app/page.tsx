'use client';

import { useState } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import InvoicePreview from '@/components/InvoicePreview';
import { Toaster } from 'sonner';
import { FileText } from 'lucide-react';
import type { Invoice } from '@/lib/supabase';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleInvoiceCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-white">
        <header className="border-b-4 border-black bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Invoice Generator</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">Create and manage professional invoices</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
          <section>
            <InvoiceForm onSuccess={handleInvoiceCreated} />
          </section>

          <section>
            <InvoiceList refresh={refreshKey} onViewInvoice={setSelectedInvoice} />
          </section>
        </main>

        <footer className="border-t-2 border-black bg-white mt-20">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
            <p>Invoice Generator - Built with Next.js & Supabase</p>
          </div>
        </footer>
      </div>

      {selectedInvoice && (
        <InvoicePreview invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </>
  );
}
