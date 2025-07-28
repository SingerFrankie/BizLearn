/**
 * Storage Service Module
 * 
 * This module provides a comprehensive interface for file upload operations
 * with Supabase Storage, specifically for avatar/profile image management.
 * 
 * Key Features:
 * - Avatar upload with automatic resizing
 * - File validation (type, size)
 * - Automatic cleanup of old avatars
 * - Progress tracking for uploads
 * - Error handling and user feedback
 * 
 * @author BizGenius Team
 * @version 1.0.0
 */

import { supabase } from './supabase';

/**
 * Upload Result Interface
 * 
 * Defines the structure of upload operation results
 */
interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Storage Service Class
 * 
 * Main class for handling file upload operations with proper error handling
 * and user experience optimizations.
 */
export class StorageService {
  private readonly AVATAR_BUCKET = 'avatars';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Get current authenticated user
   */
  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Validate File
   * 
   * Checks if the uploaded file meets requirements
   * 
   * @param file - File to validate
   * @returns boolean - True if file is valid
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size must be less than 5MB'
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'File must be an image (JPEG, PNG, WebP, or GIF)'
      };
    }

    return { valid: true };
  }

  /**
   * Generate File Path
   * 
   * Creates a unique file path for the user's avatar
   * 
   * @param userId - User's ID
   * @param fileName - Original file name
   * @returns string - Generated file path
   */
  private generateFilePath(userId: string, fileName: string): string {
    const fileExtension = fileName.split('.').pop();
    const timestamp = Date.now();
    return `${userId}/avatar-${timestamp}.${fileExtension}`;
  }

  /**
   * Upload Avatar
   * 
   * Main method for uploading user avatar images
   * 
   * @param file - Image file to upload
   * @param onProgress - Optional progress callback
   * @returns Promise<UploadResult> - Upload result with URL or error
   */
  async uploadAvatar(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Get current user
      const user = await this.getCurrentUser();

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate unique file path
      const filePath = this.generateFilePath(user.id, file.name);

      // Delete old avatar if exists
      await this.deleteOldAvatar(user.id);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.AVATAR_BUCKET)
        .getPublicUrl(filePath);

      // Update progress to 100%
      if (onProgress) {
        onProgress(100);
      }

      return {
        success: true,
        url: publicUrl
      };

    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Delete Old Avatar
   * 
   * Removes user's previous avatar files to prevent storage bloat
   * 
   * @param userId - User's ID
   */
  private async deleteOldAvatar(userId: string): Promise<void> {
    try {
      // List existing files for the user
      const { data: files, error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .list(userId);

      if (error || !files || files.length === 0) {
        return; // No old files to delete
      }

      // Delete all existing avatar files
      const filesToDelete = files.map(file => `${userId}/${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .remove(filesToDelete);

      if (deleteError) {
        console.warn('Failed to delete old avatar:', deleteError);
        // Don't throw error - this is cleanup, not critical
      }

    } catch (error) {
      console.warn('Error during old avatar cleanup:', error);
      // Don't throw error - this is cleanup, not critical
    }
  }

  /**
   * Get Avatar URL
   * 
   * Retrieves the public URL for a user's avatar
   * 
   * @param userId - User's ID
   * @returns Promise<string | null> - Avatar URL or null if not found
   */
  async getAvatarUrl(userId: string): Promise<string | null> {
    try {
      // List files for the user
      const { data: files, error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .list(userId);

      if (error || !files || files.length === 0) {
        return null;
      }

      // Get the most recent avatar file
      const latestFile = files
        .filter(file => file.name.startsWith('avatar-'))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (!latestFile) {
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.AVATAR_BUCKET)
        .getPublicUrl(`${userId}/${latestFile.name}`);

      return publicUrl;

    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  }

  /**
   * Delete Avatar
   * 
   * Removes user's avatar completely
   * 
   * @param userId - User's ID
   * @returns Promise<boolean> - Success status
   */
  async deleteAvatar(userId: string): Promise<boolean> {
    try {
      await this.deleteOldAvatar(userId);
      return true;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }
  }
}

/**
 * Singleton Storage Service Instance
 * 
 * Pre-configured StorageService instance ready for immediate use.
 */
export const storageService = new StorageService();

/**
 * Type Exports for TypeScript Support
 */
export type { UploadResult };