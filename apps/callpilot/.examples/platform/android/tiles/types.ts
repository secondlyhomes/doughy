/**
 * Types for Android Quick Settings Tiles
 */

/**
 * Tile state types
 */
export enum TileState {
  INACTIVE = 0,
  ACTIVE = 1,
  UNAVAILABLE = 2,
}

/**
 * Tile configuration
 */
export interface TileConfig {
  label: string;
  subtitle?: string;
  icon: string;
  state: TileState;
  contentDescription?: string;
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  source?: 'voice' | 'manual';
}

/**
 * Dialog options for tile dialogs
 */
export interface DialogOptions {
  title: string;
  message: string;
  positiveButton: string;
  negativeButton: string;
}

/**
 * Voice recognition options
 */
export interface VoiceRecognitionOptions {
  prompt: string;
  language: string;
}

/**
 * Voice recognition result
 */
export interface VoiceRecognitionResult {
  text?: string;
}

/**
 * Activity start options
 */
export interface StartActivityOptions {
  action: string;
  data: string;
}

/**
 * Tile manager interface
 */
export interface ITileManager {
  initialize(): Promise<void>;
  handleClick?(): Promise<void>;
  cleanup?(): void;
}
