'use client';

import { useEffect, useState } from 'react';
import { supabase, type Invoice, type InvoiceItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

type InvoicePreviewProps = {
  invoice: Invoice;
  onClose: () => void;
  onUpdate?: () => void;
};

export default function InvoicePreview({ invoice, onClose, onUpdate }: InvoicePreviewProps) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(invoice.status);

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

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id);

      if (error) throw error;
      
      setStatus(newStatus);
      toast.success('Status updated');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update status');
    }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block">
      <div className="bg-white border-4 border-black max-w-4xl w-full my-8 print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none">
        <div className="sticky top-0 bg-white border-b-2 border-black p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Invoice Preview</h2>
            <div className="w-[180px]">
               <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="border-black h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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

        <div className="p-8 space-y-8 print:p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="font-mono text-lg font-bold">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase border ${getStatusColor(status)}`}>
                {status}
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
                      <th className="text-left py-3 font-bold uppercase text-xs">Item</th>
                      <th className="text-center py-3 font-bold uppercase text-xs w-24">Qty</th>
                      <th className="text-right py-3 font-bold uppercase text-xs w-32">Unit Price</th>
                      <th className="text-right py-3 font-bold uppercase text-xs w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      // Split the combined "Name\nDescription" string back into parts
                      const [name, ...descLines] = (item.description || '').split('\n');
                      const description = descLines.join('\n');
                      
                      return (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="py-4">
                            <div className="font-bold">{name}</div>
                            {description && (
                              <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{description}</div>
                            )}
                          </td>
                          <td className="py-4 text-center font-mono align-top">{Number(item.quantity).toFixed(2)}</td>
                          <td className="py-4 text-right font-mono align-top">{formatCurrency(item.unit_price)}</td>
                          <td className="py-4 text-right font-mono font-bold align-top">{formatCurrency(item.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-mono font-bold">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tax ({Number(invoice.tax_rate).toFixed(2)}%)</span>
                    <span className="font-mono font-bold">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between py-4 border-t-2 border-black">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-2xl font-mono font-bold">{formatCurrency(invoice.total)}</span>
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