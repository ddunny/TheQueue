import { QueueDocumentRect } from 'model/document';
import { WithEffects } from 'model/effect';
import { WithFade, WithFill, WithRect, WithRotation, WithScale, WithStroke, WithText } from 'model/property';
import { EntityId, nanoid } from '@reduxjs/toolkit';

export interface QueueSquare
  extends WithEffects,
    WithRect,
    WithFade,
    WithFill,
    WithRotation,
    WithScale,
    WithStroke,
    WithText {
  type: 'rect';
  index: number;
  id: EntityId;
}

export const createDefaultSquare = (documentRect: QueueDocumentRect, queueIndex: number): QueueSquare => {
  const width = 300;
  const height = 300;
  const objectId = nanoid();
  return {
    type: 'rect',
    id: objectId,
    index: 0,
    rect: {
      x: documentRect.width / 2 - width / 2,
      y: documentRect.height / 2 - height / 2,
      width: width,
      height: height,
    },
    stroke: {
      width: 1,
      color: '#000000',
      dasharray: 'solid',
    },
    fill: {
      color: '#ffffff',
      opacity: 1,
    },
    rotate: {
      degree: 0,
    },
    scale: {
      scale: 1,
    },
    fade: {
      opacity: 1,
    },
    text: {
      text: '',
      fontSize: 24,
      fontColor: '#000000',
      fontFamily: 'Arial',
      horizontalAlign: 'center',
      verticalAlign: 'middle',
    },
    effects: [
      {
        id: nanoid(),
        type: 'create',
        timing: 'linear',
        objectId: objectId,
        duration: 0,
        delay: 0,
        index: queueIndex,
        prop: undefined,
      },
    ],
  };
};
