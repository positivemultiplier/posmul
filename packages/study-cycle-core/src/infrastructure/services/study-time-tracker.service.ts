import { DomainError, Result, failure, success } from "@posmul/shared-types";
import {
  StudySessionId,
  StudySessionStatus,
} from "../../domain/entities/study-session.entity";

export interface TimerState {
  readonly sessionId: StudySessionId;
  readonly status: StudySessionStatus;
  readonly startTime: Date;
  readonly elapsedSeconds: number;
  readonly lastSaveTime: Date;
  readonly autoSaveIntervalSeconds: number;
}

export interface TimerConfig {
  readonly autoSaveIntervalSeconds?: number;
  readonly visibilityChangeHandling?: boolean;
  readonly storageKey?: string;
}

export interface TimerCallbacks {
  onTick?: (state: TimerState) => void;
  onAutoSave?: (elapsedSeconds: number) => Promise<void>;
  onPause?: (reason: "manual" | "visibility" | "beforeunload") => void;
  onResume?: (reason: "manual" | "visibility") => void;
  onError?: (error: Error) => void;
}

export class StudyTimeTrackerService {
  private timerState: TimerState | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private autoSaveIntervalId: NodeJS.Timeout | null = null;
  private config: Required<TimerConfig>;
  private callbacks: TimerCallbacks;
  private isVisible: boolean = true;

  constructor(config: TimerConfig = {}, callbacks: TimerCallbacks = {}) {
    this.config = {
      autoSaveIntervalSeconds: config.autoSaveIntervalSeconds || 30,
      visibilityChangeHandling: config.visibilityChangeHandling ?? true,
      storageKey: config.storageKey || "study-timer-state",
    };
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  public startTimer(sessionId: StudySessionId): Result<void, DomainError> {
    try {
      if (this.timerState?.status === StudySessionStatus.ACTIVE) {
        return failure(
          new DomainError("Timer is already running", "TIMER_ALREADY_ACTIVE")
        );
      }

      const now = new Date();
      this.timerState = {
        sessionId,
        status: StudySessionStatus.ACTIVE,
        startTime: now,
        elapsedSeconds: 0,
        lastSaveTime: now,
        autoSaveIntervalSeconds: this.config.autoSaveIntervalSeconds,
      };

      this.saveStateToStorage();
      this.startInternalTimer();
      this.startAutoSaveTimer();

      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError(
          error instanceof Error ? error.message : "Failed to start timer",
          "TIMER_START_ERROR"
        )
      );
    }
  }

