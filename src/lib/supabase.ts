import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Authentication Helper Functions
 * 
 * These functions provide a clean interface for authentication operations
 * with proper error handling and JWT token management.
 */

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Promise with user data or error
 */
export const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
  try {
    const userData: any = {
      email,
      password,
    };

    // Add user metadata if names are provided
    if (firstName || lastName) {
      userData.options = {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName || ''} ${lastName || ''}`.trim()
        }
      };
    }

    const { data, error } = await supabase.auth.signUp(userData);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with user data or error
 */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Sign out the current user
 * @returns Promise with success or error
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Get the current user session
 * @returns Promise with session data
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    return { session: null, error };
  }
};

/**
 * Get the current user
 * @returns Promise with user data
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};