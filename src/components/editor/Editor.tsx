/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Drawable, DrawEvent } from '../../cdk/draw/Draw';
import { Scaler } from '../scaler/Scaler';
import { QueueObject } from 'components/queue';
import { QueueContextMenu } from 'components/context-menu/Context';
import clsx from 'clsx';
import styles from './Editor.module.scss';
import { QueueObjectType } from 'model/object';
import { QueueScrollArea } from 'components/scroll-area/ScrollArea';
import { ResizerEvent } from 'components/queue/Resizer';
import { adjacent } from 'cdk/math/adjacent';
import { EditorContext } from './EditorContext';
import { PresentationRemote } from './PresentationRemote';
import {
  ObjectQueueEffects,
  ObjectQueueProps,
  selectObjectQueueEffects,
  selectObjectQueueProps,
  selectQueueObjects,
} from 'store/legacy/selectors';
import { useAppDispatch } from 'store/hooks';
import { useEventSelector } from 'cdk/hooks/event-dispatcher';
import { fitScreenSizeEvent } from 'app/events/event';
import { documentSettingsSlice, QueueDocumentSettings } from 'store/settings/reducer';
import { RootState } from 'store';
import { connect } from 'react-redux';
import { QueueDocument } from 'model/document';
import { objectsSlice } from 'store/object/reducer';
import { DocumentSelectors } from 'store/document/selectors';
import { SettingSelectors } from 'store/settings/selectors';
import { QueueRect } from 'model/property';
import { effectSlice, NormalizedQueueEffect } from 'store/effect/reducer';

export interface BaseQueueEditorProps {
  queueDocument: QueueDocument;
  settings: QueueDocumentSettings;
  objects: QueueObjectType[];
  queueProps: {
    [key: string]: ObjectQueueProps;
  };
  queueEffects: {
    [key: string]: ObjectQueueEffects;
  };
}

