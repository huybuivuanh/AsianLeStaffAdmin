declare global {
  interface User {
    id: string;
    name: string;
    pin: string;
    server: boolean;
    createdAt: Date;
    updatedAt?: Date;
  }

  interface TimeRange {
    start: Date;
    end: Date;
  }

  interface Tips {
    id: string;
    date: string;
    morningCash: number | 0;
    morningCard: number | 0;
    afternoonCash: number | 0;
    afternoonCard: number | 0;
    total: number | 0;
  }

  interface Shift {
    id: string;
    userId: string;
    userName: string;
    shift: TimeRange;
    break: TimeRange | null;
    tips: number | 0;
    date: string;
    clockInTime: Date | null;
    actualHours?: number;
    noShift: boolean;
  }
}

export {};
