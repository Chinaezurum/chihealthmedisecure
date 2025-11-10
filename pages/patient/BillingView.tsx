import React from 'react';
import { Bill } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { CreditCardIcon } from '../../components/icons/index.tsx';

interface BillingViewProps {
  bills: Bill[];
  onPayBill: (billId: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ bills, onPayBill }) => {
  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Billing & Payments</h2>
      <div className="content-card">
        {bills.length > 0 ? (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service Description</th>
                <th>Amount (NGN)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id}>
                  <td>{new Date(bill.date).toLocaleDateString()}</td>
                  <td>{bill.service}</td>
                  <td className="font-mono">{bill.amount.toLocaleString()}</td>
                  <td>
                    <span className={`status-chip ${bill.status === 'Paid' ? 'status-chip-green' : 'status-chip-amber'}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td>
                    {bill.status === 'Due' && <Button onClick={() => onPayBill(bill.id)}>Pay Now</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon={CreditCardIcon} title="No Bills Found" message="You have no outstanding or past bills on record." />
        )}
      </div>
    </>
  );
};