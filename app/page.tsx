'use client';

import { useState, useEffect } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import InvoicePreview from '@/components/InvoicePreview';
import Auth from '@/components/Auth';
import { Toaster } from 'sonner';
import { FileText, Plus, LogOut } from 'lucide-react';
import { supabase, type Invoice } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleInvoiceCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setIsDialogOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;

  if (!session) return <><Toaster position="top-right" /><Auth /></>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-black text-white p-1.5 rounded">
                   <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">INNOVUS <span className="font-normal text-gray-500 text-base">Generator</span></h1>
              </div>
              <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-gray-500 hover:text-black">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <section className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
               <p className="text-gray-500 text-sm">Manage your billing and invoices.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-800 h-10 px-4">
                  <Plus className="w-4 h-4 mr-2" /> Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 p-0 bg-white sm:rounded-lg" data-lenis-prevent>
                <DialogHeader className="p-6 pb-0 border-b border-gray-100">
                  <DialogTitle className="text-xl font-bold">New Invoice</DialogTitle>
                  <DialogDescription>Fill in the details below to generate a new invoice.</DialogDescription>
                </DialogHeader>
                <InvoiceForm onSuccess={handleInvoiceCreated} />
              </DialogContent>
            </Dialog>
          </section>

          <section>
            <InvoiceList refresh={refreshKey} onViewInvoice={setSelectedInvoice} />
          </section>
        </main>
      </div>

      {selectedInvoice && (
        <InvoicePreview invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onUpdate={() => setRefreshKey(prev => prev + 1)} />
      )}
    </>
  );
}