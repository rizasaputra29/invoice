'use client';

import { useState, useEffect } from 'react';
import { supabase, type Invoice } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type InvoiceListProps = {
  refresh: number;
  onViewInvoice: (invoice: Invoice) => void;
};

export default function InvoiceList({ refresh, onViewInvoice }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Invoice deleted successfully');
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteId(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 border border-black bg-white">
        <p className="text-gray-600">No invoices yet. Create your first invoice above.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Invoices</h2>
          <Button onClick={fetchInvoices} variant="outline" size="sm" className="border-black">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto border border-black bg-white">
          <table className="w-full">
            <thead className="border-b-2 border-black">
              <tr>
                <th className="text-left p-4 font-bold">Invoice #</th>
                <th className="text-left p-4 font-bold">Client</th>
                <th className="text-left p-4 font-bold">Issue Date</th>
                <th className="text-left p-4 font-bold">Due Date</th>
                <th className="text-left p-4 font-bold">Total</th>
                <th className="text-left p-4 font-bold">Status</th>
                <th className="text-right p-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-black hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm">{invoice.invoice_number}</td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{invoice.client_name}</div>
                      <div className="text-sm text-gray-600">{invoice.client_email}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-mono font-bold">
                    ${Number(invoice.total).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => onViewInvoice(invoice)}
                        variant="outline"
                        size="sm"
                        className="border-black hover:bg-black hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setDeleteId(invoice.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-black">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
