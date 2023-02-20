import { useRedo, useUndo } from 'cdk/hooks/useUndo';
import { SvgRemixIcon } from 'cdk/icon/SvgRemixIcon';
import { QueueScrollArea } from 'components/scroll-area/ScrollArea';
import { QueueSeparator } from 'components/separator/Separator';
import { QueueToggle } from 'components/toggle/Toggle';
import { useRecoilState, useRecoilValue } from 'recoil';
import { objectEffectsByQueues } from 'store/effects';
import { queueObjectsByQueueIndexSelector } from 'store/object';
import { queueDocumentPages } from 'store/page';
import { documentSettingsState } from 'store/settings';
import { QueueIconButton } from '../../components/button/Button';
import styles from './Subtoolbar.module.scss';

export type QueueSubtoolbarProps = {
  fitToScreen?: () => void;
}

export const QueueSubtoolbar: React.FC<QueueSubtoolbarProps> = ({
  fitToScreen
}) => {
  const [settings, setSettings] = useRecoilState(documentSettingsState);
  const pages = useRecoilValue(queueDocumentPages);
  const effectsByQueues = useRecoilValue(objectEffectsByQueues);

  console.log(effectsByQueues);

  const undo = useUndo();
  const redo = useRedo();

  const start = Math.max(settings.queueIndex - 2, 0);
  const queues = useRecoilValue(
    queueObjectsByQueueIndexSelector({
      start: start,
      end: start + 4,
    }),
  );

  const setQueueIndex = (
    index: number,
    play?: boolean,
  ): void => {
    const target = Math.max(0, index);
    const sameIndex = settings.queueIndex === target;
    setSettings({
      ...settings,
      queueIndex: target,
      queuePosition: sameIndex ? 'pause' : settings.queueIndex < target ? 'forward' : 'backward',
      queueStart: play ? performance.now() : -1,
      selectedObjectUUIDs: [],
      selectionMode: 'normal',
    });
  };

  const increaseScale = (): void => setSettings({ ...settings, scale: settings.scale + 0.05 });
  const decreaseScale = (): void => setSettings({ ...settings, scale: Math.max(settings.scale - 0.05, 0.25) });
  const setCurrentQueueIndex = (index: number): void => setQueueIndex(index, false);
  const goToPreviousQueue = (): void => setQueueIndex(settings.queueIndex - 1, true);
  const goToNextQueue = (): void => setQueueIndex(settings.queueIndex + 1, true);

  const rewind = (): void => {
    const targetPageQueueIndex = settings.queueIndex - 1;
    if (targetPageQueueIndex < 0 && settings.queuePage > 0) {
      setSettings({
        ...settings,
        queuePage: settings.queuePage - 1,
        queueIndex: effectsByQueues[settings.queuePage - 1].length - 1,
        queuePosition: 'pause',
        queueStart: -1,
        selectedObjectUUIDs: [],
        selectionMode: 'normal',
      });
      return;
    }
    if (targetPageQueueIndex < 0) {
      return;
    }
    setQueueIndex(settings.queueIndex - 1, true);
  };

  const play = (): void => {
    const targetPageQueueIndex = settings.queueIndex + 1;
    if (
      targetPageQueueIndex >= effectsByQueues[settings.queuePage].length &&
      settings.queuePage < pages.length - 1
    ) {
      setSettings({
        ...settings,
        queuePage: settings.queuePage + 1,
        queueIndex: 0,
        queuePosition: 'pause',
        queueStart: -1,
        selectedObjectUUIDs: [],
        selectionMode: 'normal',
      });
      return;
    }
    if (targetPageQueueIndex > effectsByQueues[settings.queuePage].length - 1) {
      return;
    }
    setQueueIndex(settings.queueIndex + 1, true);
  };

  const fitScale = (): void => fitToScreen?.();
  const startPresentationModel = (): void => {
    setSettings({
      ...settings,
      presentationMode: true,
    });
    document.documentElement.requestFullscreen();
  };

  return (
    <QueueScrollArea.Root className={styles.Container}>
      <QueueScrollArea.Viewport>
        <div className={styles.ItemRoot}>
          <div className={styles.ItemGroup}>
            <QueueIconButton onClick={undo}>
              <SvgRemixIcon
                width={15}
                height={15}
                icon={'ri-arrow-go-back-line'}
              />
            </QueueIconButton>

            <QueueIconButton onClick={redo}>
              <SvgRemixIcon
                width={15}
                height={15}
                icon={'ri-arrow-go-forward-line'}
              />
            </QueueIconButton>

            <QueueIconButton>
              <SvgRemixIcon width={15} height={15} icon={'ri-file-copy-line'} />
            </QueueIconButton>

            <QueueIconButton>
              <SvgRemixIcon width={15} height={15} icon={'ri-clipboard-line'} />
            </QueueIconButton>

            <QueueIconButton onClick={startPresentationModel}>
              <SvgRemixIcon width={15} height={15} icon={'ri-slideshow-3-line'} />
            </QueueIconButton>


            <QueueToggle.Root size='small'>
              <SvgRemixIcon width={15} height={15} icon={'ri-movie-line'} />
            </QueueToggle.Root>

            <QueueSeparator.Root
              orientation="vertical"
              decorative
              className={styles.Separator}
            />
          </div>

          <div className={styles.ItemGroup}>
            <QueueIconButton onClick={rewind}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-left-s-fill'} />
            </QueueIconButton>
            <QueueIconButton onClick={goToPreviousQueue}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-left-line'} />
            </QueueIconButton>
            {queues.map((queue, index) => (
              <QueueIconButton
                key={index}
                style={{
                  color: queue.index === settings.queueIndex ? 'red' : 'black',
                }}
                onClick={(): void => setCurrentQueueIndex(queue.index)}>
                {queue.index + 1}
              </QueueIconButton>
            ))}
            <QueueIconButton onClick={goToNextQueue}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-right-line'} />
            </QueueIconButton>
            <QueueIconButton onClick={play}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-right-s-fill'} />
            </QueueIconButton>
          </div>
          <div className={styles.ItemGroup}>
            <QueueSeparator.Root
              orientation="vertical"
              decorative
              className={styles.Separator}
            />

            <QueueIconButton onClick={fitScale}>
              <SvgRemixIcon width={15} height={15} icon={'ri-fullscreen-fill'} />
            </QueueIconButton>
            <QueueIconButton onClick={decreaseScale}>
              <SvgRemixIcon width={15} height={15} icon={'ri-subtract-line'} />
            </QueueIconButton>
            <QueueIconButton onClick={increaseScale}>
              <SvgRemixIcon width={15} height={15} icon={'ri-add-line'} />
            </QueueIconButton>
          </div>
        </div>

      </QueueScrollArea.Viewport>
      <QueueScrollArea.Scrollbar orientation="horizontal" hidden>
        <QueueScrollArea.Thumb />
      </QueueScrollArea.Scrollbar>
    </QueueScrollArea.Root>
  );
};
