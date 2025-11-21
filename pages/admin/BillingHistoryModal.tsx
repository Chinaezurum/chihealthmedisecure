import React from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { CheckIcon, AlertCircleIcon, ClockIcon, FileTextIcon } from '../../components/icons/index.tsx';

interface BillingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BillingRecord {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceNumber: string;
  plan: string;
  paymentMethod: string;
}

const mockBillingHistory: BillingRecord[] = [
  {
    id: '1',
    date: 'November 15, 2024',
    amount: '₦250,000',
    status: 'paid',
    invoiceNumber: 'INV-2024-011',
    plan: 'Professional Hospital',
    paymentMethod: 'Mastercard **** 1234',
  },
  {
    id: '2',
    date: 'October 15, 2024',
    amount: '₦250,000',
    status: 'paid',
    invoiceNumber: 'INV-2024-010',
    plan: 'Professional Hospital',
    paymentMethod: 'Mastercard **** 1234',
  },
  {
    id: '3',
    date: 'September 15, 2024',
    amount: '₦250,000',
    status: 'paid',
    invoiceNumber: 'INV-2024-009',
    plan: 'Professional Hospital',
    paymentMethod: 'Mastercard **** 1234',
  },
  {
    id: '4',
    date: 'August 15, 2024',
    amount: '₦250,000',
    status: 'paid',
    invoiceNumber: 'INV-2024-008',
    plan: 'Professional Hospital',
    paymentMethod: 'Mastercard **** 1234',
  },
  {
    id: '5',
    date: 'July 15, 2024',
    amount: '₦250,000',
    status: 'paid',
    invoiceNumber: 'INV-2024-007',
    plan: 'Professional Hospital',
    paymentMethod: 'Mastercard **** 1234',
  },
  {
    id: '6',
    date: 'June 15, 2024',
    amount: '₦50,000',
    status: 'paid',
    invoiceNumber: 'INV-2024-006',
    plan: 'Basic Clinic',
    paymentMethod: 'Mastercard **** 1234',
  },
];

const StatusBadge: React.FC<{ status: BillingRecord['status'] }> = ({ status }) => {
  const styles = {
    paid: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: CheckIcon,
    },
    pending: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      icon: ClockIcon,
    },
    failed: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertCircleIcon,
    },
  };

  const style = styles[status];
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const BillingHistoryModal: React.FC<BillingHistoryModalProps> = ({ isOpen, onClose }) => {
  const handleDownloadInvoice = (record: BillingRecord) => {
    // Generate invoice HTML content
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${record.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 3px solid #0d9488;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0d9488;
          }
          .invoice-details {
            text-align: right;
          }
          .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #0d9488;
          }
          .section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .total-row {
            font-size: 18px;
            font-weight: bold;
            background-color: #f0fdfa;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            background-color: #d1fae5;
            color: #065f46;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">ChiHealth MediSecure</div>
            <div>Healthcare Management Platform</div>
            <div>support@chihealthmedisecure.com</div>
          </div>
          <div class="invoice-details">
            <div class="invoice-number">${record.invoiceNumber}</div>
            <div>Date: ${record.date}</div>
            <div>Status: <span class="status-badge">${record.status.toUpperCase()}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Bill To</div>
          <div><strong>Your Organization Name</strong></div>
          <div>Organization Address</div>
          <div>City, State, Country</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Period</th>
              <th style="text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${record.plan} - Subscription</td>
              <td>Monthly Service</td>
              <td style="text-align: right">${record.amount}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2">Total Amount</td>
              <td style="text-align: right">${record.amount}</td>
            </tr>
          </tfoot>
        </table>

        <div class="section">
          <div class="section-title">Payment Information</div>
          <div>Payment Method: ${record.paymentMethod}</div>
          <div>Transaction Date: ${record.date}</div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>ChiHealth MediSecure | www.chihealthmedisecure.com</p>
          <p>For support, contact: billing@chihealthmedisecure.com</p>
        </div>
      </body>
      </html>
    `;

    // Create a Blob from the HTML content
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${record.invoiceNumber}_${record.date.replace(/\\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also print the invoice
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const footer = (
    <Button
      onClick={onClose}
      style={{
        backgroundColor: 'var(--background-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      Close
    </Button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Billing History" footer={footer}>
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-background-tertiary border border-border-primary rounded-lg p-4">
            <p className="text-sm text-text-secondary mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-text-primary">₦1,550,000</p>
            <p className="text-xs text-text-tertiary mt-1">Last 12 months</p>
          </div>
          <div className="bg-background-tertiary border border-border-primary rounded-lg p-4">
            <p className="text-sm text-text-secondary mb-1">Invoices</p>
            <p className="text-2xl font-bold text-text-primary">{mockBillingHistory.length}</p>
            <p className="text-xs text-text-tertiary mt-1">All paid</p>
          </div>
        </div>

        {/* Billing Records Table */}
        <div className="overflow-x-auto">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockBillingHistory.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div>
                      <p className="font-medium text-text-primary">{record.date}</p>
                      <p className="text-xs text-text-secondary">{record.paymentMethod}</p>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-text-secondary">{record.invoiceNumber}</td>
                  <td>{record.plan}</td>
                  <td className="font-semibold text-text-primary">{record.amount}</td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                  <td>
                    <button
                      onClick={() => handleDownloadInvoice(record)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      <FileTextIcon className="w-3 h-3" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-text-secondary text-center pt-4 border-t border-border-primary">
          Need help with billing? Contact support at billing@chihealthmedisecure.com
        </div>
      </div>
    </Modal>
  );
};
