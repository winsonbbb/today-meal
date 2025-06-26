// src/types.ts
export interface Restaurant {
  id: string;
  name: string;
  disabled: boolean;
  lastChosen: string | null;
  cooldownDays: number;
  tags?: string[];
  rating?: number;
  locationLink?: string;
  drawHistory?: string[]; 
}
