import { QueueRect } from 'model/property/rect';
import { BaseQueueEffect } from './base';

export interface MoveEffect extends BaseQueueEffect<QueueRect> {
  type: 'rect';
}
