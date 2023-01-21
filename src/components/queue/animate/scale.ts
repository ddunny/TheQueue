/* eslint-disable react-hooks/exhaustive-deps */
import {
  QueueScale,
  QueueSquare,
  ScaleEffect,
} from '../../../model/object/rect';

export interface ScaleAnimation {
  fromScale: QueueScale;
  scaleEffect: ScaleEffect;
}

export const getCurrentScale = (
  object: QueueSquare,
  index: number
): QueueScale => {
  return object.effects
    .filter((effect) => effect.index <= index)
    .filter((effect): effect is ScaleEffect => effect.type === 'scale')
    .reduce<QueueScale>((_, effect) => effect.scale, object.scale);
};

export const getScaleAnimation = (
  object: QueueSquare,
  index: number,
  position: 'forward' | 'backward' | 'pause'
): ScaleAnimation | null => {
  if (position === 'pause') {
    return null;
  }

  const fromRect = getCurrentScale(
    object,
    position === 'forward' ? index - 1 : index + 1
  );

  const scaleEffect = object.effects.find((effect): effect is ScaleEffect => {
    const targetIndex = position === 'forward' ? index : index + 1;
    return effect.index === targetIndex && effect.type === 'scale';
  });

  if (!scaleEffect) {
    return null;
  }

  const slicedEffect: ScaleEffect =
    position === 'backward'
      ? {
          ...scaleEffect,
          scale: {
            ...getCurrentScale(object, index),
          },
        }
      : scaleEffect;

  return {
    fromScale: fromRect,
    scaleEffect: slicedEffect,
  };
};

export const getAnimatableScale = (
  progress: number,
  targetScale: QueueScale,
  fromScale?: QueueScale,
): QueueScale => {
  if (progress < 0 || !fromScale) {
    return targetScale;
  }
  return {
    scale: fromScale.scale + (targetScale.scale - fromScale.scale) * progress,
  };
};
