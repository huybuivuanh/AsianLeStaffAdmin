/**
 * Global type definitions — use these types without importing.
 * Add new shared types here.
 */
declare global {
  interface User {
    id: string;
    name: string;
    pin: string;
    createdAt: Date;
    updatedAt?: Date;
  }

  /** Schedule or completed shift (unified) */
  interface Shift {
    id: string;
    userId: string;
    userName: string;
    shiftStarts: Date;
    shiftEnds: Date;
    date: string;
    clockInTime?: Date | null;
    actualHours?: number;
    status?: "scheduled" | "completed" | "cancelled";
  }
}

export {};