  public pauseTimer(
    reason: "manual" | "visibility" | "beforeunload" = "manual"
  ): Result<void, DomainError> {
    try {
      if (
        !this.timerState ||
        this.timerState.status !== StudySessionStatus.ACTIVE
      ) {
        return failure(
          new DomainError("No active timer to pause", "NO_ACTIVE_TIMER")
        );
      }

      this.timerState = {
        ...this.timerState,
        status: StudySessionStatus.PAUSED,
      };

      this.stopInternalTimer();
      this.stopAutoSaveTimer();
      this.saveStateToStorage();
      this.callbacks.onPause?.(reason);

      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError(
          error instanceof Error ? error.message : "Failed to pause timer",
          "TIMER_PAUSE_ERROR"
        )
      );
    }
  }

  public resumeTimer(
    reason: "manual" | "visibility" = "manual"
  ): Result<void, DomainError> {
    try {
      if (
        !this.timerState ||
        this.timerState.status !== StudySessionStatus.PAUSED
      ) {
        return failure(
          new DomainError("No paused timer to resume", "NO_PAUSED_TIMER")
        );
      }

      this.timerState = {
        ...this.timerState,
        status: StudySessionStatus.ACTIVE,
        startTime: new Date(),
      };

      this.saveStateToStorage();
      this.startInternalTimer();
      this.startAutoSaveTimer();
      this.callbacks.onResume?.(reason);

      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError(
          error instanceof Error ? error.message : "Failed to resume timer",
          "TIMER_RESUME_ERROR"
        )
      );
    }
  }

  public stopTimer(): Result<number, DomainError> {
    try {
      if (!this.timerState) {
        return failure(new DomainError("No timer to stop", "NO_TIMER_TO_STOP"));
      }

      const totalElapsedSeconds = this.timerState.elapsedSeconds;
      this.stopInternalTimer();
      this.stopAutoSaveTimer();
      this.clearStateFromStorage();
      this.timerState = null;

      return success(totalElapsedSeconds);
    } catch (error) {
      return failure(
        new DomainError(
          error instanceof Error ? error.message : "Failed to stop timer",
          "TIMER_STOP_ERROR"
        )
      );
    }
  }

  public restoreFromStorage(): Result<TimerState | null, DomainError> {
    try {
      const savedState = this.loadStateFromStorage();
      if (!savedState) {
        return success(null);
      }

      const now = new Date();
      const timeSinceLastSave = Math.floor(
        (now.getTime() - savedState.lastSaveTime.getTime()) / 1000
      );

      if (timeSinceLastSave > this.config.autoSaveIntervalSeconds * 3) {
        this.clearStateFromStorage();
        return success(null);
      }

      this.timerState = {
        ...savedState,
        elapsedSeconds: savedState.elapsedSeconds + timeSinceLastSave,
      };

      if (savedState.status === StudySessionStatus.ACTIVE) {
        this.startInternalTimer();
        this.startAutoSaveTimer();
      }

      return success(this.timerState);
    } catch (error) {
      return failure(
        new DomainError(
          error instanceof Error
            ? error.message
            : "Failed to restore timer state",
          "TIMER_RESTORE_ERROR"
        )
      );
    }
  }

  public getCurrentState(): TimerState | null {
    return this.timerState ? { ...this.timerState } : null;
  }

  private updateElapsedTime(): void {
    if (
      !this.timerState ||
      this.timerState.status !== StudySessionStatus.ACTIVE
    ) {
      return;
    }

    this.timerState = {
      ...this.timerState,
      elapsedSeconds: this.timerState.elapsedSeconds + 1,
    };

    this.callbacks.onTick?.(this.timerState);
  }

  private startInternalTimer(): void {
    this.stopInternalTimer();
    this.intervalId = setInterval(() => {
      this.updateElapsedTime();
    }, 1000);
  }

  private stopInternalTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private startAutoSaveTimer(): void {
    this.stopAutoSaveTimer();
    this.autoSaveIntervalId = setInterval(async () => {
      if (this.timerState && this.callbacks.onAutoSave) {
        try {
          await this.callbacks.onAutoSave(this.timerState.elapsedSeconds);
          this.timerState = {
            ...this.timerState,
            lastSaveTime: new Date(),
          };
          this.saveStateToStorage();
        } catch (error) {
          this.callbacks.onError?.(
            error instanceof Error ? error : new Error("Auto save failed")
          );
        }
      }
    }, this.config.autoSaveIntervalSeconds * 1000);
  }

  private stopAutoSaveTimer(): void {
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
      this.autoSaveIntervalId = null;
    }
  }

  private setupEventListeners(): void {
    if (typeof window === "undefined") return;

    if (this.config.visibilityChangeHandling) {
      document.addEventListener("visibilitychange", () => {
        const isCurrentlyVisible = !document.hidden;

        if (isCurrentlyVisible && !this.isVisible) {
          if (this.timerState?.status === StudySessionStatus.PAUSED) {
            this.resumeTimer("visibility");
          }
        } else if (!isCurrentlyVisible && this.isVisible) {
          if (this.timerState?.status === StudySessionStatus.ACTIVE) {
            this.pauseTimer("visibility");
          }
        }

        this.isVisible = isCurrentlyVisible;
      });
    }

    window.addEventListener("beforeunload", () => {
      if (this.timerState?.status === StudySessionStatus.ACTIVE) {
        this.pauseTimer("beforeunload");
      }
    });
  }

  private saveStateToStorage(): void {
    if (typeof window === "undefined" || !this.timerState) return;

    try {
      const stateToSave = {
        ...this.timerState,
        startTime: this.timerState.startTime.toISOString(),
        lastSaveTime: this.timerState.lastSaveTime.toISOString(),
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      this.callbacks.onError?.(
        new Error("Failed to save timer state to storage")
      );
    }
  }

  private loadStateFromStorage(): TimerState | null {
    if (typeof window === "undefined") return null;

    try {
      const savedData = localStorage.getItem(this.config.storageKey);
      if (!savedData) return null;

      const parsed = JSON.parse(savedData);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        lastSaveTime: new Date(parsed.lastSaveTime),
      };
    } catch (error) {
      this.callbacks.onError?.(
        new Error("Failed to load timer state from storage")
      );
      return null;
    }
  }

  private clearStateFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      this.callbacks.onError?.(
        new Error("Failed to clear timer state from storage")
      );
    }
  }

  public destroy(): void {
    this.stopInternalTimer();
    this.stopAutoSaveTimer();
    this.clearStateFromStorage();
    this.timerState = null;
  }
}
