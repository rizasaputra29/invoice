'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Invoice, type InvoiceItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Printer } from 'lucide-react';
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
  
  // Scaling state for responsive A4
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
  }, [invoice.id]);

  // Responsive: Calculate scale to fit width inside the modal
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const padding = 48; // Space for margins
        const availableWidth = containerWidth - padding;
        const a4Width = 794; // approx 210mm in pixels (96 DPI)

        // Scale down if container is smaller than A4
        const newScale = availableWidth < a4Width ? availableWidth / a4Width : 1;
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  return (
    // 1. Outer Overlay - Fixed to screen
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:block">
      
      {/* 2. Modal Container - Fits A4 width + scrollbar space */}
      <div className="bg-white rounded-lg shadow-2xl w-full md:w-fit md:min-w-[210mm] max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 print:shadow-none print:w-full print:max-w-none print:max-h-none print:h-full print:rounded-none print:border-none">
        
        {/* Floating Toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-gray-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-3 print:hidden z-50">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="border-none h-8 bg-transparent focus:ring-0 w-[110px] font-medium text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <div className="h-4 w-px bg-gray-300" />
        <Button onClick={handlePrint} variant="ghost" size="sm" className="h-8 hover:bg-gray-100 rounded-full px-3">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </div>

        {/* 4. Scrollable Content Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-gray-100 print:p-0 print:overflow-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent w-full"
          data-lenis-prevent
        >
          <div className="min-h-full flex justify-center items-start print:block print:w-full print:h-full">
            
            {/* 5. Scaling Wrapper */}
            <div 
              style={{ 
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                marginBottom: `-${(1 - scale) * 1123}px`,
                width: '210mm'
              }}
              className="transition-transform duration-200 ease-out print:transform-none print:m-0"
            >
              {/* 6. The A4 Paper */}
              <div className="paper-texture shadow-xl w-[210mm] min-h-[297mm] flex flex-col text-black print:shadow-none print:w-full print:h-full print:box-border">
                
                {/* Content Padding Container */}
                <div className="p-[15mm] flex flex-col h-full flex-1">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 border-b border-gray-100 pb-8 mb-8">
                    <div>
                      <h1 className="text-4xl font-extrabold tracking-tight text-black mb-4">INNOVUS</h1>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-semibold text-black">Innovus Tech</p>
                        <p>67, Navniman Society, Pratap Nagar,</p>
                        <p>Nagpur, Maharashtra - 440022</p>
                        <p>India</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <h2 className="text-2xl font-bold text-red-600 uppercase mb-4 tracking-wide">INVOICE</h2>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        <p className="font-semibold text-gray-900">Contact</p>
                        <p>www.innovustech.in</p>
                        <p>hello@innovustech.in</p>
                        <p>+91 77095 01644</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Details Strip */}
                  <div className="border-y border-gray-200 py-4 mb-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 print:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Due Amount</p>
                        <p className="text-base font-semibold text-black">{formatCurrency(invoice.total)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Due Date</p>
                        <p className="text-base font-medium text-black">{new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Invoice No</p>
                        <p className="text-base font-medium text-black">{invoice.invoice_number}</p>
                      </div>
                      <div className="text-left sm:text-right print:text-right">
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Date</p>
                        <p className="text-base font-medium text-black">{new Date(invoice.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 pt-2 mb-10 print:grid-cols-2 print:gap-12">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Billed To</p>
                      <div className="text-base text-gray-800">
                        <p className="font-bold text-black mb-1">{invoice.client_name}</p>
                        <p className="whitespace-pre-line leading-relaxed text-gray-600">{invoice.client_address}</p>
                        <p className="mt-1 text-gray-500 text-sm">{invoice.client_email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Shipped To</p>
                      <div className="text-base text-gray-800">
                        <p className="font-bold text-black mb-1">{invoice.client_name}</p>
                        <p className="whitespace-pre-line leading-relaxed text-gray-600">{invoice.client_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="mt-6 sm:mt-8 print:mt-8 mb-10 overflow-x-auto print:overflow-visible">
                    <table className="w-full text-sm min-w-[500px] print:min-w-0">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 font-semibold text-gray-900 w-12 text-xs uppercase tracking-wide">#</th>
                          <th className="text-left py-3 font-semibold text-gray-900 text-xs uppercase tracking-wide">Description</th>
                          <th className="text-center py-3 font-semibold text-gray-900 w-24 text-xs uppercase tracking-wide">Qty</th>
                          <th className="text-right py-3 font-semibold text-gray-900 w-32 text-xs uppercase tracking-wide">Price</th>
                          <th className="text-right py-3 font-semibold text-gray-900 w-32 text-xs uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        {items.map((item, index) => {
                          const [name, ...descLines] = (item.description || '').split('\n');
                          return (
                            <tr key={item.id} className="border-b border-gray-100 last:border-0">
                              <td className="py-4 align-top text-gray-400 font-medium">{index + 1}</td>
                              <td className="py-4 align-top">
                                <p className="font-semibold text-black text-base">{name}</p>
                                {descLines.length > 0 && (
                                  <p className="text-gray-500 mt-1 text-sm">{descLines.join(' ')}</p>
                                )}
                              </td>
                              <td className="py-4 align-top text-center font-medium">{item.quantity}</td>
                              <td className="py-4 align-top text-right font-medium">{formatCurrency(item.unit_price)}</td>
                              <td className="py-4 align-top text-right font-bold text-black">{formatCurrency(item.amount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Section */}
                  <div className="mt-auto pt-4 sm:pt-6 lg:pt-8 print:pt-8">
                    <div className="border-t border-gray-200 pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 print:grid-cols-2 print:gap-12">
                        
                        {/* Left Column: Bank & Notes */}
                        <div className="space-y-8">
                          <div className="bg-gray-50/50 rounded p-5 border border-gray-100/50 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">Bank Details</p>
                            <div className="text-sm space-y-2 text-gray-700 font-medium">
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-normal">Bank Name</span>
                                <span>Union Bank Of India</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-normal">Account Name</span>
                                <span>Innovus Tech</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-normal">Account No</span>
                                <span className="tracking-wide">510101006820471</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-normal">IFSC Code</span>
                                <span>UBIN0933465</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Payment Method</p>
                              <p className="text-sm font-medium text-gray-900">Bank Transfer / Cash</p>
                            </div>

                            {invoice.notes && (
                              <div>
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Notes</p>
                                <p className="text-sm text-gray-600 italic">{invoice.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Totals & Sign */}
                        <div className="flex flex-col justify-between">
                          <div className="space-y-3 w-full max-w-[280px] lg:ml-auto print:ml-auto">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Sub Total</span>
                              <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Tax ({Number(invoice.tax_rate)}%)</span>
                              <span className="font-medium text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                            <div className="h-px bg-gray-200 my-2" />
                            <div className="flex justify-between text-lg font-bold text-black">
                              <span>Total</span>
                              <span>{formatCurrency(invoice.total)}</span>
                            </div>
                          </div>

                          <div className="mt-12 sm:mt-16 text-left lg:text-right print:text-right print:mt-16">
                            <div className="inline-block text-center">
                              <div className="h-16 w-32 mx-auto mb-2 border-b border-gray-400/50"></div>
                              <p className="text-sm font-bold text-black">Authorized Signature</p>
                              <p className="text-xs text-gray-500 mt-1">Innovus Tech</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                    
                    <div className="border-t border-gray-400/30 pt-6 mt-8 text-center">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Thank you for your business</p>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}