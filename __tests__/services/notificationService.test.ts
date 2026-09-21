import {
  requestNotificationPermission,
  getFCMToken,
  saveFCMToken,
  sendPushNotification,
  notifyEntryApproved,
  notifyEntryRejected,
  notifyFacultyRequestApproved,
  notifyFacultyNewSubmission,
} from '../../src/core/services/notificationService';
import { supabase } from '../../src/core/services/supabase';

jest.mock('../../src/core/services/supabase', () => {
  const mockFrom = jest.fn();
  const mockFunctions = {
    invoke: jest.fn(() => Promise.resolve({ data: { success: true }, error: null })),
  };

  return {
    supabase: {
      from: mockFrom,
      functions: mockFunctions,
    },
  };
});

describe('Notification Service (FIX 13)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('test 1: requests notification permission and returns true when authorized', async () => {
    const granted = await requestNotificationPermission();
    expect(granted).toBe(true);
  });

  test('test 2: retrieves FCM device token', async () => {
    const token = await getFCMToken();
    expect(token).toBe('mock-fcm-device-token-xyz');
  });

  test('test 3: saves FCM token to user profile in Supabase', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    (supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
    });

    const success = await saveFCMToken('user-123', 'custom-token-abc');
    expect(success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(mockUpdate).toHaveBeenCalledWith({ fcm_token: 'custom-token-abc' });
  });

  test('test 4: sends push notification via Supabase Edge Function', async () => {
    const success = await sendPushNotification({
      recipientUserId: 'user-abc',
      title: 'Hello',
      body: 'World',
      data: { key: 'val' },
    });

    expect(success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-notification', {
      body: {
        recipientUserId: 'user-abc',
        title: 'Hello',
        body: 'World',
        data: { key: 'val' },
      },
    });
  });

  test('test 5: notifyEntryApproved sends congratulations notification with entryId', async () => {
    await notifyEntryApproved('author-1', 'entry-99', 'Smart City IoT');

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({
        body: expect.objectContaining({
          recipientUserId: 'author-1',
          title: '🎉 Entry Approved!',
          data: { entryId: 'entry-99', type: 'entry_approved' },
        }),
      }),
    );
  });

  test('test 6: notifyEntryRejected sends rejection note with reason', async () => {
    await notifyEntryRejected('author-1', 'entry-99', 'Smart City IoT', 'Please provide report');

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({
        body: expect.objectContaining({
          recipientUserId: 'author-1',
          title: 'Entry Needs Changes',
          body: expect.stringContaining('Please provide report'),
          data: { entryId: 'entry-99', type: 'entry_rejected' },
        }),
      }),
    );
  });

  test('test 7: notifyFacultyRequestApproved sends approval alert to verified faculty', async () => {
    await notifyFacultyRequestApproved('faculty-user-1', 'Model Engineering College');

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({
        body: expect.objectContaining({
          recipientUserId: 'faculty-user-1',
          title: '✅ Faculty Access Granted',
          body: expect.stringContaining('Model Engineering College'),
        }),
      }),
    );
  });

  test('test 8: notifyFacultyNewSubmission finds college faculty and dispatches review alert', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockImplementation((col: string, _val: string) => {
      if (col === 'status') {
        return Promise.resolve({
          data: [{ id: 'faculty-1' }, { id: 'faculty-2' }],
          error: null,
        });
      }
      return { eq: mockEq };
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    });

    const success = await notifyFacultyNewSubmission(
      'college-mec',
      'entry-101',
      'AI Compiler',
      'Alice Senior',
    );

    expect(success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'send-notification',
      expect.objectContaining({
        body: expect.objectContaining({
          recipientUserIds: ['faculty-1', 'faculty-2'],
          title: 'New Entry to Review',
          body: expect.stringContaining('Alice Senior submitted "AI Compiler"'),
          data: { entryId: 'entry-101', type: 'new_entry_submission' },
        }),
      }),
    );
  });
});
