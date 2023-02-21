/* eslint-disable react-hooks/exhaustive-deps */
import { MoveEffect } from 'model/effect';
import { QueueObjectType } from 'model/object';
import { QueueRect } from 'model/property';

export interface RectAnimation {
  fromRect: QueueRect;
  moveEffect: MoveEffect;
}

/**
 * @description
 * 특정 오브젝트의 특정 큐 인덱스에 해당하는 크기 반환
 */
export const getCurrentRect = (object: QueueObjectType, index: number): QueueRect => {
  return object.effects
    .filter((effect) => effect.index <= index)
    .filter((effect): effect is MoveEffect => effect.type === 'rect')
    .reduce<QueueRect>((_, effect) => effect.rect, object.rect);
};

export const getRectAnimation = (
  object: QueueObjectType,
  index: number,
  position: 'forward' | 'backward' | 'pause',
): RectAnimation | null => {
  if (position === 'pause') {
    return null;
  }

  const fromRect = getCurrentRect(object, position === 'forward' ? index - 1 : index + 1);

  const moveEffect = object.effects.find((effect): effect is MoveEffect => {
    const targetIndex = position === 'forward' ? index : index + 1;
    return effect.index === targetIndex && effect.type === 'rect';
  });

  if (!moveEffect) {
    return null;
  }

  const slicedEffect: MoveEffect =
    position === 'backward'
      ? {
          ...moveEffect,
          rect: {
            ...getCurrentRect(object, index),
          },
        }
      : moveEffect;

  return {
    fromRect: fromRect,
    moveEffect: slicedEffect,
  };
};

export const getAnimatableRect = (progress: number, targetRect: QueueRect, fromRect?: QueueRect): QueueRect => {
  if (progress < 0 || !fromRect) {
    return targetRect;
  }
  return {
    x: fromRect.x + (targetRect.x - fromRect.x) * progress,
    y: fromRect.y + (targetRect.y - fromRect.y) * progress,
    width: fromRect.width + (targetRect.width - fromRect.width) * progress,
    height: fromRect.height + (targetRect.height - fromRect.height) * progress,
  };
};
