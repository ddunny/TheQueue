/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FunctionComponent, useLayoutEffect, useRef, useState } from 'react';
import { Drawable, DrawEvent } from '../../cdk/draw/Draw';
import { documentState } from '../../store/document';
import {
  isExistObjectOnQueue,
  QueueRect,
  QueueSquare,
} from '../../model/object/rect';
import { Scaler } from '../scaler/Scaler';
import { getCurrentRect, getCurrentScaledRect } from '../queue/animate/rect';
import { useRecoilState } from 'recoil';
import { documentSettingsState } from '../../store/settings';
import { QueueObject } from 'components/queue';
import { getCurrentScale } from 'components/queue/animate/scale';
import { QueueDocumentRect, QueueObjectType } from 'model/document';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { DotFilledIcon, CheckIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import styles from './Editor.module.scss';

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
  rect: QueueRect;
}

export const QueueEditor: FunctionComponent = () => {
  const canvasDiv = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState<QueueRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [translateTargets, setTranslateTargets] = useState<string[]>([]);
  const [queueDocument, setQueueDocument] = useRecoilState(documentState);
  const [settings, setSettings] = useRecoilState(documentSettingsState);
  const currentQueueObjects = queueDocument!.objects.filter((object) =>
    isExistObjectOnQueue(object, settings.queueIndex)
  );

  useLayoutEffect(() => {
    // queueDocument?.documentRect.width
  }, []);

  const updateObjectRects = (models: RectUpdateModel[]): void => {
    const newObjects = queueDocument!.objects.map((object) => {
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
          timing: 'linear',
          rect: {
            ...model.rect,
          },
        });
        slicedObject.effects.sort((a, b) => a.index - b.index);
      }

      return slicedObject;
    });
    setQueueDocument({ ...queueDocument!, objects: newObjects });
  };

  const onObjectMouseodown = (
    event: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
    object: QueueObjectType,
  ): void => {
    event.stopPropagation();
    const selected = settings.selectedObjectUUIDs.includes(object.uuid);
    if (!event.shiftKey) {
      setSettings({
        ...settings,
        selectionMode: settings.selectionMode,
        selectedObjectUUIDs: [object.uuid],
      });
    } else {
      setSettings({
        ...settings,
        selectionMode: 'normal',
        selectedObjectUUIDs: selected
          ? settings.selectedObjectUUIDs.filter((id) => id !== object.uuid)
          : [...settings.selectedObjectUUIDs, object.uuid],
      });
    }
  };

  const onObjectDoubleClick = (
    event: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
    object: QueueObjectType,
  ): void => {
    event.stopPropagation();
    setSettings({
      ...settings,
      selectionMode: 'detail',
      selectedObjectUUIDs: [object.uuid],
    });
  };

  const onObjectDragMove = (
    initEvent: MouseEvent,
    event: MouseEvent,
    object: QueueObjectType,
  ): void => {
    const x = event.clientX - initEvent.clientX;
    const y = event.clientY - initEvent.clientY;
    const currentScale = 1 / settings.scale;
    const objectScale = 1 / getCurrentScale(object, settings.queueIndex).scale;
    setTranslate({
      x: x * currentScale * objectScale,
      y: y * currentScale * objectScale,
      width: 0,
      height: 0,
    });
    setTranslateTargets(settings.selectedObjectUUIDs);
  };

  const onObjectDragEnd = (
    initEvent: MouseEvent,
    event: MouseEvent,
  ): void => {
    const x = event.clientX - initEvent.clientX;
    const y = event.clientY - initEvent.clientY;
    const currentScale = 1 / settings.scale;
    const diffX = x * currentScale;
    const diffY = y * currentScale;
    const updateModels = queueDocument!.objects
      .filter((object) => settings.selectedObjectUUIDs.includes(object.uuid))
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
    setSettings({
      ...settings,
      queueStart: -1,
    });
    updateObjectRects(updateModels);
    setTranslate({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
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
    const hasSelectableObject = queueDocument!.objects.some((object) => {
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
    const selectedObjects = queueDocument!.objects.filter((object) => {
      const rect = getCurrentScaledRect(object, settings.queueIndex);
      return (
        rect.x >= x &&
        rect.y >= y &&
        rect.x + rect.width <= x + width &&
        rect.y + rect.height <= y + height
      );
    });
    setSettings({
      ...settings,
      selectionMode: 'normal',
      selectedObjectUUIDs: selectedObjects.map((object) => object.uuid),
    });
  };

  const onResizeStart = (object: QueueObjectType): void => {
    setTranslateTargets([
      object.uuid
    ]);
  };

  const onResizeMove = (object: QueueObjectType, rect: QueueRect): void => {
    setTranslate(rect);
  };

  const onResizeEnd = (object: QueueObjectType, rect: QueueRect): void => {
    const currentScale = getCurrentScale(object, settings.queueIndex).scale;
    const currentRect = getCurrentRect(object, settings.queueIndex);
    updateObjectRects([
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
    setTranslateTargets([]);
  };

  const onTextEdit = (objectId: string, text: string): void => {
    const objectIndex = queueDocument!.objects.findIndex((object) => object.uuid === objectId);
    const object = queueDocument!.objects[objectIndex];
    const newObject = {
      ...object,
      text: {
        ...object.text,
        text: text,
      },
    };
    const newObjects = queueDocument!.objects.slice(0);
    newObjects[objectIndex] = newObject;
    setQueueDocument({
      ...queueDocument!,
      objects: newObjects,
    });
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        className={clsx(
          'overflow-auto',
          'flex',
          'flex-1'
        )}>
        <Drawable
          scale={settings.scale}
          drawer={
            <div className={clsx(
              styles.drawer,
              'w-full',
              'h-full',
            )}></div>
          }
          onDrawStart={onDrawStart}
          onDrawEnd={onDrawEnd}
          className={clsx(
            styles.root,
            'flex',
            'flex-col',
            'flex-1',
            'overflow-auto',
          )}
        >
          <Scaler
            width={queueDocument!.documentRect.width}
            height={queueDocument!.documentRect.height}
            scale={settings.scale}
          >
            <div
              ref={canvasDiv}
              className={clsx(
                styles.canvas,
                'relative',
                'box-border',
              )}
              style={{
                width: queueDocument!.documentRect.width,
                height: queueDocument!.documentRect.height,
                background: queueDocument!.documentRect.fill,
              }}
            >
              {currentQueueObjects.map((object) => {
                return (
                  <QueueObject.Container
                    className='queue-object-root'
                    key={object.uuid}
                    object={object}
                    detail={settings.selectionMode === 'detail' && settings.selectedObjectUUIDs.includes(object.uuid)}
                    documentScale={settings.scale}
                    transform={translateTargets.includes(object.uuid) ? translate : undefined}
                    selected={settings.selectedObjectUUIDs.includes(object.uuid)}>
                    <QueueObject.Animator
                      queueIndex={settings.queueIndex}
                      queuePosition={settings.queuePosition}
                      queueStart={settings.queueStart}>
                      <QueueObject.Drag
                        onMousedown={(event): void => onObjectMouseodown(event, object)}
                        onDoubleClick={(event): void => onObjectDoubleClick(event, object)}
                        onDraggingStart={(initEvent, currentEvent): void => onObjectDragMove(initEvent, currentEvent, object)}
                        onDraggingMove={(initEvent, currentEvent): void => onObjectDragMove(initEvent, currentEvent, object)}
                        onDraggingEnd={onObjectDragEnd}
                      >
                        <QueueObject.Rect></QueueObject.Rect>
                        <QueueObject.Text onEdit={(e): void => onTextEdit(object.uuid, e)}></QueueObject.Text>
                        <QueueObject.Resizer
                          onResizeStart={(event): void => onResizeStart(object)}
                          onResizeMove={(event): void => onResizeMove(object, event)}
                          onResizeEnd={(event): void => onResizeEnd(object, event)}
                        ></QueueObject.Resizer>
                      </QueueObject.Drag>
                    </QueueObject.Animator>
                  </QueueObject.Container>
                );
              })}
            </div>
          </Scaler>
        </Drawable>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={styles.ContextMenuContent}>
          <ContextMenu.Item className={styles.ContextMenuItem}>
            Back <div className={styles.RightSlot}>⌘+[</div>
          </ContextMenu.Item>
          <ContextMenu.Item className={styles.ContextMenuItem} disabled>
            Foward <div className={styles.RightSlot}>⌘+]</div>
          </ContextMenu.Item>
          <ContextMenu.Item className={styles.ContextMenuItem}>
            Reload <div className={styles.RightSlot}>⌘+R</div>
          </ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={styles.ContextMenuSubTrigger}>
              More Tools
              <div className={styles.RightSlot}>
                <ChevronRightIcon />
              </div>
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent
                className={styles.ContextMenuSubContent}
                sideOffset={2}
                alignOffset={-5}
              >
                <ContextMenu.Item className={styles.ContextMenuItem}>
                  Save Page As… <div className={styles.RightSlot}>⌘+S</div>
                </ContextMenu.Item>
                <ContextMenu.Item className={styles.ContextMenuItem}>Create Shortcut…</ContextMenu.Item>
                <ContextMenu.Item className={styles.ContextMenuItem}>Name Window…</ContextMenu.Item>
                <ContextMenu.Separator className={styles.ContextMenuSeparator} />
                <ContextMenu.Item className={styles.ContextMenuItem}>Developer Tools</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
