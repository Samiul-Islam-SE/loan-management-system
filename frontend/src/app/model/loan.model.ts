/**
 * @file Defines the Loan interface, representing a single loan entity.
 * This model is aligned with the backend's `Loan.java` entity.
 */

/**
 * Defines the possible statuses a loan can have.
 * This corresponds to the `LoanStatus.java` enum on the backend.
 */
export type LoanStatus = 'OPEN' | 'OVERDUE' | 'RESOLVED' | 'CANCELLED';

/**
 * Interface for a loan object.
 * This corresponds to the main loan entity in the backend.
 */
export interface Loan {
  id: string | null;
  principalCents: number | null;
  currencyCode: string | null;
  title: string | null;
  note: string | null;
  promisedDueDate: string | null; // ISO 8601 date string
  status: LoanStatus | null;
  createdAt: string | null; // ISO 8601 date string
  updatedAt: string | null; // ISO 8601 date string
  borrowerEmail?: string | null;
  lenderEmail?: string | null;
}