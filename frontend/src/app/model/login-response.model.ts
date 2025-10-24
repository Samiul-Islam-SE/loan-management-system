/**
 * @file Defines the LoginResponse interface for the successful login response.
 */

import { UserProfile } from './'; // Import from the barrel file for consistency

/**
 * Interface for the response received after a successful login.
 * Typically includes an authentication token and potentially user details.
 */
export interface LoginResponse {
  token: string | null;
  user: UserProfile | null; // Assuming the user profile is returned upon login
}