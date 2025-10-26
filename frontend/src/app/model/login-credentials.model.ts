/**
 * @file Defines the LoginCredentials interface for user authentication.
 */

/**
 * Interface for user login credentials.
 * Corresponds to the data sent to the backend for authentication.
 */
export interface LoginCredentials {
  email?: string | null;
  password?: string | null;
}