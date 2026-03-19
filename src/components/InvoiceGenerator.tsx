import React, { useState } from 'react';
import { FileText, Plus, X, Download, Share2, Upload } from 'lucide-react';
import Modal from './Modal';
import jsPDF from 'jspdf';
import { formatDate } from '../lib/utils';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceGenerator({ isOpen, onClose }: InvoiceGeneratorProps) {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billTo: {
      name: '',
      email: '',
      address: '',
    },
    billFrom: {
      name: '',
      email: '',
      address: '',
    },
    items: [
      { description: '', quantity: 1, rate: 0, amount: 0 }
    ] as InvoiceItem[],
    notes: '',
    taxRate: 0,
    logo: '',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInvoiceData({ ...invoiceData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...invoiceData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + tax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const generateInvoiceHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #000; }
    .invoice-number { font-size: 14px; color: #666; margin-top: 8px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 12px; font-weight: bold; color: #666; margin-bottom: 8px; text-transform: uppercase; }
    .party-info { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #000; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .text-right { text-align: right; }
    .totals { margin-top: 20px; }
    .totals-row { display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 14px; }
    .totals-label { width: 150px; text-align: right; margin-right: 20px; color: #666; }
    .totals-value { width: 120px; text-align: right; }
    .total-row { font-size: 18px; font-weight: bold; padding-top: 12px; border-top: 2px solid #000; margin-top: 12px; }
    .notes { margin-top: 40px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #000; }
    .notes-title { font-weight: bold; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">#${invoiceData.invoiceNumber}</div>
    </div>
    <div style="text-align: right;">
      <div><strong>Date:</strong> ${formatDate(invoiceData.date)}</div>
      <div><strong>Due Date:</strong> ${formatDate(invoiceData.dueDate)}</div>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
    <div class="section" style="flex: 1;">
      <div class="section-title">From</div>
      <div class="party-info">
        <div><strong>${invoiceData.billFrom.name || 'Your Name'}</strong></div>
        <div>${invoiceData.billFrom.email || 'your@email.com'}</div>
        <div>${invoiceData.billFrom.address || 'Your Address'}</div>
      </div>
    </div>

    <div class="section" style="flex: 1;">
      <div class="section-title">Bill To</div>
      <div class="party-info">
        <div><strong>${invoiceData.billTo.name || 'Client Name'}</strong></div>
        <div>${invoiceData.billTo.email || 'client@email.com'}</div>
        <div>${invoiceData.billTo.address || 'Client Address'}</div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceData.items.map(item => `
        <tr>
          <td>${item.description || 'Item Description'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.rate)}</td>
          <td class="text-right">${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <div class="totals-label">Subtotal:</div>
      <div class="totals-value">${formatCurrency(subtotal)}</div>
    </div>
    ${invoiceData.taxRate > 0 ? `
    <div class="totals-row">
      <div class="totals-label">Tax (${invoiceData.taxRate}%):</div>
      <div class="totals-value">${formatCurrency(tax)}</div>
    </div>
    ` : ''}
    <div class="totals-row total-row">
      <div class="totals-label">Total:</div>
      <div class="totals-value">${formatCurrency(total)}</div>
    </div>
  </div>

  ${invoiceData.notes ? `
  <div class="notes">
    <div class="notes-title">Notes</div>
    <div>${invoiceData.notes}</div>
  </div>
  ` : ''}
</body>
</html>
    `.trim();
  };

  const handleDownload = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    if (invoiceData.logo) {
      try {
        pdf.addImage(invoiceData.logo, 'PNG', 15, yPos, 40, 20);
      } catch (error) {
        console.error('Error adding logo:', error);
      }
    }

    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', pageWidth - 15, yPos + 10, { align: 'right' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`#${invoiceData.invoiceNumber}`, pageWidth - 15, yPos + 17, { align: 'right' });

    yPos = 50;
    pdf.setFontSize(10);
    pdf.text(`Date: ${formatDate(invoiceData.date)}`, pageWidth - 15, yPos, { align: 'right' });
    pdf.text(`Due Date: ${formatDate(invoiceData.dueDate)}`, pageWidth - 15, yPos + 6, { align: 'right' });

    yPos = 70;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FROM', 15, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceData.billFrom.name || 'Your Name', 15, yPos + 6);
    pdf.text(invoiceData.billFrom.email || 'your@email.com', 15, yPos + 12);
    pdf.text(invoiceData.billFrom.address || 'Your Address', 15, yPos + 18);

    pdf.setFont('helvetica', 'bold');
    pdf.text('BILL TO', pageWidth / 2 + 10, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceData.billTo.name || 'Client Name', pageWidth / 2 + 10, yPos + 6);
    pdf.text(invoiceData.billTo.email || 'client@email.com', pageWidth / 2 + 10, yPos + 12);
    pdf.text(invoiceData.billTo.address || 'Client Address', pageWidth / 2 + 10, yPos + 18);

    yPos = 110;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(15, yPos, pageWidth - 15, yPos);

    yPos += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('DESCRIPTION', 15, yPos);
    pdf.text('QTY', pageWidth - 80, yPos, { align: 'right' });
    pdf.text('RATE', pageWidth - 50, yPos, { align: 'right' });
    pdf.text('AMOUNT', pageWidth - 15, yPos, { align: 'right' });

    yPos += 3;
    pdf.setLineWidth(0.3);
    pdf.line(15, yPos, pageWidth - 15, yPos);

    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    invoiceData.items.forEach((item) => {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(item.description || 'Item Description', 15, yPos);
      pdf.text(item.quantity.toString(), pageWidth - 80, yPos, { align: 'right' });
      pdf.text(formatCurrency(item.rate), pageWidth - 50, yPos, { align: 'right' });
      pdf.text(formatCurrency(item.amount), pageWidth - 15, yPos, { align: 'right' });
      yPos += 7;
    });

    yPos += 5;
    pdf.setLineWidth(0.2);
    pdf.line(pageWidth - 70, yPos, pageWidth - 15, yPos);

    yPos += 8;
    pdf.text('Subtotal:', pageWidth - 55, yPos);
    pdf.text(formatCurrency(subtotal), pageWidth - 15, yPos, { align: 'right' });

    if (invoiceData.taxRate > 0) {
      yPos += 6;
      pdf.text(`Tax (${invoiceData.taxRate}%):`, pageWidth - 55, yPos);
      pdf.text(formatCurrency(tax), pageWidth - 15, yPos, { align: 'right' });
    }

    yPos += 8;
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth - 70, yPos - 2, pageWidth - 15, yPos - 2);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Total:', pageWidth - 55, yPos);
    pdf.text(formatCurrency(total), pageWidth - 15, yPos, { align: 'right' });

    if (invoiceData.notes) {
      yPos += 15;
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes:', 15, yPos);
      pdf.setFont('helvetica', 'normal');
      const splitNotes = pdf.splitTextToSize(invoiceData.notes, pageWidth - 30);
      pdf.text(splitNotes, 15, yPos + 6);
    }

    pdf.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
  };

  const handleShare = () => {
    const html = generateInvoiceHTML();

    if (navigator.share) {
      const blob = new Blob([html], { type: 'text/html' });
      const file = new File([blob], `invoice-${invoiceData.invoiceNumber}.html`, { type: 'text/html' });

      navigator.share({
        title: `Invoice ${invoiceData.invoiceNumber}`,
        text: `Invoice for ${invoiceData.billTo.name || 'client'}`,
        files: [file],
      }).catch((error) => {
        console.log('Error sharing:', error);
        alert('Sharing not supported. Invoice has been copied to clipboard.');
        navigator.clipboard.writeText(html);
      });
    } else {
      navigator.clipboard.writeText(html);
      alert('Invoice HTML copied to clipboard!');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice"
      maxWidth="4xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
            {invoiceData.logo && (
              <div className="flex items-center gap-2">
                <img src={invoiceData.logo} alt="Logo" className="h-12 object-contain border border-gray-300 rounded" />
                <button
                  type="button"
                  onClick={() => setInvoiceData({ ...invoiceData, logo: '' })}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={invoiceData.date}
              onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={invoiceData.dueDate}
            onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase">From</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your Name"
                value={invoiceData.billFrom.name}
                onChange={(e) => setInvoiceData({
                  ...invoiceData,
                  billFrom: { ...invoiceData.billFrom, name: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={invoiceData.billFrom.email}
                onChange={(e) => setInvoiceData({
                  ...invoiceData,
                  billFrom: { ...invoiceData.billFrom, email: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <input
                type="text"
                placeholder="Your Address"
                value={invoiceData.billFrom.address}
                onChange={(e) => setInvoiceData({
                  ...invoiceData,
                  billFrom: { ...invoiceData.billFrom, address: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase">Bill To</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Client Name"
                value={invoiceData.billTo.name}
                onChange={(e) => setInvoiceData({
                  ...invoiceData,
                  billTo: { ...invoiceData.billTo, name: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <input
                type="email"
                placeholder="client@email.com"
                value={invoiceData.billTo.email}
                onChange={(e) => setInvoiceData({
                  ...invoiceData,
                  billTo: { ...invoiceData.billTo, email: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <input
                type="text"
                placeholder="Client Address"
                value={invoiceData.billTo.address}
                onChange={(e) => setInvoiceData({
                  ...invoiceData,
                  billTo: { ...invoiceData.billTo, address: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700 uppercase">Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-primary hover:text-black"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-2">
            {invoiceData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="col-span-5 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                  className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  min="0"
                  step="0.01"
                />
                <div className="col-span-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right">
                  {formatCurrency(item.amount)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="col-span-1 flex items-center justify-center text-red-600 hover:text-red-700"
                  disabled={invoiceData.items.length === 1}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="text-gray-600">Tax:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={invoiceData.taxRate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: Number(e.target.value) })}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-right"
                  min="0"
                  step="0.1"
                />
                <span className="text-gray-600">%</span>
                <span className="font-medium w-20 text-right">{formatCurrency(tax)}</span>
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={invoiceData.notes}
            onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes or payment terms..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-black bg-gray-300 border border-black rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-blue-300 border border-black rounded-md hover:bg-blue-400"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-green border border-black rounded-md hover:bg-green/90"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </Modal>
  );
}
