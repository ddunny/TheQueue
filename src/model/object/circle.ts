import { BaseObject, CreateEffect, RemoveEffect } from './object';
import { FadeEffect, FillEffect, MoveEffect, QueueFade, QueueFill, QueueRect, QueueRotate, QueueScale, QueueStroke, QueueText, RotateEffect, ScaleEffect, StrokeEffect, TextEffect } from './rect';

export interface QueueCircle extends BaseObject {
  type: 'circle';
  uuid: string;
  rect: QueueRect;
  fade: QueueFade;
  fill: QueueFill;
  scale: QueueScale;
  rotate: QueueRotate;
  stroke: QueueStroke;
  text: QueueText;
  effects: (
    | CreateEffect
    | MoveEffect
    | StrokeEffect
    | FillEffect
    | TextEffect
    | FadeEffect
    | RemoveEffect
    | ScaleEffect
    | RotateEffect
  )[];
}
