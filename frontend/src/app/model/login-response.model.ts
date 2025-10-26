/**
 * @file Defines the LoginResponse interface for the successful login response.
 */
import { Loan, UserProfile } from './'; // Import from the barrel file for consistency

/**
 * Interface for the response received after a successful login.
 * Includes an authentication token, user details, and the user's loans.
 */
export interface LoginResponse {
  user?: UserProfile;
  loans?: Loan[];
}