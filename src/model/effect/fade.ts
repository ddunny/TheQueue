import { QueueFade } from 'model/property/fade';
import { BaseQueueEffect } from './base';

export interface FadeEffect extends BaseQueueEffect<QueueFade> {
  type: 'fade';
}
