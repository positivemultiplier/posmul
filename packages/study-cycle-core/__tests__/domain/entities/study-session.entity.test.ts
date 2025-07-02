import { StudySession, StudySessionStatus, createStudySessionId, createUserId, createChapterId, ChapterId } from '../../../src/domain/entities/study-session.entity';
import { TextbookId } from '../../../src/domain/entities/textbook.entity';
import { DomainError } from '@posmul/shared-types';

// 헬퍼 함수들 정의
const createTextbookId = (id: string): TextbookId => id as TextbookId;

describe('StudySession', () => {
  const mockUserId = createUserId('user123');
  const mockTextbookId = createTextbookId('textbook123');
  const mockChapterId = createChapterId('chapter123');

  beforeEach(() => {
    // Mock crypto.randomUUID for consistent IDs in tests
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid-1234-5678-9012-345678901234');
    // Mock Date for consistent timestamps
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-02T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should create a new active study session', () => {
    const result = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const session = result.data;
      expect(session).toBeInstanceOf(StudySession);
      expect(session.id).toBe('mock-uuid-1234-5678-9012-345678901234');
      expect(session.userId).toBe(mockUserId);
      expect(session.textbookId).toBe(mockTextbookId);
      expect(session.status).toBe(StudySessionStatus.ACTIVE);
      expect(session.startTime).toEqual(new Date('2024-07-02T10:00:00Z'));
      expect(session.pagesCompleted).toBe(0);
      expect(session.notesCount).toBe(0);
      expect(session.difficultyRatings).toEqual([]);
      expect(session.comprehensionRatings).toEqual([]);
    }
  });

  it('should reconstruct a study session from persistence', () => {
    const row = {
      id: 'persisted-id',
      user_id: 'user456',
      textbook_id: 'textbook456',
      start_time: '2024-07-01T09:00:00Z',
      created_at: '2024-07-01T08:00:00Z',
    };

    const session = StudySession.fromPersistence(row);

    expect(session).toBeInstanceOf(StudySession);
    expect(session.id).toBe('persisted-id');
    expect(session.userId).toBe('user456');
    expect(session.textbookId).toBe('textbook456');
    expect(session.startTime).toEqual(new Date('2024-07-01T09:00:00Z'));
    expect(session.status).toBe(StudySessionStatus.ACTIVE);
    expect(session.createdAt).toEqual(new Date('2024-07-01T08:00:00Z'));
  });

  it('should end an active study session', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    jest.advanceTimersByTime(3600 * 1000); // Advance by 1 hour

    const endResult = session.endSession();

    expect(endResult.success).toBe(true);
    if (endResult.success) {
      const summary = endResult.data;
      expect(session.status).toBe(StudySessionStatus.COMPLETED);
      expect(session.endTime).toEqual(new Date('2024-07-02T11:00:00Z'));
      expect(session.durationSeconds).toBe(3600);
      expect(summary.totalTimeMinutes).toBe(60);
    }
  });

  it('should not end a non-active study session', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;
    session.cancelSession(); // Cancel the session

    const endResult = session.endSession();

    expect(endResult.success).toBe(false);
    if (!endResult.success) {
      expect(endResult.error).toBeInstanceOf(DomainError);
      expect(endResult.error.message).toBe('Can only end an active study session');
    }
  });

  it('should record progress for an active session', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    const progressData = {
      pagesRead: 10,
      timeSpentMinutes: 30,
      notesCount: 2,
      difficultyRating: 4,
      comprehensionRating: 3,
    };

    const recordResult = session.recordProgress(progressData);

    expect(recordResult.success).toBe(true);
    expect(session.pagesCompleted).toBe(10);
    expect(session.notesCount).toBe(2);
    expect(session.difficultyRatings).toEqual([4]);
    expect(session.comprehensionRatings).toEqual([3]);
  });

  it('should not record progress for a non-active session', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;
    session.pauseSession(); // Pause the session

    const progressData = {
      pagesRead: 10,
      timeSpentMinutes: 30,
      notesCount: 2,
      difficultyRating: 4,
      comprehensionRating: 3,
    };

    const recordResult = session.recordProgress(progressData);

    expect(recordResult.success).toBe(false);
    if (!recordResult.success) {
      expect(recordResult.error).toBeInstanceOf(DomainError);
      expect(recordResult.error.message).toBe('Can only record progress during an active study session');
    }
  });

  it('should pause and resume a study session', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    jest.advanceTimersByTime(1800 * 1000); // Advance by 30 minutes
    const pauseResult = session.pauseSession();

    expect(pauseResult.success).toBe(true);
    expect(session.status).toBe(StudySessionStatus.PAUSED);
    expect(session.durationSeconds).toBe(1800);

    jest.advanceTimersByTime(600 * 1000); // Advance by 10 minutes (paused time)
    const resumeResult = session.resumeSession();

    expect(resumeResult.success).toBe(true);
    expect(session.status).toBe(StudySessionStatus.ACTIVE);
    // Start time should be updated to current time for active duration calculation
    expect(session.startTime).toEqual(new Date('2024-07-02T10:40:00Z'));

    jest.advanceTimersByTime(1800 * 1000); // Advance by another 30 minutes
    session.endSession();
    expect(session.durationSeconds).toBe(3600); // Total 60 minutes
  });

  it('should calculate average ratings correctly', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    session.recordProgress({
      pagesRead: 0, timeSpentMinutes: 0, notesCount: 0,
      difficultyRating: 5, comprehensionRating: 4
    });
    session.recordProgress({
      pagesRead: 0, timeSpentMinutes: 0, notesCount: 0,
      difficultyRating: 3, comprehensionRating: 5
    });

    expect(session.calculateAverageRating(session.difficultyRatings)).toBe(4);
    expect(session.calculateAverageRating(session.comprehensionRatings)).toBe(4.5);
  });

  it('should return 0 for average rating if no ratings are present', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    expect(session.calculateAverageRating([])).toBe(0);
  });

  it('should correctly calculate progress percentage with targets', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
      config: { targetPages: 100, targetTimeMinutes: 60 }
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    // Simulate some progress
    session.recordProgress({
      pagesRead: 25, timeSpentMinutes: 0, notesCount: 0,
      difficultyRating: 3, comprehensionRating: 3
    });
    jest.advanceTimersByTime(1800 * 1000); // 30 minutes
    
    // Check progress while still ACTIVE (should include current time)
    // 25% pages, 50% time -> (25+50)/2 = 37.5%
    expect(session.getProgressPercentage()).toBeCloseTo(37.5);
    
    session.pauseSession();

    // After pause, should still be 37.5% since duration is saved
    expect(session.getProgressPercentage()).toBeCloseTo(37.5);

    session.resumeSession();
    jest.advanceTimersByTime(1800 * 1000); // another 30 minutes
    session.endSession();

    // 25% pages, 100% time -> (25+100)/2 = 62.5%
    expect(session.getProgressPercentage()).toBeCloseTo(62.5);
  });

  it('should return 0 progress percentage if no targets are set', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    expect(session.getProgressPercentage()).toBe(0);
  });

  it('should correctly determine if targets are met', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
      config: { targetPages: 10, targetTimeMinutes: 1 }
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    expect(session.areTargetsMet()).toBe(false);

    session.recordProgress({
      pagesRead: 10, timeSpentMinutes: 0, notesCount: 0,
      difficultyRating: 3, comprehensionRating: 3
    });
    jest.advanceTimersByTime(60 * 1000); // 1 minute
    
    // Check while ACTIVE - should be true now
    expect(session.areTargetsMet()).toBe(true);
    
    session.pauseSession();

    // Should still be true after pause
    expect(session.areTargetsMet()).toBe(true);
  });

  it('should handle invalid progress data', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    // Invalid difficulty rating
    let recordResult = session.recordProgress({
      pagesRead: 1, timeSpentMinutes: 1, notesCount: 1,
      difficultyRating: 6, comprehensionRating: 3
    });
    expect(recordResult.success).toBe(false);
    if (!recordResult.success) {
      expect(recordResult.error.message).toBe('Difficulty rating must be between 1 and 5');
    }

    // Invalid comprehension rating
    recordResult = session.recordProgress({
      pagesRead: 1, timeSpentMinutes: 1, notesCount: 1,
      difficultyRating: 3, comprehensionRating: 0
    });
    expect(recordResult.success).toBe(false);
    if (!recordResult.success) {
      expect(recordResult.error.message).toBe('Comprehension rating must be between 1 and 5');
    }

    // Negative values
    recordResult = session.recordProgress({
      pagesRead: -1, timeSpentMinutes: 1, notesCount: 1,
      difficultyRating: 3, comprehensionRating: 3
    });
    expect(recordResult.success).toBe(false);
    if (!recordResult.success) {
      expect(recordResult.error.message).toBe('Progress values cannot be negative');
    }
  });

  it('should convert to insert format', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
      chapterId: mockChapterId
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    const insertData = session.toInsert();
    expect(insertData.id).toBe(session.id);
    expect(insertData.user_id).toBe(session.userId);
    expect(insertData.textbook_id).toBe(session.textbookId);
    expect(insertData.chapter_id).toBe(session.chapterId);
    expect(insertData.start_time).toBe(session.startTime.toISOString());
    expect(insertData.end_time).toBeNull();
  });

  it('should convert to update format', () => {
    const createResult = StudySession.create({
      userId: mockUserId,
      textbookId: mockTextbookId,
    });
    
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    
    const session = createResult.data;

    jest.advanceTimersByTime(3600 * 1000); // Advance by 1 hour
    session.endSession();

    const updateData = session.toUpdate();
    expect(updateData.end_time).toBe(session.endTime?.toISOString());
    expect(updateData.duration_seconds).toBe(session.durationSeconds);
  });
});
