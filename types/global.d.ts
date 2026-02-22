declare global {
  interface User {
    id: string;
    name: string;
    pin: string;
    createdAt: Date;
    updatedAt?: Date;
  }

  interface TimeRange {
    start: Date;
    end: Date;
  }

  interface Shift {
    id: string;
    userId: string;
    userName: string;
    shift: TimeRange;
    date: string;
    clockInTime?: Date | null;
    actualHours?: number;
  }
}

export {};
