import { QueueAnimatableContext } from 'components/queue/QueueAnimation';
import React, { useCallback, useContext, useEffect } from 'react';
import { QueueRect } from '../../model/object/rect';
import styles from './Resizer.module.scss';

export interface ResizeEvent {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizerProps {
  scale?: number;
  translate?: QueueRect;
  onResizeStart?: (event: ResizeEvent, cancel: () => void) => void;
  onResizeMove?: (event: ResizeEvent, cancel: () => void) => void;
  onResizeEnd?: (event: ResizeEvent) => void;
}

export type ResizerPosition =
  | 'top-left'
  | 'top-middle'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-middle'
  | 'bottom-right';

export const ObjectResizer: React.FunctionComponent<ResizerProps> = ({
  scale = 1,
  translate,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}) => {
  // shorthands
  const meta = useContext(QueueAnimatableContext);
  const strokeWidth = 15;
  const distance = strokeWidth / 2;
  const margin = 50;
  const actualWidth = (meta.rect.width + (translate?.width || 0)) + margin * 2;
  const actualHeight = meta.rect.height + (translate?.height || 0) + margin * 2;

  const [init, setInit] = React.useState<{
    event: MouseEvent;
    position: ResizerPosition;
  } | null>(null);

  const cancel = useCallback(() => {
    setInit(null);
  }, []);

  const getResizerPosition = (
    initEvent: MouseEvent,
    targetEvent: MouseEvent,
    scale: number,
    objectScale: number,
    position: ResizerPosition
  ): QueueRect => {
    const originDiffX = (targetEvent.clientX - initEvent.clientX) * (1 / scale);
    const originDiffY = (targetEvent.clientY - initEvent.clientY) * (1 / scale);
    const diffX = originDiffX * (1 / objectScale);
    const diffY = originDiffY * (1 / objectScale);

    switch (position) {
      case 'top-left':
        return {
          x: diffX,
          y: diffY,
          width: -diffX,
          height: -diffY,
        };
      case 'top-middle':
        return {
          x: 0,
          y: diffY,
          width: 0,
          height: -diffY,
        };
      case 'top-right':
        return {
          x: 0,
          y: diffY,
          width: diffX,
          height: -diffY,
        };
      case 'middle-right':
        return {
          x: 0,
          y: 0,
          width: diffX,
          height: 0,
        };
      case 'bottom-right':
        return {
          x: 0,
          y: 0,
          width: diffX,
          height: diffY,
        };
      case 'bottom-middle':
        return {
          x: 0,
          y: 0,
          width: 0,
          height: diffY,
        };
      case 'bottom-left':
        return {
          x: diffX,
          y: 0,
          width: -diffX,
          height: diffY,
        };
      case 'middle-left':
        return {
          x: diffX,
          y: 0,
          width: -diffX,
          height: 0,
        };
    }
  };

  const onDocumentMousemove = useCallback(
    (event: MouseEvent) => {
      if (!init) {
        return;
      }
      const rect = getResizerPosition(init.event, event, scale, meta.scale.scale, init.position);
      onResizeMove?.(rect, cancel);
    },
    [init, onResizeMove, scale, meta.scale.scale, cancel]
  );

  const onDocumentMouseup = useCallback(
    (event: MouseEvent) => {
      if (!init) {
        return;
      }
      const rect = getResizerPosition(init.event, event, scale, meta.scale.scale, init.position);
      onResizeEnd?.(rect);
      setInit(null);
    },
    [init, onResizeEnd, scale, meta.scale.scale]
  );

  useEffect(() => {
    if (!init) {
      return;
    }
    document.addEventListener('mousemove', onDocumentMousemove);
    document.addEventListener('mouseup', onDocumentMouseup);
    return () => {
      document.removeEventListener('mousemove', onDocumentMousemove);
      document.removeEventListener('mouseup', onDocumentMouseup);
    };
  }, [init, onDocumentMousemove, onDocumentMouseup]);

  const onResizeMousedown = useCallback(
    (
      initEvent: React.MouseEvent<SVGRectElement, globalThis.MouseEvent>,
      position: ResizerPosition
    ): void => {
      initEvent.stopPropagation();
      if (onResizeStart) {
        onResizeStart(
          {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
          cancel
        );
      }
      setInit({
        event: initEvent.nativeEvent,
        position: position,
      });
    },
    [onResizeStart, cancel]
  );

  return (
    <svg
      className={styles.canvas}
      style={{
        left: -margin,
        top: -margin,
      }}
      width={actualWidth}
      height={actualHeight}
    >
      {/* top left */}
      <rect
        className={styles.topLeft}
        x={margin - distance}
        y={margin - distance}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'top-left')}
      ></rect>
      {/* top middle */}
      <rect
        className={styles.topMiddle}
        x={actualWidth / 2 - strokeWidth / 2}
        y={margin - distance}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'top-middle')}
      ></rect>
      {/* top right */}
      <rect
        className={styles.topRight}
        x={actualWidth - margin - (strokeWidth - distance)}
        y={margin - distance}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'top-right')}
      ></rect>
      {/* middle right */}
      <rect
        className={styles.middleRight}
        x={actualWidth - margin - (strokeWidth - distance)}
        y={actualHeight / 2 - strokeWidth / 2}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'middle-right')}
      ></rect>
      {/* bottom right */}
      <rect
        className={styles.bottomRight}
        x={actualWidth - margin - (strokeWidth - distance)}
        y={actualHeight - margin - (strokeWidth - distance)}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'bottom-right')}
      ></rect>
      {/* bottom middle */}
      <rect
        className={styles.bottomMiddle}
        x={actualWidth / 2 - strokeWidth / 2}
        y={actualHeight - margin - (strokeWidth - distance)}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'bottom-middle')}
      ></rect>
      {/* bottom left */}
      <rect
        className={styles.bottomLeft}
        x={margin - distance}
        y={actualHeight - margin - (strokeWidth - distance)}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'bottom-left')}
      ></rect>
      {/* middle left */}
      <rect
        className={styles.middleLeft}
        x={margin - distance}
        y={actualHeight / 2 - strokeWidth / 2}
        width={strokeWidth}
        height={strokeWidth}
        onMouseDown={(e): void => onResizeMousedown(e, 'middle-left')}
      ></rect>
    </svg>
  );
};
