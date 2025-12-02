'use client';

import { useState, useEffect } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import InvoicePreview from '@/components/InvoicePreview';
import Auth from '@/components/Auth';
import { Toaster } from 'sonner';
import { FileText, Plus, LogOut } from 'lucide-react';
import type { Invoice } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInvoiceCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setIsDialogOpen(false); // Close dialog on success
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return (
      <>
        <Toaster position="top-right" />
        <Auth />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-white">
        <header className="border-b-4 border-black bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Invoice Generator</h1>
              </div>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Create and manage professional invoices</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
          <section className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-800 h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Invoice
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-black p-0"
                data-lenis-prevent
              >
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-2xl font-bold">New Invoice</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to generate a new invoice.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6">
                  <InvoiceForm onSuccess={handleInvoiceCreated} />
                </div>
              </DialogContent>
            </Dialog>
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
        <InvoicePreview 
          invoice={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)}
          onUpdate={() => setRefreshKey(prev => prev + 1)} 
        />
      )}
    </>
  );
}