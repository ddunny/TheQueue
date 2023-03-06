import { ChevronDownIcon } from '@radix-ui/react-icons';
import { AnimatorTimingFunctionType } from 'cdk/animation/timing';
import { QueueSelect } from 'components/select/Select';
import { QueueEffectType } from 'model/effect';
import { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { SettingSelectors } from 'store/settings/selectors';
import { getEffectEntityKey } from 'store/effect/reducer';
import { EffectSelectors } from 'store/effect/selectors';
import { EffectActions, NormalizedQueueEffect } from '../../store/effect';
import { HistoryActions } from 'store/history';

export type EffectControllerTimingFunctionProps = {
  effectType: QueueEffectType['type'];
};

export const EffectControllerTimingFunction = ({ effectType }: EffectControllerTimingFunctionProps): ReactElement => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(SettingSelectors.settings);
  const firstObjectEffect = useAppSelector((state) =>
    EffectSelectors.byId(
      state,
      getEffectEntityKey({
        index: settings.queueIndex,
        objectId: settings.selectedObjectIds[0],
        type: effectType,
      }),
    ),
  );

  const handleTimingFunctionChange = (timingFunction: string): void => {
    settings.selectedObjectIds.forEach((objectId) => {
      const nextEffect: NormalizedQueueEffect = {
        ...firstObjectEffect,
        timing: timingFunction as AnimatorTimingFunctionType,
      };

      dispatch(HistoryActions.Capture());
      dispatch(
        EffectActions.upsertEffect({
          ...nextEffect,
          objectId: objectId,
          index: settings.queueIndex,
        }),
      );
    });
  };

  return (
    <div>
      <p className="text-sm">timing function</p>
      <QueueSelect.Root defaultValue={firstObjectEffect.timing} onValueChange={handleTimingFunctionChange}>
        <QueueSelect.Trigger>
          <QueueSelect.Value />
          <QueueSelect.Icon>
            <ChevronDownIcon />
          </QueueSelect.Icon>
        </QueueSelect.Trigger>
        <QueueSelect.Portal>
          <QueueSelect.Content>
            <QueueSelect.Viewport>
              <QueueSelect.Item value="linear">linear</QueueSelect.Item>
              <QueueSelect.Item value="ease">ease</QueueSelect.Item>
              <QueueSelect.Item value="ease-in">ease-in</QueueSelect.Item>
            </QueueSelect.Viewport>
          </QueueSelect.Content>
        </QueueSelect.Portal>
      </QueueSelect.Root>
    </div>
  );
};
