/**
 * @file Defines the UserProfile interface for user information.
 */

/**
 * Interface for a user's profile information.
 * This would be displayed in areas like the dashboard header or a dedicated profile page.
 */
export interface UserProfile {
  id: string | null; // Unique identifier for the user
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: 'admin' | 'user' | 'loan_officer' | string | null; // Example roles
  phoneNumber?: string | null; // Optional field
  address?: string | null; // Optional field
}