import { Slider } from 'components/slider';
import { QueueEffectType } from 'model/effect';
import { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { SettingSelectors } from 'store/settings/selectors';
import { getEffectEntityKey } from 'store/effect/reducer';
import { EffectSelectors } from 'store/effect/selectors';
import { EffectActions } from '../../store/effect';
import { HistoryActions } from 'store/history';

export type EffectControllerDurationProps = {
  effectType: QueueEffectType['type'];
};

export const EffectControllerDuration = ({ effectType }: EffectControllerDurationProps): ReactElement => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(SettingSelectors.settings);
  const selectedObjects = useAppSelector(SettingSelectors.selectedObjects);
  const effectsOfSelectedObjects = useAppSelector((state) =>
    EffectSelectors.byIds(
      state,
      selectedObjects.map((object) =>
        getEffectEntityKey({
          index: settings.queueIndex,
          objectId: object.id,
          type: effectType,
        }),
      ),
    ),
  );

  const [firstObjectEffect] = effectsOfSelectedObjects;
  const convertedDuration = firstObjectEffect.duration / 1000;
  const convertedDelay = firstObjectEffect.delay / 1000;

  const handleDurationChange = (durationValue: number | number[] | string): void => {
    let duration = 1000;

    if (typeof durationValue === 'number') {
      duration = durationValue;
    }

    if (Array.isArray(durationValue)) {
      duration = durationValue[0];
    }

    if (typeof durationValue === 'string') {
      duration = parseFloat(durationValue);
    }

    dispatch(HistoryActions.Capture());
    dispatch(
      EffectActions.upsertEffects(
        effectsOfSelectedObjects.map((effect) => ({
          ...effect,
          duration: duration * 1000,
        })),
      ),
    );
  };

  const handleDelayChange = (delayValue: number | number[] | string): void => {
    let delay = 1000;

    if (typeof delayValue === 'number') {
      delay = delayValue;
    }

    if (Array.isArray(delayValue)) {
      delay = delayValue[0];
    }

    if (typeof delayValue === 'string') {
      delay = parseFloat(delayValue);
    }

    dispatch(HistoryActions.Capture());
    dispatch(
      EffectActions.upsertEffects(
        effectsOfSelectedObjects.map((effect) => ({
          ...effect,
          delay: delay * 1000,
        })),
      ),
    );
  };

  return (
    <div>
      <p className="text-sm">duration</p>
      <div className="flex items-center gap-2">
        <div className="w-5/12">
          <input
            className="w-full"
            type="number"
            step={0.1}
            value={convertedDuration}
            onChange={(e): void => handleDurationChange(e.currentTarget.value)}
          />
        </div>
        <div className="flex items-center w-full">
          <Slider
            min={0}
            max={10}
            step={0.1}
            value={[convertedDuration]}
            onValueChange={(duration): void => handleDurationChange(duration)}
          />
        </div>
      </div>
      <p className="text-sm">delay</p>
      <div className="flex items-center gap-2">
        <div className="w-5/12">
          <input
            className="w-full"
            type="number"
            step={0.1}
            value={convertedDelay}
            onChange={(e): void => handleDelayChange(e.currentTarget.value)}
          />
        </div>
        <div className="flex items-center w-full">
          <Slider
            min={0}
            max={10}
            step={0.1}
            value={[convertedDelay]}
            onValueChange={(duration): void => handleDelayChange(duration)}
          />
        </div>
      </div>
    </div>
  );
};
