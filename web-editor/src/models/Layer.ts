import type { AnyElement } from './Element';

/**
 * Layer represents a visual element in the animation timeline
 */
export interface Layer {
  id: string;
  name: string;
  element: AnyElement;
  visible: boolean;
  locked: boolean;
  parentId?: string; // for hierarchy
}
