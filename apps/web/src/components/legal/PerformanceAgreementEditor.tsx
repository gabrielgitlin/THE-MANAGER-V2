import React, { useState } from 'react';
import { Calendar, DollarSign, MapPin, User, Building2, Clock } from 'lucide-react';
import { TMDatePicker } from '../ui/TMDatePicker';
import { jsPDF } from 'jspdf';
import Modal from '../Modal';
import { formatDate } from '../../lib/utils';

interface PerformanceAgreementEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function PerformanceAgreementEditor({ isOpen, onClose, onSave }: PerformanceAgreementEditorProps) {
  const [formData, setFormData] = useState({
    // Agency Details
    agencyName: '',
    agencyRepName: '',
    agencyAddress: '',

    // Contractor Details
    contractorName: '',
    contractorRepName: '',
    contractorAddress: '',

    // Event Details
    artistName: '',
    venueDetails: '',
    eventDate: '',
    eventName: '',
    eventDuration: '',
    eventCapacity: '',
    eventSchedule: '',
    artistFee: '',
    advancePayment: '',
    bankDetails: '',
    additionalRequirements: '',

    // Accommodation Details
    numNights: '',
    numRooms: '',
    bedType: 'single',
    perDiemAmount: '',
    travelExpenseAmount: '',
    luggageWeight: '',
  });

  const generatePDF = (data: any) => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.width;
    const maxWidth = pageWidth - (margin * 2);

    // Helper function to check if we need a new page
    const checkNewPage = (extraSpace = 0) => {
      if (yPos + extraSpace >= pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper function to add wrapped text
    const addWrappedText = (text: string, indent = 0, fontSize = 12) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth - indent);
      
      lines.forEach(line => {
        checkNewPage(lineHeight);
        doc.text(line, margin + indent, yPos);
        yPos += lineHeight;
      });
      
      yPos += 3; // Add extra space after paragraph
    };

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANCE AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight * 2;

    // Date and Parties
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    addWrappedText(`This Service Agreement is made on ${formatDate(data.eventDate)} between ${data.agencyName}, represented by ${data.agencyRepName}, with an address at ${data.agencyAddress} (hereinafter referred to as "THE AGENCY"), and ${data.contractorName}, represented by ${data.contractorRepName}, with an address at ${data.contractorAddress} (hereinafter referred to as "THE CONTRACTOR"), under the following terms and conditions:`);

