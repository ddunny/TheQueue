import { createTypedListenerMiddleware } from 'middleware';
import { EffectSelectors } from 'store/effect/selectors';
import { objectsSlice } from 'store/object/reducer';
import { PageSelectors } from 'store/page/selectors';
import { SettingsActions } from './actions';
import { documentSettingsSlice } from './reducer';
import { SettingSelectors } from './selectors';

export const settingsMiddleware = createTypedListenerMiddleware();

/**
 * @description
 * 제거된 객체의 선택 상태를 해제
 */
settingsMiddleware.startListening({
  actionCreator: objectsSlice.actions.removeMany,
  effect: (action, api) => {
    api.dispatch(documentSettingsSlice.actions.removeSelection([...action.payload]));
  },
});

/**
 * @description
 * play
 */
settingsMiddleware.startListening({
  actionCreator: SettingsActions.play,
  effect: (_, api) => {
    const state = api.getState();
    const settings = SettingSelectors.settings(state);
    const pages = PageSelectors.all(state);
    const pageId = settings.queuePage;
    const byEffects = pages.map((page) => EffectSelectors.allByPageAndEffectIndex(state, page.id));
    const pageIndex = pages.findIndex((page) => page.id === pageId);
    const queueIndex = settings.queueIndex;

    const targetPageId = pages[pageIndex].id;
    let targetPageIndex = pageIndex;
    let targetQueue = queueIndex;
    if (byEffects[pageIndex][queueIndex + 1]) {
      targetQueue = queueIndex + 1;
    } else if (byEffects[pageIndex + 1]) {
      targetPageIndex = pageIndex + 1;
      targetQueue = 0;
    }

    if (pageId === targetPageId && settings.queueIndex === targetQueue) {
      return;
    }

    api.dispatch(
      documentSettingsSlice.actions.updateSettings({
        queuePage: targetPageIndex,
        queueIndex: targetQueue,
        queuePosition: 'forward',
        queueStart: performance.now(),
      }),
    );
  },
});

/**
 * @description
 * rewind
 */
settingsMiddleware.startListening({
  actionCreator: SettingsActions.rewind,
  effect: (_, api) => {
    const state = api.getState();
    const settings = SettingSelectors.settings(state);
    const pages = PageSelectors.all(state);
    const pageId = settings.queuePage;
    const byEffects = pages.map((page) => EffectSelectors.allByPageAndEffectIndex(state, page.id));
    const pageIndex = pages.findIndex((page) => page.id === pageId);
    const queueIndex = settings.queueIndex;

    const targetPageId = pages[pageIndex].id;
    let targetPageIndex = pageIndex;
    let targetQueue = queueIndex;
    if (byEffects[pageIndex][queueIndex - 1]) {
      targetQueue = queueIndex - 1;
    } else if (byEffects[pageIndex - 1]) {
      targetPageIndex = pageIndex - 1;
      targetQueue = byEffects[targetPageIndex].length - 1;
    }

    if (pageId === targetPageId && settings.queueIndex === targetQueue) {
      return;
    }

    api.dispatch(
      documentSettingsSlice.actions.updateSettings({
        queuePage: targetPageIndex,
        queueIndex: targetQueue,
        queuePosition: 'backward',
        queueStart: performance.now(),
      }),
    );
  },
});
