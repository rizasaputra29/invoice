'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

type LineItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

type InvoiceFormProps = {
  onSuccess: () => void;
};

export default function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  // ... (Keep existing logic state & functions) ...
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const status = 'draft';
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), name: '', description: '', quantity: 0, unit_price: 0, amount: 0 }
  ]);

  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.amount, 0);
  const calculateTaxAmount = () => (calculateSubtotal() * taxRate) / 100;
  const calculateTotal = () => calculateSubtotal() + calculateTaxAmount();

  const addItem = () => setItems([...items, { id: crypto.randomUUID(), name: '', description: '', quantity: 0, unit_price: 0, amount: 0 }]);
  
  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const qty = field === 'quantity' ? (value === '' ? 0 : Number(value)) : item.quantity;
          const price = field === 'unit_price' ? (value === '' ? 0 : Number(value)) : item.unit_price;
          updated.amount = qty * price;
        }
        return updated;
      }
      return item;
    }));
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientAddress || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTaxAmount();
      const total = calculateTotal();

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_email: clientEmail,
          client_address: clientAddress,
          issue_date: issueDate,
          due_date: dueDate,
          status,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          notes: notes || null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const itemsToInsert = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description ? `${item.name}\n${item.description}` : item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      toast.success('Invoice created successfully!');
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientName(''); setClientEmail(''); setClientAddress('');
    setIssueDate(new Date().toISOString().split('T')[0]); setDueDate('');
    setTaxRate(0); setNotes('');
    setItems([{ id: crypto.randomUUID(), name: '', description: '', quantity: 0, unit_price: 0, amount: 0 }]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email *</Label>
            <Input id="clientEmail" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clientAddress">Client Address *</Label>
            <Textarea id="clientAddress" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date *</Label>
            <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input id="taxRate" type="number" step="0.01" min="0" max="100" value={taxRate === 0 ? '' : taxRate} onChange={(e) => setTaxRate(e.target.value === '' ? 0 : Number(e.target.value))} placeholder="0" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-lg font-bold uppercase">Line Items</h3>
          <Button type="button" onClick={addItem} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-start border border-border p-4 bg-gray-50 rounded-md">
              <div className="col-span-12 md:col-span-5 space-y-2">
                <Input value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} placeholder="Item Name *" required className="font-medium" />
                <Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Description (Optional)" />
              </div>
              <div className="col-span-4 md:col-span-2 space-y-2">
                <Input type="number" step="0.01" min="0.01" value={item.quantity === 0 ? '' : item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Qty" required />
              </div>
              <div className="col-span-4 md:col-span-2 space-y-2">
                <Input type="number" step="0.01" min="0" value={item.unit_price === 0 ? '' : item.unit_price} onChange={(e) => updateItem(item.id, 'unit_price', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Price" required />
              </div>
              <div className="col-span-3 md:col-span-2 flex items-center justify-end h-10 font-mono font-bold">
                {formatCurrency(item.amount)}
              </div>
              <div className="col-span-1 md:col-span-1 flex justify-center">
                <Button type="button" onClick={() => removeItem(item.id)} variant="ghost" size="icon" disabled={items.length === 1} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-y-2 pt-4 border-t border-border">
          <div className="w-full md:w-1/3 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal:</span><span className="font-mono">{formatCurrency(calculateSubtotal())}</span></div>
            <div className="flex justify-between text-sm"><span>Tax ({taxRate}%):</span><span className="font-mono">{formatCurrency(calculateTaxAmount())}</span></div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2"><span>Total:</span><span className="font-mono">{formatCurrency(calculateTotal())}</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes / Terms</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Payment terms, thank you note, etc." />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" onClick={resetForm} variant="outline">Reset</Button>
        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" /> {loading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}