    // Event Details
    checkNewPage(lineHeight * 2);
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT DETAILS', margin, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');

    const eventDetails = [
      ['Artist Name:', data.artistName],
      ['Venue Name and Address:', data.venueDetails],
      ['Event Date:', formatDate(data.eventDate)],
      ['Event Name:', data.eventName],
      ['Event Duration:', data.eventDuration],
      ['Event Capacity:', data.eventCapacity],
      ['Schedule:', data.eventSchedule],
      ['Artist Fee:', `$${Number(data.artistFee).toLocaleString()} USD`],
      ['Advance Payment:', `$${Number(data.advancePayment).toLocaleString()} USD`],
      ['Banking Details:', data.bankDetails],
    ];

    eventDetails.forEach(([label, value]) => {
      checkNewPage(lineHeight);
      doc.text(`${label} ${value}`, margin, yPos);
      yPos += lineHeight;
    });

    if (data.additionalRequirements) {
      checkNewPage(lineHeight * 2);
      yPos += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Requirements/Instructions:', margin, yPos);
      yPos += lineHeight;
      doc.setFont('helvetica', 'normal');
      addWrappedText(data.additionalRequirements);
    }

    // Terms and Conditions
    checkNewPage(lineHeight * 3);
    yPos += lineHeight * 2;
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS AND CONDITIONS', margin, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');

    // 1. Payment Method
    doc.setFont('helvetica', 'bold');
    addWrappedText('1. PAYMENT METHOD');
    doc.setFont('helvetica', 'normal');
    addWrappedText('Payment shall be made via bank deposit, electronic transfer, or cash.', 10);
    addWrappedText('The Contractor agrees to pay the Agency the amount specified above via deposit, electronic transfer, or cash. If payments are made through platforms such as PayPal or other monetary exchange services, the Contractor must also cover the transaction fee (e.g., 10% for PayPal).', 10);
    addWrappedText('In the case of cash payments, the Contractor must settle the amount in person at the Agency\'s designated location.', 10);
    addWrappedText('The Contractor shall bear all costs, taxes, and fees associated with the event, including but not limited to work visa processing (if applicable), permits, collective management society fees, and union fees.', 10);
    addWrappedText('The Contractor must complete full payment at least 48 hours before the event. Failure to comply may result in cancellation of the artist\'s performance due to breach of contract.', 10);
    addWrappedText('Any payment made directly to the artist without the Agency\'s authorization will constitute a contract violation, granting the Agency the right to cancel the artist\'s performance.', 10);

    // 2. Cancellations
    checkNewPage(lineHeight * 2);
    doc.setFont('helvetica', 'bold');
    addWrappedText('2. CANCELLATIONS');
    doc.setFont('helvetica', 'normal');
    addWrappedText('If the artist or Agency cancels the performance due to force majeure or other justified reasons outlined below, the Agency will retain 100% of payments made by the Contractor at the time of cancellation.', 10);
    addWrappedText('The artist may cancel their performance without liability if the expected attendance is less than 20% of the venue\'s total capacity.', 10);
    addWrappedText('The artist may also cancel the performance due to weather conditions, safety concerns, national emergencies, or any circumstance that endangers the artist or their team.', 10);
    addWrappedText('If the artist cancels within three (3) days before the event, the Agency must refund 50% of the payment or offer a rescheduled date as requested by the Contractor.', 10);
    addWrappedText('If the Contractor cancels the event at least 45 days before the scheduled date, the Agency retains any payments made up to that point. If the cancellation occurs within 45 days of the event, the Contractor must pay 50% of the agreed fee.', 10);

    // 7. Accommodation / Per Diem / Travel Expenses
    checkNewPage(lineHeight * 2);
    doc.setFont('helvetica', 'bold');
    addWrappedText('7. ACCOMMODATION / PER DIEM / TRAVEL EXPENSES');
    doc.setFont('helvetica', 'normal');
    addWrappedText(`The Contractor must provide hotel accommodation for ${data.numNights} nights in ${data.numRooms} rooms with ${data.bedType} beds. The hotel must be pre-approved by the artist's manager.`, 10);
    addWrappedText(`The Contractor must also provide meals for the artist and staff or compensate them with $${data.perDiemAmount} USD per person.`, 10);
    addWrappedText(`For out-of-town events, the Contractor must provide an additional $${data.travelExpenseAmount} USD per day per person for travel expenses.`, 10);
    addWrappedText('The Contractor must cover round-trip transportation for the artist, as specified by the manager. Travel arrangements must be approved before purchase.', 10);
    addWrappedText(`For air travel, low-cost airlines such as Viva Aerobus, Magnicharters, and Volaris (LIGHT) are not accepted. Each flight must include at least ${data.luggageWeight} kg of checked luggage.`, 10);

    // Add a new page for signatures
    doc.addPage();
    yPos = pageHeight - 80;

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', margin, yPos);
    yPos += lineHeight * 2;

    // Contractor signature
    doc.text('CONTRACTOR', margin, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('Name: ____________________', margin, yPos);
    yPos += lineHeight;
    doc.text('Company/Agency: ____________________', margin, yPos);
    yPos += lineHeight;
    doc.text('Address: ____________________', margin, yPos);

    // Agency signature (on the right)
    yPos -= lineHeight * 3;
    doc.setFont('helvetica', 'bold');
    doc.text('AGENCY', pageWidth - 100, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('Name: ____________________', pageWidth - 100, yPos);
    yPos += lineHeight;
    doc.text('Company: ____________________', pageWidth - 100, yPos);
    yPos += lineHeight;
    doc.text('Address: ____________________', pageWidth - 100, yPos);

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    // Save the PDF
    doc.save('performance_agreement.pdf');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generatePDF(formData);
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Performance Agreement"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Agency Information */}
        <div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>Agency Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Agency Name
              </label>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Representative Name
              </label>
              <input
                type="text"
                value={formData.agencyRepName}
                onChange={(e) => setFormData({ ...formData, agencyRepName: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Address
              </label>
              <input
                type="text"
                value={formData.agencyAddress}
                onChange={(e) => setFormData({ ...formData, agencyAddress: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Contractor Information */}
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--t1)' }}>Contractor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Contractor Name
              </label>
              <input
                type="text"
                value={formData.contractorName}
                onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Representative Name
              </label>
              <input
                type="text"
                value={formData.contractorRepName}
                onChange={(e) => setFormData({ ...formData, contractorRepName: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Address
              </label>
              <input
                type="text"
                value={formData.contractorAddress}
                onChange={(e) => setFormData({ ...formData, contractorAddress: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--t1)' }}>Event Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Artist Name
              </label>
              <input
                type="text"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Event Name
              </label>
              <input
                type="text"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Event Date
              </label>
              <TMDatePicker value={formData.eventDate} onChange={(date) => setFormData({ ...formData, eventDate: date })} required />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Duration
              </label>
              <input
                type="text"
                value={formData.eventDuration}
                onChange={(e) => setFormData({ ...formData, eventDuration: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                placeholder="e.g., 2 hours"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Capacity
              </label>
              <input
                type="number"
                value={formData.eventCapacity}
                onChange={(e) => setFormData({ ...formData, eventCapacity: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Schedule
              </label>
              <input
                type="text"
                value={formData.eventSchedule}
                onChange={(e) => setFormData({ ...formData, eventSchedule: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                placeholder="e.g., Doors 7PM, Show 8PM"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Artist Fee
              </label>
              <div className="mt-1 relative shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span style={{ color: 'var(--t3)' }} className="sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.artistFee}
                  onChange={(e) => setFormData({ ...formData, artistFee: e.target.value })}
                  className="pl-7 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Advance Payment
              </label>
              <div className="mt-1 relative shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span style={{ color: 'var(--t3)' }} className="sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.advancePayment}
                  onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                  className="pl-7 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  required
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Venue Details
              </label>
              <input
                type="text"
                value={formData.venueDetails}
                onChange={(e) => setFormData({ ...formData, venueDetails: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Banking Details
              </label>
              <textarea
                value={formData.bankDetails}
                onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Additional Requirements/Instructions
              </label>
              <textarea
                value={formData.additionalRequirements}
                onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                rows={4}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>
        </div>

        {/* Accommodation & Travel */}
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--t1)' }}>Accommodation & Travel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Number of Nights
              </label>
              <input
                type="number"
                value={formData.numNights}
                onChange={(e) => setFormData({ ...formData, numNights: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Number of Rooms
              </label>
              <input
                type="number"
                value={formData.numRooms}
                onChange={(e) => setFormData({ ...formData, numRooms: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Bed Type
              </label>
              <select
                value={formData.bedType}
                onChange={(e) => setFormData({ ...formData, bedType: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="queen">Queen</option>
                <option value="king">King</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Per Diem Amount
              </label>
              <div className="mt-1 relative shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span style={{ color: 'var(--t3)' }} className="sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.perDiemAmount}
                  onChange={(e) => setFormData({ ...formData, perDiemAmount: e.target.value })}
                  className="pl-7 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Travel Expense Amount
              </label>
              <div className="mt-1 relative shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span style={{ color: 'var(--t3)' }} className="sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.travelExpenseAmount}
                  onChange={(e) => setFormData({ ...formData, travelExpenseAmount: e.target.value })}
                  className="pl-7 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>
                Luggage Weight (kg)
              </label>
              <input
                type="number"
                value={formData.luggageWeight}
                onChange={(e) => setFormData({ ...formData, luggageWeight: e.target.value })}
                className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border"
            style={{ color: 'var(--t1)', background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-80"
          >
            Generate Agreement
          </button>
        </div>
      </form>
    </Modal>
  );
}