import { FunctionComponent, useContext } from 'react';
import { QueueObjectContainerContext } from './Container';
import { Circle } from './rect/Circle';
import { Icon } from './rect/Icon';
import { Line } from './rect/Line';
import { Square } from './rect/Square';

export interface RectProps {
  onRectMousedown?(): void;
}

export const Rect: FunctionComponent<RectProps> = (props) => {
  const containerContext = useContext(QueueObjectContainerContext);
  switch (containerContext.object.type) {
    case 'circle':
      return <Circle {...props}></Circle>;
    case 'rect':
      return <Square {...props}></Square>;
    case 'line':
      return <Line {...props}></Line>;
    case 'icon':
      return <Icon {...props}></Icon>;
    default:
      return <></>;
  }
};
