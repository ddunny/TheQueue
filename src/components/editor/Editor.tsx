/* eslint-disable @typescript-eslint/no-unused-vars */
import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { FunctionComponent, useRef, useState } from 'react';
import { Drawable, DrawEvent } from '../../cdk/draw/Draw';
import { QueueObject } from '../queue/EditableObject';
import { documentState, QueueDocumentRect } from '../../store/document';
import {
  isExistObjectOnQueue,
  QueueSquareRect,
  QueueSquare,
} from '../../model/object/rect';
import { Scaler } from '../scaler/Scaler';
import { getCurrentRect } from '../queue/animate/rect';
import { useRecoilState } from 'recoil';
import { documentSettingsState } from '../../store/settings';

const Selector = styled.div`
  width: 100%;
  height: 100%;
  border: 1px solid gray;
  background-color: rgba(0, 0, 0, 0.2);
`;

export interface QueueEditorContextType {
  selectedObjectIds: string[];
  queueIndex: number;
  scale: number;
  documentRect: QueueDocumentRect;
  objects: QueueSquare[];
  currentQueueObjects: QueueSquare[];
}

export interface RectUpdateModel {
  uuid: string;
  queueIndex: number;
  rect: QueueSquareRect;
}

export const QueueEditor: FunctionComponent = () => {
  const canvasDiv = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState<QueueSquareRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [queueDocument, setQueueDocument] = useRecoilState(documentState);
  const [settings, setSettings] = useRecoilState(documentSettingsState);
  const currentQueueObjects = queueDocument.objects.filter((object) =>
    isExistObjectOnQueue(object, settings.queueIndex)
  );

  const onObjectRectUpdate = (models: RectUpdateModel[]): void => {
    const newObjects = queueDocument.objects.map((object) => {
      const model = models.find((model) => model.uuid === object.uuid);
      if (!model) {
        return object;
      }
      const slicedObject = { ...object, effects: object.effects.slice(0) };
      const createEffectIndex = object.effects.find(
        (effect) => effect.type === 'create'
      )!.index;
      const moveEffectIndex = object.effects.findIndex(
        (effect) => effect.type === 'move' && effect.index === model.queueIndex
      );

      if (createEffectIndex === model.queueIndex) {
        slicedObject.rect = model.rect;
      }

      if (createEffectIndex !== model.queueIndex && moveEffectIndex !== -1) {
        slicedObject.effects[moveEffectIndex] = {
          ...slicedObject.effects[moveEffectIndex],
          type: 'move',
          rect: {
            ...model.rect,
          },
        };
      }

      if (createEffectIndex !== model.queueIndex && moveEffectIndex === -1) {
        slicedObject.effects.push({
          type: 'move',
          index: model.queueIndex,
          duration: 1000,
          rect: {
            ...model.rect,
          },
        });
        slicedObject.effects.sort((a, b) => a.index - b.index);
      }

      return slicedObject;
    });
    setQueueDocument({ ...queueDocument, objects: newObjects });
    setSettings({ ...settings, queuePosition: 'pause' });
    return;
  };

  const onObjectMouseodown = (
    event: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
    object: QueueSquare
  ): void => {
    let slicedSelectedObjectIds = [...settings.selectedObjects];
    const selected = settings.selectedObjects.includes(object.uuid);
    const initX = event.clientX;
    const initY = event.clientY;
    let diffX = 0;
    let diffY = 0;

    if (!selected) {
      setSettings({
        ...settings,
        selectedObjects: [object.uuid],
      });
      slicedSelectedObjectIds = [object.uuid];
    }

    const mover = (event: MouseEvent): void => {
      if (
        Math.abs(event.clientX - initX) < 5 &&
        Math.abs(event.clientY - initY)
      ) {
        return;
      }
      const x = event.clientX - initX;
      const y = event.clientY - initY;
      const currentScale = 1 / settings.scale;
      setTranslate({
        x: x * currentScale,
        y: y * currentScale,
        width: 0,
        height: 0,
      });
      diffX = x * currentScale;
      diffY = y * currentScale;
    };

    const finish = (event: MouseEvent): void => {
      const updateModels = queueDocument.objects
        .filter((object) => slicedSelectedObjectIds.includes(object.uuid))
        .map<RectUpdateModel>((object) => {
          const rect = getCurrentRect(object, settings.queueIndex);
          return {
            uuid: object.uuid,
            queueIndex: settings.queueIndex,
            rect: {
              x: rect.x + diffX,
              y: rect.y + diffY,
              width: rect.width,
              height: rect.height,
            },
          };
        });
      onObjectRectUpdate(updateModels);
      document.removeEventListener('mousemove', mover);
      document.removeEventListener('mouseup', finish);
      setTranslate({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    };

    document.addEventListener('mousemove', mover);
    document.addEventListener('mouseup', finish);
  };

  /**
   * @description
   * 드로잉 시작 시 시작 지점에 오브젝트가 있으면 드로잉을 취소 (오브젝트 이동 동작을 수행해야 함)
   */
  const onDrawStart = (event: DrawEvent, cancel: () => void): void => {
    if (!canvasDiv.current) {
      return;
    }
    const rect = canvasDiv.current.getBoundingClientRect();
    const absScale = 1 / settings.scale;
    const x = (event.drawClientX - rect.x) * absScale;
    const y = (event.drawClientY - rect.y) * absScale;
    const hasSelectableObject = queueDocument.objects.some((object) => {
      const rect = getCurrentRect(object, settings.queueIndex);
      return (
        rect.x <= x &&
        rect.y <= y &&
        rect.x + rect.width >= x &&
        rect.y + rect.height >= y
      );
    });
    if (hasSelectableObject) {
      cancel();
    }
  };

  /**
   * @description
   * 드로잉 종료 시 범위 내 오브젝트를 선택
   */
  const onDrawEnd = (event: DrawEvent): void => {
    if (!canvasDiv.current) {
      return;
    }
    const rect = canvasDiv.current.getBoundingClientRect();
    const absScale = 1 / settings.scale;
    const x = (event.drawClientX - rect.x) * absScale;
    const y = (event.drawClientY - rect.y) * absScale;
    const width = event.width * absScale;
    const height = event.height * absScale;
    const selectedObjects = queueDocument.objects.filter((object) => {
      const rect = getCurrentRect(object, settings.queueIndex);
      return (
        rect.x >= x &&
        rect.y >= y &&
        rect.x + rect.width <= x + width &&
        rect.y + rect.height <= y + height
      );
    });
    setSettings({
      ...settings,
      selectedObjects: selectedObjects.map((object) => object.uuid),
    });
  };

  const onResizeMove = (uuid: string, rect: QueueSquareRect): void => {
    setTranslate(rect);
    // console.log(uuid);
  };

  const onResizeEnd = (object: QueueSquare, rect: QueueSquareRect): void => {
    const currentRect = getCurrentRect(object, settings.queueIndex);
    onObjectRectUpdate([
      {
        uuid: object.uuid,
        queueIndex: settings.queueIndex,
        rect: {
          x: currentRect.x + rect.x,
          y: currentRect.y + rect.y,
          width: currentRect.width + rect.width,
          height: currentRect.height + rect.height,
        },
      },
    ]);
    setTranslate({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  };

  return (
    <Drawable
      scale={settings.scale}
      drawer={<Selector></Selector>}
      onDrawStart={onDrawStart}
      onDrawEnd={onDrawEnd}
      className={css`
        flex: 1;
        background: #e9eaed;
        overflow: auto;
        display: flex;
      `}
    >
      <Scaler
        width={queueDocument.documentRect.width}
        height={queueDocument.documentRect.height}
        scale={settings.scale}
      >
        <div
          ref={canvasDiv}
          className={css`
            position: relative;
            border: 1px solid gray;
            box-sizing: border-box;
            background: white;
          `}
          style={{
            width: queueDocument.documentRect.width,
            height: queueDocument.documentRect.height,
          }}
        >
          {currentQueueObjects.map((object, i) => (
            <QueueObject
              key={object.uuid + settings.queueIndex}
              scale={settings.scale}
              position={settings.queuePosition}
              index={settings.queueIndex}
              selected={settings.selectedObjects.includes(object.uuid)}
              translate={
                settings.selectedObjects.includes(object.uuid)
                  ? translate
                  : {
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0,
                    }
              }
              object={object}
              onMousedown={(event): void => onObjectMouseodown(event, object)}
              onResizeMove={(event): void => onResizeMove(object.uuid, event)}
              onResizeEnd={(event): void => onResizeEnd(object, event)}
            ></QueueObject>
          ))}
        </div>
      </Scaler>
    </Drawable>
  );
};
