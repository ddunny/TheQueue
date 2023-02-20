import { ContextMenuContentProps } from '@radix-ui/react-context-menu';
import { QueueContextMenu } from 'components/context-menu/Context';
import { forwardRef } from 'react';
import styles from './EditorContext.module.scss';

export const EditorContext: React.ForwardRefExoticComponent<
  ContextMenuContentProps & React.RefAttributes<HTMLDivElement>
> = forwardRef((_, ref) => {
  return (
    <QueueContextMenu.Content ref={ref}>
      <QueueContextMenu.Item>
        실행 취소 <div className={styles.RightSlot}>⌘+Z</div>
      </QueueContextMenu.Item>
      <QueueContextMenu.Item>
        다시 실행 <div className={styles.RightSlot}>⌘+Shift+Z</div>
      </QueueContextMenu.Item>
      <QueueContextMenu.Separator />
      <QueueContextMenu.Item>
        붙여넣기 <div className={styles.RightSlot}>⌘+V</div>
      </QueueContextMenu.Item>
      <QueueContextMenu.Item>
        이 위치로 붙여넣기 <div className={styles.RightSlot}>⌘+V</div>
      </QueueContextMenu.Item>
    </QueueContextMenu.Content>
  );
});