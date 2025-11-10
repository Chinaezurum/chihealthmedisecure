// backend/src/services/paymentService.ts

/**
 * Mocks charging a credit card.
 * In a real application, this would integrate with a payment gateway like Stripe or Paystack.
 * @param amount - The amount to charge in the smallest currency unit (e.g., kobo, cents).
 * @param paymentDetails - Mock payment details.
 * @returns A promise that resolves to a mock transaction object.
 */
export const processPayment = async (
  amount: number,
  paymentDetails: { cardToken: string; customerEmail: string }
): Promise<{ transactionId: string; status: 'success' | 'failed'; amount: number }> => {
  console.log(`Attempting to charge ${amount / 100} to ${paymentDetails.customerEmail}`);

  // Simulate network delay and potential failure
  await new Promise(resolve => setTimeout(resolve, 1500));

  const isSuccessful = Math.random() > 0.1; // 90% success rate

  if (isSuccessful) {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Payment successful. Transaction ID: ${transactionId}`);
    return {
      transactionId,
      status: 'success',
      amount,
    };
  } else {
    console.error('Payment failed: Mock card declined.');
    throw new Error('The payment was declined by the card issuer.');
  }
};
