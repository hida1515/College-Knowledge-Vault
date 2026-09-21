/**
 * Notification Service
 * College Knowledge Vault
 *
 * FCM Push Notification integration & event trigger wiring.
 */

import messaging from '@react-native-firebase/messaging';
import { supabase } from './supabase';

export interface PushNotificationPayload {
  recipientUserId?: string;
  recipientUserIds?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Requests notification permission from the user (Android 13+ / iOS).
 * @returns Whether permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return Boolean(enabled);
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Gets the FCM device token for push notifications.
 * @returns The FCM token string, or null if unavailable.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token || null;
  } catch (error) {
    console.warn('Failed to retrieve FCM token:', error);
    return null;
  }
}

/**
 * Saves or updates the FCM token for the user in the database.
 * @param userId - User ID
 * @param token - Optional explicit token, otherwise fetched from messaging()
 */
export async function saveFCMToken(userId: string, token?: string): Promise<boolean> {
  try {
    const fcmToken = token || (await getFCMToken());
    if (!fcmToken) return false;

    const { error } = await supabase
      .from('users')
      .update({ fcm_token: fcmToken })
      .eq('id', userId);

    if (error) {
      console.warn('Error saving FCM token in Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Failed to save FCM token:', error);
    return false;
  }
}

/**
 * Registers the device token with the backend (alias for saveFCMToken).
 */
export async function registerDeviceToken(userId: string, token: string): Promise<void> {
  await saveFCMToken(userId, token);
}

/**
 * Displays a local notification fallback or logs it.
 */
export async function displayLocalNotification(title: string, body: string): Promise<void> {
  // In development / fallback mode:
  console.log(`[Notification] ${title}: ${body}`);
}

/**
 * Invokes the Supabase Edge Function to send a push notification.
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: payload,
    });

    if (error) {
      console.warn('sendPushNotification error:', error);
      return false;
    }

    return Boolean(data?.success);
  } catch (error) {
    console.warn('Failed to invoke send-notification edge function:', error);
    return false;
  }
}

// ─── Event Notification Triggers ───

/**
 * Triggered when a senior's entry is approved.
 */
export async function notifyEntryApproved(
  authorId: string,
  entryId: string,
  title: string,
): Promise<boolean> {
  return sendPushNotification({
    recipientUserId: authorId,
    title: '🎉 Entry Approved!',
    body: `Your submission "${title}" has been published to the vault.`,
    data: {
      entryId,
      type: 'entry_approved',
    },
  });
}

/**
 * Triggered when an entry is rejected with reason.
 */
export async function notifyEntryRejected(
  authorId: string,
  entryId: string,
  title: string,
  reason: string,
): Promise<boolean> {
  return sendPushNotification({
    recipientUserId: authorId,
    title: 'Entry Needs Changes',
    body: `Your submission "${title}" was not approved. Reason: ${reason}`,
    data: {
      entryId,
      type: 'entry_rejected',
    },
  });
}

/**
 * Triggered when a faculty request is approved.
 */
export async function notifyFacultyRequestApproved(
  userId: string,
  collegeName: string,
): Promise<boolean> {
  return sendPushNotification({
    recipientUserId: userId,
    title: '✅ Faculty Access Granted',
    body: `Your faculty account for ${collegeName} has been approved.`,
    data: {
      type: 'faculty_approved',
    },
  });
}

/**
 * Triggered when a new entry is submitted, notifying faculty of that college.
 */
export async function notifyFacultyNewSubmission(
  collegeId: string,
  entryId: string,
  title: string,
  authorName: string,
): Promise<boolean> {
  try {
    // Find verified faculty of this college
    const { data: facultyMembers, error } = await supabase
      .from('users')
      .select('id')
      .eq('college_id', collegeId)
      .eq('role', 'faculty')
      .eq('status', 'active');

    if (error || !facultyMembers || facultyMembers.length === 0) {
      return false;
    }

    const recipientUserIds = facultyMembers.map((f: { id: string }) => f.id);

    return sendPushNotification({
      recipientUserIds,
      title: 'New Entry to Review',
      body: `${authorName} submitted "${title}" for moderation.`,
      data: {
        entryId,
        type: 'new_entry_submission',
      },
    });
  } catch (error) {
    console.warn('notifyFacultyNewSubmission error:', error);
    return false;
  }
}
