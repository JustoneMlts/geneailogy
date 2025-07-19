import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export class formatDate {
  static getUnixTimeStamp = (dateAsUnixTimeStamp: Date): number =>
    dateAsUnixTimeStamp.getTime();

  static formatUnixTimeStampToDate = (unixTimeStamp: number): Date =>
    new Date(unixTimeStamp);
}