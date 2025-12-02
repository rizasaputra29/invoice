'use client';

import { useEffect, useState } from 'react';
import { supabase, type Invoice, type InvoiceItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { toast } from 'sonner';

type InvoicePreviewProps = {
  invoice: Invoice;
  onClose: () => void;
};

export default function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [invoice.id]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      toast.error('Failed to load invoice items');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border-4 border-black max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b-2 border-black p-4 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm" className="border-black">
              <Download className="w-4 h-4 mr-2" />
              Print / Save PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" className="hover:bg-black hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="font-mono text-lg font-bold">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase border ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t-2 border-b-2 border-black py-6">
            <div>
              <h3 className="text-xs uppercase font-bold mb-2 text-gray-600">Bill To</h3>
              <p className="font-bold">{invoice.client_name}</p>
              <p className="text-sm">{invoice.client_email}</p>
              <p className="text-sm whitespace-pre-line mt-2">{invoice.client_address}</p>
            </div>

            <div className="text-right">
              <div className="mb-4">
                <p className="text-xs uppercase font-bold text-gray-600">Issue Date</p>
                <p className="font-bold">{new Date(invoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-gray-600">Due Date</p>
                <p className="font-bold">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : (
            <>
              <div>
                <table className="w-full">
                  <thead className="border-b-2 border-black">
                    <tr>
                      <th className="text-left py-3 font-bold uppercase text-xs">Description</th>
                      <th className="text-center py-3 font-bold uppercase text-xs w-24">Qty</th>
                      <th className="text-right py-3 font-bold uppercase text-xs w-32">Unit Price</th>
                      <th className="text-right py-3 font-bold uppercase text-xs w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-4">{item.description}</td>
                        <td className="py-4 text-center font-mono">{Number(item.quantity).toFixed(2)}</td>
                        <td className="py-4 text-right font-mono">${Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-4 text-right font-mono font-bold">${Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-mono font-bold">${Number(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tax ({Number(invoice.tax_rate).toFixed(2)}%)</span>
                    <span className="font-mono font-bold">${Number(invoice.tax_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-4 border-t-2 border-black">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-2xl font-mono font-bold">${Number(invoice.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {invoice.notes && (
            <div className="border-t-2 border-black pt-6">
              <h3 className="text-xs uppercase font-bold mb-2 text-gray-600">Notes / Terms</h3>
              <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-6">
            <p>Thank you for your business!</p>
            <p className="mt-1">Invoice generated on {new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
