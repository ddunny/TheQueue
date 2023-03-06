import { OBJECT_EFFECT_META, RotateEffect } from 'model/effect';
import { QueueRotate } from 'model/property';
import { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { SettingSelectors } from 'store/settings/selectors';
import { getEffectEntityKey } from 'store/effect/reducer';
import { EffectSelectors } from 'store/effect/selectors';
import { EffectActions } from '../../store/effect';
import { HistoryActions } from 'store/history';

export const EffectControllerRotate = (): ReactElement => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(SettingSelectors.settings);

  const firstObjectRotateEffect = useAppSelector((state) =>
    EffectSelectors.byId(
      state,
      getEffectEntityKey({
        index: settings.queueIndex,
        objectId: settings.selectedObjectIds[0],
        type: OBJECT_EFFECT_META.ROTATE,
      }),
    ),
  ) as RotateEffect;

  const handleCurrentRotateChange = (rotate: QueueRotate): void => {
    settings.selectedObjectIds.forEach((objectId) => {
      const nextEffect: RotateEffect = {
        ...firstObjectRotateEffect,
        index: settings.queueIndex,
        prop: {
          ...firstObjectRotateEffect,
          ...rotate,
        },
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
      <p className="text-sm">rotation</p>
      <div className="flex items-center gap-2">
        <input
          className="w-full"
          type="number"
          step={5}
          value={firstObjectRotateEffect.prop.degree}
          onChange={(e): void => {
            handleCurrentRotateChange({ degree: parseInt(e.target.value) });
          }}
        />
      </div>
    </div>
  );
};
