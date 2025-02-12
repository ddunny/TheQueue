import * as Separator from '@radix-ui/react-separator';
import clsx from 'clsx';
import { forwardRef } from 'react';
import styles from './Separator.module.scss';

export const Root: React.ForwardRefExoticComponent<Separator.SeparatorProps & React.RefAttributes<HTMLDivElement>> =
  forwardRef(({ className, children, ...props }, ref) => {
    return (
      <Separator.Root {...props} ref={ref} className={clsx(className, styles.SeparatorRoot)}>
        {children}
      </Separator.Root>
    );
  });

export const QueueSeparator = {
  Root,
};
