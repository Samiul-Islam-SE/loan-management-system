/**
 * @file Defines the Payment interface, representing a single loan payment.
 */

/**
 * Interface for a single payment transaction against a loan.
 */
export interface Payment {
  id: string | null; // Unique identifier for the payment
  paymentDate: string | null; // ISO 8601 date string when the payment was made
  amountPaid: number | null; // The amount paid in this transaction
  notes?: string | null; // Optional notes for the payment
}