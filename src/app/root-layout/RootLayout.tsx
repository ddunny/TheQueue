import {
  createContext,
  FunctionComponent,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { useRecoilState } from 'recoil';
import { documentSettingsState } from '../../store/settings';
import { QueueEditor, QueueEditorRef } from '../../components/editor/Editor';
import { LeftPanel } from '../left-panel/LeftPanel';
import { RightPanel } from '../right-panel/RightPanel';
import { QueueSubtoolbar } from '../subtoolbar/Subtoolbar';
import { QueueToolbar } from '../toolbar/Toolbar';
import styles from './RootLayout.module.scss';

export const RootContext = createContext({});

export const RootLayout: FunctionComponent<{ children?: ReactNode }> = (
  props
) => {
  const editorRef = useRef<QueueEditorRef>(null);
  const [settings, setSettings] = useRecoilState(documentSettingsState);

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && settings.presentationMode) {
        setSettings({ ...settings, presentationMode: false });
      }
    });
  }, [settings, setSettings]);

  return (
    <RootContext.Provider value={{}}>
      <div className={styles.container}>
        {!settings.presentationMode ? (
          <>
            <QueueToolbar></QueueToolbar>
            <QueueSubtoolbar
              onNextQueueClick={(): void => editorRef.current?.animate()}
              onPreviousQueueClick={(): void => editorRef.current?.animate()}
            ></QueueSubtoolbar>
          </>
        ) : null}
        <div className={styles.bottom}>
          {!settings.presentationMode ? <LeftPanel></LeftPanel> : null}
          <QueueEditor></QueueEditor>
          {!settings.presentationMode ? <RightPanel /> : null}
        </div>
      </div>
    </RootContext.Provider>
  );
};
