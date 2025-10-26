/**
 * @file Defines the LoginResponse interface for the successful login response.
 */
import { Loan } from './loan.model';
import { UserProfile } from './user-profile.model';

/**
 * Interface for the response received after a successful login.
 * Includes an authentication token, user details, and the user's loans.
 */
export interface LoginResponse {
  token?: string;
  user?: UserProfile;
  loans?: Loan[];
}