// src/lib/utils.ts
// Utility functions for React Native
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 * Works with NativeWind in React Native
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
