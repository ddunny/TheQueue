import { FunctionComponent } from 'react';
import clsx from 'clsx';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Input } from '../../components/input/Input';
import { Object } from '../../components/object/Object';
import { ObjectGrid } from '../../components/object/ObjectGrid';
import { ObjectGroup } from '../../components/object/ObjectGroup';
import { ObjectGroupTitle } from '../../components/object/ObjectGroupTitle';
import { documentSettingsState } from '../../store/settings';
import { documentState } from '../../store/document';
import { generateUUID } from '../../cdk/functions/uuid';
import styles from './LeftPanel.module.scss';

export const LeftPanel: FunctionComponent = () => {
  const [document, setDocument] = useRecoilState(documentState);
  const settings = useRecoilValue(documentSettingsState);

  const createSquare = (): void => {
    setDocument({
      ...document,
      objects: [
        ...document.objects,
        {
          type: 'rect',
          uuid: generateUUID(),
          rect: {
            x: 0,
            y: 0,
            width: 300,
            height: 300,
          },
          stroke: {
            width: 1,
            color: '#000000',
            dashArray: 'solid',
          },
          fill: {
            color: '#ffffff',
          },
          fade: {
            opacity: 1,
          },
          text: {
            text: 'Hello World',
            fontSize: 24,
            fontColor: '#000000',
            fontFamily: 'Arial',
            horizontalAlign: 'center',
            verticalAlign: 'middle',
          },
          effects: [
            {
              type: 'create',
              duration: 0,
              index: settings.queueIndex,
            },
          ],
        },
      ],
    });
  };

  return (
    <div className={clsx(styles.container)}>
      <Input placeholder="Search Shape" className={styles.input}></Input>
      <ObjectGroup>
        <ObjectGroupTitle>Group Title</ObjectGroupTitle>
        <ObjectGrid>
          <Object onClick={createSquare}>
            <svg
              version="1.1"
              baseProfile="full"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.canvas}
            >
              <g>
                <rect
                  width="30"
                  height="30"
                  stroke="black"
                  strokeWidth="4"
                  fill="transparent"
                />
              </g>
            </svg>
          </Object>
        </ObjectGrid>
      </ObjectGroup>
      <ObjectGroup>
        <ObjectGroupTitle>Group Title</ObjectGroupTitle>
        <ObjectGrid>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
          <Object>Obj1</Object>
        </ObjectGrid>
      </ObjectGroup>
    </div>
  );
};
