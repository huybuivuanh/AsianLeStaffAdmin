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
    updatedAt: Date;
  }

  /** A single work shift (clock in only) */
  interface Shift {
    id: string;
    userId: string;
    userName: string;
    clockInTime: Date;
    date: string;
  }

  /** Legacy / alias */
  interface ClockInRecord {
    id: string;
    userId: string;
    userName: string;
    clockInTime: Date;
    clockOutTime?: Date;
    status: "clocked-in" | "clocked-out";
  }

  interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
  }
}

export {};
