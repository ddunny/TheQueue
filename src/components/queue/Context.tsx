import { ChevronRightIcon } from '@radix-ui/react-icons';
import { useSettings } from 'cdk/hooks/useSettings';
import { QueueContextMenu } from 'components/context-menu/Context';
import { useRecoilState } from 'recoil';
import { documentState } from 'store/document';
import { ObjectQueueEffects, objectQueueEffects } from 'store/effects';
import { documentPageObjects } from 'store/page';
import styles from './Context.module.scss';

export const QueueObjectContextContent: React.FC = () => {
  const { settings } = useSettings();
  const [objects, setObjects] = useRecoilState(documentPageObjects(settings.queuePage));
  const [effects, setEffects] = useRecoilState(objectQueueEffects({ pageIndex: settings.queuePage, queueIndex: settings.queueIndex }));
  const [queueDocument, setQueueDocument] = useRecoilState(documentState);

  const changeObjectIndex = (
    fromUUIDs: string[],
    to: 'start' | 'end' | 'forward' | 'backward'
  ): void => {
    const objects = queueDocument!.pages[settings.queuePage].objects.slice(0);
    switch (to) {
      case 'start':
        objects.sort((a, b) => {
          if (fromUUIDs.includes(a.uuid)) {
            return 1;
          }
          if (fromUUIDs.includes(b.uuid)) {
            return -1;
          }
          return 0;
        });
        break;
      case 'end':
        objects.sort((a, b) => {
          if (fromUUIDs.includes(a.uuid)) {
            return -1;
          }
          if (fromUUIDs.includes(b.uuid)) {
            return 1;
          }
          return 0;
        });
        break;
      case 'forward':
        fromUUIDs.forEach((uuid) => {
          const objectIndex = objects.findIndex(
            (object) => object.uuid === uuid
          );
          const object = objects[objectIndex];
          objects.splice(objectIndex, 1);
          objects.splice(Math.min(objectIndex + 1, objects.length), 0, object);
        });
        break;
      case 'backward':
        fromUUIDs.forEach((uuid) => {
          const objectIndex = objects.findIndex(
            (object) => object.uuid === uuid
          );
          const object = objects[objectIndex];
          objects.splice(objectIndex, 1);
          objects.splice(Math.min(objectIndex - 1, objects.length), 0, object);
        });
        break;
    }
    const newPages = queueDocument!.pages.slice(0);
    newPages[settings.queuePage] = {
      ...queueDocument!.pages[settings.queuePage],
      objects: objects,
    };
    setQueueDocument({
      ...queueDocument!,
      pages: newPages,
    });
  };

  /**
   * @description
   * 현재 큐에서 오브젝트를 제거, 생성된 큐에서 제거를 시도한 경우 영구히 제거한다.
   */
  const onRemoveObject = (): void => {
    const pendingCompleteRemoveUUIDs: string[] = [];
    const updateModels = settings.selectedObjectUUIDs.reduce<{ [key: string]: ObjectQueueEffects }>((result, uuid) => {
      if (effects[uuid].create) {
        pendingCompleteRemoveUUIDs.push(uuid);
        return result;
      }
      result[uuid] = {
        ...effects[uuid],
        remove: {
          type: 'remove',
          duration: 0,
          timing: 'linear',
          ...effects[uuid]?.remove,
        },
      };
      return result;
    }, {});

    if (Object.values(updateModels).length > 0) {
      setEffects({
        ...effects,
        ...updateModels,
      });
    }
    if (pendingCompleteRemoveUUIDs.length > 0) {
      onCompletelyRemoveClick(pendingCompleteRemoveUUIDs);
    }
  };

  /**
   * @description
   * 오브젝트를 영구히 제거
   */
  const onCompletelyRemoveClick = (uuids: string[]): void => {
    setObjects([
      ...objects.filter((object) => !uuids.includes(object.uuid)),
    ]);
  };

  return (
    <QueueContextMenu.Content
      onMouseDown={(e): void => e.stopPropagation()}>
      <QueueContextMenu.Item onClick={(): void => onRemoveObject()}>
        현재 큐에서 삭제{' '}
        <div className={styles.RightSlot}>Backspace</div>
      </QueueContextMenu.Item>
      <QueueContextMenu.Item onClick={(): void => onCompletelyRemoveClick(settings.selectedObjectUUIDs)}>
        오브젝트 삭제{' '}
        <div className={styles.RightSlot}>
          ⌘+Backspace
        </div>
      </QueueContextMenu.Item>
      <QueueContextMenu.Separator />
      <QueueContextMenu.Item>
        잘라내기{' '}
        <div className={styles.RightSlot}>⌘+T</div>
      </QueueContextMenu.Item>
      <QueueContextMenu.Item>
        복사 <div className={styles.RightSlot}>⌘+C</div>
      </QueueContextMenu.Item>
      <QueueContextMenu.Separator />
      <QueueContextMenu.Item
        onClick={(): void =>
          changeObjectIndex(
            settings.selectedObjectUUIDs,
            'start'
          )
        }>
        맨 앞으로 가져오기
      </QueueContextMenu.Item>
      <QueueContextMenu.Item
        onClick={(): void =>
          changeObjectIndex(
            settings.selectedObjectUUIDs,
            'end'
          )
        }>
        맨 뒤로 보내기
      </QueueContextMenu.Item>
      <QueueContextMenu.Item
        onClick={(): void =>
          changeObjectIndex(
            settings.selectedObjectUUIDs,
            'forward'
          )
        }>
        앞으로 가져오기
      </QueueContextMenu.Item>
      <QueueContextMenu.Item
        onClick={(): void =>
          changeObjectIndex(
            settings.selectedObjectUUIDs,
            'backward'
          )
        }>
        뒤로 보내기
      </QueueContextMenu.Item>
      <QueueContextMenu.Separator />
      <QueueContextMenu.Item>그룹</QueueContextMenu.Item>
      <QueueContextMenu.Item>
        그룹 해제
      </QueueContextMenu.Item>
      <QueueContextMenu.Separator />
      <QueueContextMenu.Sub>
        <QueueContextMenu.SubTrigger>
          더보기
          <div className={styles.RightSlot}>
            <ChevronRightIcon />
          </div>
        </QueueContextMenu.SubTrigger>
        <QueueContextMenu.Portal>
          <QueueContextMenu.SubContent
            sideOffset={2}
            alignOffset={-5}>
            <QueueContextMenu.Item>
              Save Page As…{' '}
              <div className={styles.RightSlot}>⌘+S</div>
            </QueueContextMenu.Item>
            <QueueContextMenu.Item>
              Create Shortcut…
            </QueueContextMenu.Item>
            <QueueContextMenu.Item>
              Name Window…
            </QueueContextMenu.Item>
            <QueueContextMenu.Separator />
            <QueueContextMenu.Item>
              Developer Tools
            </QueueContextMenu.Item>
          </QueueContextMenu.SubContent>
        </QueueContextMenu.Portal>
      </QueueContextMenu.Sub>
    </QueueContextMenu.Content>
  );
};