/* eslint-disable @typescript-eslint/no-unused-vars */
import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { FunctionComponent, MouseEvent, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Drawable } from '../../cdk/draw/Draw';
import { documentState } from '../../store/document';
import { documentSettingsState } from '../../store/settings';

const Selector = styled.div`
  width: 100%;
  height: 100%;
  border: 1px solid gray;
  background-color: rgba(0, 0, 0, 0.2);
`;

export const Content: FunctionComponent = () => {
  const [document] = useRecoilState(documentState);
  const settings = useRecoilValue(documentSettingsState);

  useEffect(() => {
    console.log(settings.scale);
  }, [settings]);

  const onMousedown = (
    event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ): void => {
    console.log(event);
  };

  return (
    <Drawable
      scale={settings.scale}
      drawer={<Selector></Selector>}
      className={css`
        flex: 1;
        background: #e9eaed;
        overflow: auto;
        display: flex;
        // justify-content: center;
        // align-items: center;
      `}
    >
      <div
        style={{
          padding: '10px',
          margin: 'auto',
        }}
      >
        <div
          style={{
            width: document.documentRect.width * settings.scale,
            height: document.documentRect.height * settings.scale,
            background: 'white',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            className={css`
              transform-origin: 0 0;
              transform: scale(${settings.scale});
            `}
          >
            <div
              className={css`
                position: relative;
                border: 1px solid gray;
                box-sizing: border-box;
                background: white;
              `}
              style={{
                width: document.documentRect.width,
                height: document.documentRect.height,
              }}
            >
              {document.objects.map((object) => (
                <div key={object.uuid}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Drawable>
  );
};
