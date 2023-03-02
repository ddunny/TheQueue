import { fitScreenSizeEvent } from 'app/events/event';
import { useEventDispatch } from 'cdk/hooks/event-dispatcher';
import { SvgRemixIcon } from 'cdk/icon/SvgRemixIcon';
import clsx from 'clsx';
import { QueueScrollArea } from 'components/scroll-area/ScrollArea';
import { QueueSeparator } from 'components/separator/Separator';
import { QueueToggle } from 'components/toggle/Toggle';
import { QueueIconButton } from '../../components/button/Button';
import styles from './Subtoolbar.module.scss';
import { SettingSelectors } from 'store/settings/selectors';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { EffectSelectors } from 'store/effect/selectors';
import { SettingsActions } from 'store/settings/actions';
import { HistoryActions } from 'store/hooks/history';

export const QueueSubtoolbar = () => {
  const dispatch = useAppDispatch();
  const eventDispatch = useEventDispatch();

  const settings = useAppSelector(SettingSelectors.settings);
  const byEffectIndex = useAppSelector((state) => EffectSelectors.allByPageAndEffectIndex(state, settings.pageId));

  const ranges: number[] = [];
  const { queueIndex } = settings;
  const rangeStart = Math.max(queueIndex - 2, 0);
  const rangeEnd = rangeStart + 5;
  for (let i = rangeStart; i < rangeEnd; i++) {
    ranges.push(i);
  }

  const changeQueueIndex = (targetIndex: number, play: boolean): void => {
    dispatch(
      SettingsActions.setQueueIndex({
        queueIndex: targetIndex,
        play: play,
      }),
    );
  };

  const onPresentationStartClick = (): void => {
    dispatch(SettingsActions.setPresentationMode(true));
  };

  const undo = () => {
    dispatch(HistoryActions.Undo());
  };

  const redo = () => {
    dispatch(HistoryActions.Redo());
  };

  return (
    <QueueScrollArea.Root className={styles.Container}>
      <QueueScrollArea.Viewport>
        <div className={styles.ItemRoot}>
          <div className={styles.ItemGroup}>
            <QueueIconButton onClick={undo}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-go-back-line'} />
            </QueueIconButton>

            <QueueIconButton onClick={redo}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-go-forward-line'} />
            </QueueIconButton>

            <QueueIconButton>
              <SvgRemixIcon width={15} height={15} icon={'ri-file-copy-line'} />
            </QueueIconButton>

            <QueueIconButton>
              <SvgRemixIcon width={15} height={15} icon={'ri-clipboard-line'} />
            </QueueIconButton>

            <QueueIconButton onClick={onPresentationStartClick}>
              <SvgRemixIcon width={15} height={15} icon={'ri-slideshow-3-line'} />
            </QueueIconButton>

            <QueueToggle.Root size="small">
              <SvgRemixIcon width={15} height={15} icon={'ri-movie-line'} />
            </QueueToggle.Root>

            <QueueSeparator.Root orientation="vertical" decorative className={styles.Separator} />
          </div>

          <div className={styles.ItemGroup}>
            <QueueIconButton onClick={() => changeQueueIndex(settings.queueIndex - 1, true)}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-left-line'} />
            </QueueIconButton>
            {ranges.map((queue) => (
              <QueueIconButton
                className={clsx(
                  styles.QueueIndicator,
                  byEffectIndex?.[queue] ? styles.HasEffect : '',
                  queue === settings.queueIndex ? styles.Current : '',
                )}
                key={queue}
                onClick={(): void => changeQueueIndex(queue, false)}>
                {queue + 1}
              </QueueIconButton>
            ))}
            <QueueIconButton onClick={() => changeQueueIndex(settings.queueIndex + 1, true)}>
              <SvgRemixIcon width={15} height={15} icon={'ri-arrow-right-line'} />
            </QueueIconButton>
          </div>

          <div className={styles.ItemGroup}>
            <QueueIconButton onClick={() => dispatch(SettingsActions.rewind())}>
              <SvgRemixIcon width={15} height={15} icon={'ri-rewind-line'} />
            </QueueIconButton>
            <QueueIconButton onClick={() => dispatch(SettingsActions.forward())}>
              <SvgRemixIcon width={15} height={15} icon={'ri-speed-line'} />
            </QueueIconButton>
            <QueueIconButton onClick={() => dispatch(SettingsActions.pause())}>
              <SvgRemixIcon width={15} height={15} icon={'ri-pause-line'} />
            </QueueIconButton>
            <QueueIconButton onClick={() => dispatch(SettingsActions.play())}>
              <SvgRemixIcon width={15} height={15} icon={'ri-play-line'} />
            </QueueIconButton>
            <QueueToggle.Root
              pressed={settings.autoPlayRepeat}
              onPressedChange={(e) => dispatch(SettingsActions.setRepeat(e))}>
              <SvgRemixIcon width={15} height={15} icon={'ri-repeat-line'} />
            </QueueToggle.Root>

            <QueueSeparator.Root orientation="vertical" decorative className={styles.Separator} />

            <QueueIconButton onClick={() => eventDispatch(fitScreenSizeEvent())}>
              <SvgRemixIcon width={15} height={15} icon={'ri-fullscreen-fill'} />
            </QueueIconButton>
            <QueueIconButton onClick={() => dispatch(SettingsActions.decreaseScale())}>
              <SvgRemixIcon width={15} height={15} icon={'ri-subtract-line'} />
            </QueueIconButton>
            <QueueIconButton onClick={() => dispatch(SettingsActions.increaseScale())}>
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
