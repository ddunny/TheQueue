import { generateUUID } from 'cdk/functions/uuid';
import { QueueDocumentRect } from 'model/document';
import { WithEffects } from 'model/effect';
import { WithFade, WithFill, WithRect, WithRotation, WithScale, WithStroke, WithText } from 'model/property';

export interface QueueIcon
  extends WithEffects,
    WithRect,
    WithFade,
    WithFill,
    WithScale,
    WithRotation,
    WithStroke,
    WithText {
  type: 'icon';
  iconType: string;
  uuid: string;
}

export const createDefaultIcon = (documentRect: QueueDocumentRect, queueIndex: number, iconType: string): QueueIcon => {
  const width = 300;
  const height = 300;
  return {
    type: 'icon',
    iconType: iconType,
    uuid: generateUUID(),
    rect: {
      x: documentRect.width / 2 - width / 2,
      y: documentRect.height / 2 - height / 2,
      width: width,
      height: height,
    },
    fill: {
      color: '#000000',
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
    stroke: {
      color: '#000000',
      dasharray: '',
      width: 0,
    },
    effects: [
      {
        type: 'create',
        timing: 'linear',
        duration: 0,
        index: queueIndex,
        prop: undefined,
      },
    ],
  };
};
