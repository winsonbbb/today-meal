// src/types.ts
export interface Restaurant {
  id: number;
  name: string;
  disabled: boolean;
  lastChosen: string | null;
  cooldownDays: number;
  tags?: string[];
  rating?: number;
  locationLink?: string;   // NEW field for location URL
}
