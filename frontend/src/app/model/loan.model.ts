/**
 * @file Defines the Loan interface, representing a single loan entity.
 */

import { Payment } from './';

/**
 * Defines the possible statuses a loan can have.
 */
export type LoanStatus = 'Pending' | 'Approved' | 'Active' | 'Rejected' | 'Paid Off' | 'Defaulted';

/**
 * Interface for a loan object.
 * This corresponds to the main loan entity in the backend.
 */
export interface Loan {
  id: string | null; // Unique identifier for the loan
  borrowerId: string | null; // Foreign key to the UserProfile
  loanType: string | null; // e.g., 'Personal', 'Home', 'Auto'
  amount: number | null; // The principal amount of the loan
  interestRate: number | null; // Annual interest rate (e.g., 5.5 for 5.5%)
  termMonths: number | null; // The total duration of the loan in months
  startDate: string | null; // ISO 8601 date string when the loan was disbursed
  status: LoanStatus | null;
  outstandingBalance: number | null; // The remaining amount to be paid
  nextPaymentDate?: string | null; // ISO 8601 date string for the next due payment
  monthlyPayment: number | null; // The calculated monthly installment amount
  paymentHistory?: Payment[] | null; // An array of past payments, might be loaded on demand
}