export const BaseQueueEditor = ({
  queueDocument,
  settings,
  objects,
  queueProps,
  queueEffects,
}: BaseQueueEditorProps) => {
  const dispatch = useAppDispatch();
  const rootRef = useRef<HTMLSpanElement>(null);
  const canvasDiv = useRef<HTMLDivElement>(null);

  const [capturedObjectProps, setCapturedObjectProps] = useState<{
    [key: string]: ObjectQueueProps;
  }>({});

  const canvasSizeToFit = useCallback((): void => {
    const root = rootRef.current!;
    const targetScale = Math.min(
      root.clientWidth / (queueDocument!.documentRect.width + 40),
      root.clientHeight / (queueDocument!.documentRect.height + 40),
    );
    if (settings.scale === targetScale) {
      return;
    }
    dispatch(documentSettingsSlice.actions.setScale(targetScale));
  }, [dispatch, queueDocument, settings]);

  // 최초 렌더링 시 스케일 계산
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => canvasSizeToFit(), []);

  useEventSelector(fitScreenSizeEvent, canvasSizeToFit);

  const onObjectMousedown = (
    event: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
    object: QueueObjectType,
  ): void => {
    event.stopPropagation();
    const selected = settings.selectedObjectUUIDs.includes(object.uuid);
    if (!event.shiftKey && !selected) {
      dispatch(
        documentSettingsSlice.actions.setSelection({
          ...settings,
          selectionMode: 'normal',
          uuids: [object.uuid],
        }),
      );
    } else {
      dispatch(documentSettingsSlice.actions.addSelection(object.uuid));
    }
  };

  const onObjectDoubleClick = (
    event: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>,
    object: QueueObjectType,
  ): void => {
    event.stopPropagation();
    dispatch(
      documentSettingsSlice.actions.setSelection({
        selectionMode: 'detail',
        uuid: object.uuid,
      }),
    );
  };

  const onUpdateDrag = (initEvent: MouseEvent, event: MouseEvent): void => {
    const diffX = event.clientX - initEvent.clientX;
    const diffY = event.clientY - initEvent.clientY;
    const currentScale = 1 / settings.scale;

    const targetX = diffX * currentScale;
    const targetY = diffY * currentScale;
    const adjacentTargetX = event.shiftKey ? targetX : adjacent(targetX, 30);
    const adjacentTargetY = event.shiftKey ? targetY : adjacent(targetY, 30);

    const updateModel = settings.selectedObjectUUIDs.reduce<{
      objects: { id: string; changes: { rect: QueueRect } }[];
      effects: NormalizedQueueEffect[];
    }>(
      (result, uuid) => {
        const effects = queueEffects[uuid];
        if (effects?.create) {
          result.objects.push({
            id: uuid,
            changes: {
              rect: {
                ...queueProps[uuid].rect,
                x: capturedObjectProps[uuid].rect.x + adjacentTargetX,
                y: capturedObjectProps[uuid].rect.y + adjacentTargetY,
              },
            },
          });
        } else {
          result.effects.push({
            type: 'rect',
            duration: 1000,
            objectId: uuid,
            index: settings.queueIndex,
            timing: 'linear',
            ...effects?.rect,
            prop: {
              ...queueProps[uuid].rect,
              x: capturedObjectProps[uuid].rect.x + adjacentTargetX,
              y: capturedObjectProps[uuid].rect.y + adjacentTargetY,
            },
          });
        }
        return result;
      },
      {
        objects: [],
        effects: [],
      },
    );

    if (updateModel.effects.length) {
      dispatch(effectSlice.actions.upsertEffects(updateModel.effects));
    }
    if (updateModel.objects.length) {
      dispatch(objectsSlice.actions.updateObjects(updateModel.objects));
    }
  };

  const onObjectDragMove = (initEvent: MouseEvent, event: MouseEvent): void => {
    onUpdateDrag(initEvent, event);
  };

  const onObjectDragEnd = (initEvent: MouseEvent, event: MouseEvent): void => {
    onUpdateDrag(initEvent, event);
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

    const rangeObjectUUIDs = Object.entries(queueProps)
      .filter(([_, { rect }]) => {
        return rect.x >= x && rect.y >= y && rect.x + rect.width <= x + width && rect.y + rect.height <= y + height;
      })
      .map(([uuid]) => uuid);

    dispatch(
      documentSettingsSlice.actions.setSelection({
        selectionMode: 'normal',
        uuids: rangeObjectUUIDs,
      }),
    );
  };

  const resizeObjectRect = (uuid: string, rect: ResizerEvent): void => {
    if (queueEffects[uuid]?.create) {
      dispatch(
        objectsSlice.actions.updateObject({
          id: uuid,
          changes: {
            rect: {
              ...queueProps[uuid].rect,
              ...rect,
            },
          },
        }),
      );
    } else {
      dispatch(
        effectSlice.actions.upsertEffect({
          type: 'rect',
          duration: 1000,
          objectId: uuid,
          timing: 'linear',
          index: settings.queueIndex,
          ...queueEffects[uuid]?.rect,
          prop: {
            ...queueProps[uuid].rect,
            ...rect,
          },
        }),
      );
    }
  };

  const updateObjectRotate = (uuid: string, degree: number): void => {
    if (queueEffects[uuid]?.create) {
      dispatch(
        objectsSlice.actions.updateObject({
          id: uuid,
          changes: {
            rotate: {
              degree: degree,
            },
          },
        }),
      );
    } else {
      dispatch(
        effectSlice.actions.upsertEffect({
          type: 'rotate',
          duration: 1000,
          objectId: uuid,
          timing: 'linear',
          index: settings.queueIndex,
          ...queueEffects[uuid]?.rotate,
          prop: {
            degree: degree,
          },
        }),
      );
    }
  };

  const maximizeScale = useCallback(() => {
    const scale = Math.min(
      document.body.clientWidth / queueDocument!.documentRect.width,
      document.body.clientHeight / queueDocument!.documentRect.height,
    );
    if (settings.scale === scale) {
      return;
    }
    dispatch(documentSettingsSlice.actions.setScale(scale));
  }, [dispatch, queueDocument, settings.scale]);

  useEffect(() => {
    if (!settings.presentationMode) {
      return;
    }
    const observer = new ResizeObserver(maximizeScale);
    observer.observe(document.body);
    maximizeScale();
    return () => observer.disconnect();
  }, [dispatch, maximizeScale, queueDocument, settings.presentationMode, settings.scale]);

  const onTextEdit = (object: QueueObjectType, text: string): void => {
    dispatch(
      objectsSlice.actions.updateObject({
        id: object.uuid,
        changes: {
          text: {
            ...object.text,
            text,
          },
        },
      }),
    );
  };

  const onObjectContextMenuOpenChange = (uuid: string, open: boolean): void => {
    if (open && !settings.selectedObjectUUIDs.includes(uuid)) {
      dispatch(
        documentSettingsSlice.actions.setSelection({
          selectionMode: 'normal',
          uuids: [uuid],
        }),
      );
    }
  };

  return (
    <QueueContextMenu.Root>
      <QueueContextMenu.Trigger ref={rootRef} className={clsx(styles.Root)}>
        <QueueScrollArea.Root
          className={clsx(styles.ScrollAreaRoot)}
          onMouseDown={() => dispatch(documentSettingsSlice.actions.resetSelection())}>
          <QueueScrollArea.Viewport className={clsx('flex')}>
            <Drawable
              scale={settings.scale}
              drawer={<div className={clsx(styles.drawer, 'w-full', 'h-full')}></div>}
              onDrawEnd={onDrawEnd}
              className={clsx(styles.Drawable, settings.presentationMode ? styles.fullscreen : '')}>
              <Scaler
                width={queueDocument!.documentRect.width}
                height={queueDocument!.documentRect.height}
                scale={settings.scale}
                className={clsx(settings.presentationMode ? styles.scaleFull : '')}>
                <div
                  ref={canvasDiv}
                  className={clsx(styles.canvas)}
                  style={{
                    width: queueDocument!.documentRect.width,
                    height: queueDocument!.documentRect.height,
                    background: queueDocument!.documentRect.fill,
                  }}>
                  {objects.map((object) => (
                    <QueueContextMenu.Root
                      key={object.uuid}
                      onOpenChange={(open): void => onObjectContextMenuOpenChange(object.uuid, open)}>
                      <QueueContextMenu.Trigger>
                        <QueueObject.Container
                          object={object}
                          detail={
                            settings.selectionMode === 'detail' && settings.selectedObjectUUIDs.includes(object.uuid)
                          }
                          documentScale={settings.scale}
                          selected={settings.selectedObjectUUIDs.includes(object.uuid)}>
                          <QueueObject.Animator
                            queueIndex={settings.queueIndex}
                            queuePosition={settings.queuePosition}
                            queueStart={settings.queueStart}>
                            <QueueObject.Drag
                              onMousedown={(event): void => onObjectMousedown(event, object)}
                              onDoubleClick={(event): void => onObjectDoubleClick(event, object)}
                              onDraggingStart={() => setCapturedObjectProps(queueProps)}
                              onDraggingMove={onObjectDragMove}
                              onDraggingEnd={onObjectDragEnd}>
                              <QueueObject.Rect></QueueObject.Rect>
                              <QueueObject.Text onEdit={(e): void => onTextEdit(object, e)} />
                              <QueueObject.Resizer
                                onResizeStart={(event): void => resizeObjectRect(object.uuid, event)}
                                onResizeMove={(event): void => resizeObjectRect(object.uuid, event)}
                                onResizeEnd={(event): void => resizeObjectRect(object.uuid, event)}
                                onRotateMove={(event): void => updateObjectRotate(object.uuid, event.degree)}
                                onRotateEnd={(event): void => updateObjectRotate(object.uuid, event.degree)}
                              />
                            </QueueObject.Drag>
                          </QueueObject.Animator>
                        </QueueObject.Container>
                      </QueueContextMenu.Trigger>
                      <QueueContextMenu.Portal>
                        <QueueObject.ContextContent />
                      </QueueContextMenu.Portal>
                    </QueueContextMenu.Root>
                  ))}
                </div>
              </Scaler>
            </Drawable>
            {settings.presentationMode && <PresentationRemote />}
          </QueueScrollArea.Viewport>
          <QueueScrollArea.Scrollbar orientation="vertical">
            <QueueScrollArea.Thumb />
          </QueueScrollArea.Scrollbar>
          <QueueScrollArea.Scrollbar orientation="horizontal">
            <QueueScrollArea.Thumb />
          </QueueScrollArea.Scrollbar>
          <QueueScrollArea.Corner />
        </QueueScrollArea.Root>
      </QueueContextMenu.Trigger>
      <QueueContextMenu.Portal>
        <EditorContext />
      </QueueContextMenu.Portal>
    </QueueContextMenu.Root>
  );
};

export const mapStateToProps = (state: RootState) => {
  const settings = SettingSelectors.settings(state);
  return {
    queueDocument: DocumentSelectors.serialized(state),
    settings: settings,
    objects: selectQueueObjects(settings.queuePage, settings.queueIndex)(state),
    queueProps: selectObjectQueueProps(settings.queuePage, settings.queueIndex)(state),
    queueEffects: selectObjectQueueEffects(settings.queuePage, settings.queueIndex)(state),
  };
};

export const QueueEditor = connect(mapStateToProps)(BaseQueueEditor);
