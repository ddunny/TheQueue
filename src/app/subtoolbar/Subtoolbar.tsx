import { css } from '@emotion/css';
import { FunctionComponent } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Button } from '../../components/button/Button';
import { queueObjectsByQueueIndexSelector } from '../../store/document';
import { documentSettingsState } from '../../store/settings';

const SubtoolbarButtonStyle = css`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
`;

export interface QueueSubtoolbarProps {
  onQueueIndexChange?: (from: number, current: number) => void;
  onNextQueueClick?: () => void;
  onPreviousQueueClick?: () => void;
}

export const QueueSubtoolbar: FunctionComponent<QueueSubtoolbarProps> = ({
  onQueueIndexChange,
  onNextQueueClick,
  onPreviousQueueClick,
}) => {
  const [settings, setSettings] = useRecoilState(documentSettingsState);
  const start = Math.max(settings.queueIndex - 2, 0);
  const queues = useRecoilValue(
    queueObjectsByQueueIndexSelector({
      start: start,
      end: start + 4,
    })
  );

  const increaseScale = (): void => {
    setSettings({
      ...settings,
      scale: settings.scale + 0.05,
    });
  };

  const decreaseScale = (): void => {
    setSettings({
      ...settings,
      scale: Math.max(settings.scale - 0.05, 0.1),
    });
  };

  const startPresentationModel = (): void => {
    setSettings({
      ...settings,
      presentationMode: true,
    });
  };

  const setCurrentQueueIndex = (index: number): void => {
    const from = settings.queueIndex;
    const to = index;
    setSettings({
      ...settings,
      queueIndex: to,
      queuePosition: 'pause',
    });
    onQueueIndexChange?.(from, to);
  };

  const goToPreviousQueue = (): void => {
    const from = settings.queueIndex;
    const to = Math.max(settings.queueIndex - 1, 0);
    setSettings({
      ...settings,
      queueIndex: to,
      queuePosition: settings.queueIndex - 1 >= 0 ? 'backward' : 'pause',
    });
    onQueueIndexChange?.(from, to);
    onPreviousQueueClick?.();
  };

  const goToNextQueue = (): void => {
    const from = settings.queueIndex;
    const to = settings.queueIndex + 1;
    setSettings({
      ...settings,
      queueIndex: to,
      queuePosition: 'forward',
    });
    onQueueIndexChange?.(from, to);
    onNextQueueClick?.();
  };

  return (
    <div
      className={css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      `}
    >
      <div
        className={css`
          display: flex;
          height: 100%;
        `}
      >
        <Button className={SubtoolbarButtonStyle}>
          <i className="ri-arrow-go-back-line" />
        </Button>
        <Button className={SubtoolbarButtonStyle}>
          <i className="ri-arrow-go-forward-line" />
        </Button>
        <Button className={SubtoolbarButtonStyle}>
          <i className="ri-file-copy-line" />
        </Button>
        <Button className={SubtoolbarButtonStyle}>
          <i className="ri-clipboard-line" />
        </Button>
        <Button
          className={SubtoolbarButtonStyle}
          onClick={startPresentationModel}
        >
          <i className="ri-slideshow-3-line"></i>
        </Button>
      </div>
      <div
        className={css`
          display: flex;
          height: 100%;
        `}
      >
        <Button className={SubtoolbarButtonStyle} onClick={goToPreviousQueue}>
          <i className="ri-arrow-left-line" />
        </Button>
        {queues.map((queue, index) => (
          <Button
            key={index}
            className={SubtoolbarButtonStyle}
            style={{
              color: queue.index === settings.queueIndex ? 'red' : 'black',
            }}
            onClick={(): void => setCurrentQueueIndex(queue.index)}
          >
            {queue.index + 1}
          </Button>
        ))}
        <Button className={SubtoolbarButtonStyle} onClick={goToNextQueue}>
          <i className="ri-arrow-right-line" />
        </Button>
      </div>
      <div
        className={css`
          display: flex;
          height: 100%;
        `}
      >
        <Button className={SubtoolbarButtonStyle} onClick={decreaseScale}>
          <i className="ri-subtract-line" />
        </Button>
        <Button className={SubtoolbarButtonStyle} onClick={increaseScale}>
          <i className="ri-add-line" />
        </Button>
      </div>
    </div>
  );
};
