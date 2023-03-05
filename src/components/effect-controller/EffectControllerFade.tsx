import { ReactElement } from 'react';
import { FadeEffect } from 'model/effect';
import { Slider } from 'components/slider';
import { useAppDispatch, useAppSelector } from 'store/hooks';
import { SettingSelectors } from 'store/settings/selectors';
import { getEffectEntityKey } from 'store/effect/reducer';
import { EffectSelectors } from 'store/effect/selectors';
import { EffectActions } from '../../store/effect';

export const EffectControllerFade = (): ReactElement => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(SettingSelectors.settings);

  const firstObjectRotateEffect = useAppSelector((state) =>
    EffectSelectors.byId(
      state,
      getEffectEntityKey({
        index: settings.queueIndex,
        objectId: settings.selectedObjectIds[0],
        type: 'fade',
      }),
    ),
  ) as FadeEffect;

  const handleCurrentOpacityChange = (opacityValue: number | number[] | string): void => {
    let opacity = 1;

    if (typeof opacityValue === 'number') {
      opacity = opacityValue;
    }

    if (Array.isArray(opacityValue)) {
      opacity = opacityValue[0];
    }

    if (typeof opacityValue === 'string') {
      opacity = parseFloat(opacityValue);
    }

    settings.selectedObjectIds.forEach((objectId) => {
      const nextEffect = {
        ...firstObjectRotateEffect,
        prop: {
          ...firstObjectRotateEffect.prop,
          opacity,
        },
      };

      dispatch(
        EffectActions.upsertEffect({
          ...nextEffect,
          objectId: objectId,
          index: settings.queueIndex,
          type: 'fade',
        }),
      );
    });
  };

  return (
    <div>
      <p className="text-sm">fade</p>
      <div className="flex items-center gap-2">
        <div className="w-5/12">
          <input
            className="w-full"
            type="number"
            step={0.1}
            value={firstObjectRotateEffect.prop.opacity}
            onChange={(e): void => {
              handleCurrentOpacityChange(e.target.value);
            }}
          />
        </div>
        <div className="flex items-center w-full">
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[firstObjectRotateEffect.prop.opacity]}
            onValueChange={(value): void => {
              handleCurrentOpacityChange(value);
            }}
          />
        </div>
      </div>
    </div>
  );
};
