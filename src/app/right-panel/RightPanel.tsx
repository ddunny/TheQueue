import { debounce } from 'cdk/functions/debounce';
import clsx from 'clsx';
import { Slider } from 'components';
import { QueueObjectType, QueueSquare } from 'model/object';
import {
  ChangeEvent,
  createContext,
  FormEvent,
  HTMLAttributes,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { documentState } from 'store/document';
import { documentSettingsState } from 'store/settings';
import classes from './RightPanel.module.scss';

// context start
interface ObjectStylerContextValue {
  objects: QueueObjectType[];
}

const ObjectStylerContext = createContext<ObjectStylerContextValue | null>(
  null
);

const useObjectStylerContext = (): ObjectStylerContextValue => {
  const context = useContext(ObjectStylerContext);

  if (!context) {
    throw new Error('useObjectStylerContext Provider not found!');
  }

  return context;
};
// context end

// ------------- styler start -------------
type ObjectStylerElementProps = HTMLAttributes<HTMLDivElement>;
type StyleChangeValue = { [k: string]: FormDataEntryValue };
interface ObjectStylerProps extends PropsWithChildren {
  objects: QueueObjectType[];
  onStyleChange?: (value: StyleChangeValue) => void;
}

const ObjectStyler = ({
  children,
  objects,
  onStyleChange,
}: ObjectStylerProps): ReactElement => {
  const handleStyleChange = (event: FormEvent<HTMLFormElement>): void => {
    const formData = new FormData(event.currentTarget);

    onStyleChange?.(Object.fromEntries(formData));
  };

  return (
    <ObjectStylerContext.Provider value={{ objects }}>
      <form onChange={handleStyleChange}>{children}</form>
    </ObjectStylerContext.Provider>
  );
};

const ObjectStylerEffectList = ({
  ...props
}: ObjectStylerElementProps): ReactElement => {
  const { objects } = useObjectStylerContext();
  const [firstObject] = objects;

  return (
    <div {...props}>
      <p>Object effects</p>
      <ul className={classes['scroll-list-box']}>
        {firstObject.effects.map((effect, index) => (
          <li key={`effect-${index}`}>
            <span># {effect.index + 1} </span>
            <span>{effect.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ObjectStylerCurrentQueueEffect = ({
  ...props
}: ObjectStylerElementProps): ReactElement => {
  const settings = useRecoilValue(documentSettingsState);
  const { objects } = useObjectStylerContext();
  const [firstObject] = objects;
  const currentQueueObjectEffects = firstObject.effects.filter(
    (effect) => effect.index === settings.queueIndex
  );
  return (
    <div {...props}>
      <p>Current queue effects</p>
      <ul className={classes['scroll-list-box']}>
        {currentQueueObjectEffects.map((currentQueueObjectEffect) => (
          <li key={currentQueueObjectEffect.type}>
            {currentQueueObjectEffect.type}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ObjectStylerBackground = (): ReactElement => {
  const { objects } = useObjectStylerContext();
  const [firstObject] = objects;
  const [opacity, setOpacity] = useState([firstObject.fill.opacity]);

  const handleOpacityChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setOpacity([parseInt(e.currentTarget.value, 10)]);
  };

  return (
    <div>
      <div className="mb-1">
        <p className="font-medium">Background</p>
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm">color</p>
          <div className="w-6 h-6">
            <label
              className={classes['input-color']}
              style={{ backgroundColor: firstObject.fill.color }}
            >
              <input
                type="color"
                name="backgroundColor"
                id="backgroundColor"
                className={classes['input-color']}
                defaultValue={firstObject.fill.color}
              />
            </label>
          </div>
        </div>
        <div>
          <input
            type="text"
            name="backgroundOpacity"
            value={opacity[0]}
            readOnly
            hidden
          />
          <p className="text-sm">opacity</p>
          <div className="flex items-center gap-2">
            <div className="w-1/3">
              <input
                className="w-full"
                type="number"
                step={0.1}
                value={opacity[0]}
                onChange={handleOpacityChange}
              />
            </div>
            <div className="flex items-center w-full">
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={opacity}
                onValueChange={setOpacity}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ObjectStylerStroke = (): ReactElement | null => {
  const { objects } = useObjectStylerContext();
  const [firstObject] = objects;

  const tempType = firstObject as QueueSquare;
  const [width, setWidth] = useState([tempType.stroke.width]);

  if (firstObject.type === 'icon') {
    return null;
  }

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setWidth([parseInt(e.currentTarget.value, 10)]);
  };

  return (
    <div>
      <div className="mb-1">
        <p className="font-medium">Border</p>
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <input
            type="text"
            name="strokeWidth"
            value={width[0]}
            readOnly
            hidden
          />
          <p className="text-sm">width</p>
          <div className="flex items-center gap-2">
            <div className="w-1/3">
              <input
                className="w-full"
                type="number"
                value={width[0]}
                onChange={handleWidthChange}
              />
            </div>
            <div className="flex items-center w-full">
              <Slider
                min={0}
                max={100}
                value={width}
                onValueChange={setWidth}
              />
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm">color</p>
          <div className="w-6 h-6">
            <label
              className={classes['input-color']}
              style={{ backgroundColor: firstObject.stroke.color }}
            >
              <input
                type="color"
                name="strokeColor"
                id="strokeColor"
                className={classes['input-color']}
                defaultValue={firstObject.stroke.color}
              />
            </label>
          </div>
        </div>
        <div>
          <p className="text-sm">style</p>
          <div>
            <select defaultValue={firstObject.stroke.dasharray}>
              <option value="solid">--------</option>
              <option value="">- - - - -</option>
              <option value="">-- -- --</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const ObjectStylerOpacity = (): ReactElement => {
  const { objects } = useObjectStylerContext();
  const [firstObject] = objects;
  const [opacity, setOpacity] = useState([firstObject.fill.opacity]);

  const handleOpacityChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setOpacity([parseInt(e.currentTarget.value, 10)]);
  };

  return (
    <div>
      <div>
        <input
          type="text"
          name="opacity"
          value={opacity[0]}
          readOnly
          hidden
        />
        <p className="text-sm">opacity</p>
        <div className="flex items-center gap-2">
          <div className="w-1/3">
            <input
              className="w-full"
              type="number"
              step={0.1}
              value={opacity[0]}
              onChange={handleOpacityChange}
            />
          </div>
          <div className="flex items-center w-full">
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={opacity}
              onValueChange={setOpacity}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ObjectStyler.EffectList = ObjectStylerEffectList;
ObjectStyler.CurrentQueueEffect = ObjectStylerCurrentQueueEffect;
ObjectStyler.Background = ObjectStylerBackground;
ObjectStyler.Stroke = ObjectStylerStroke;
ObjectStyler.Opacity = ObjectStylerOpacity;
// ------------- styler end -------------

export const RightPanel = ({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>): ReactElement | null => {
  const settings = useRecoilValue(documentSettingsState);
  const [queueDocument, setQueueDocument] = useRecoilState(documentState);
  const selectedObjects = queueDocument!.pages[
    settings.queuePage
  ].objects.filter((object) =>
    settings.selectedObjectUUIDs.includes(object.uuid)
  );
  const hasSelectedObjects = selectedObjects.length > 0;

  const setDocumentHistory = useCallback(
    debounce(() => {
      console.log('history save');
    }, 500),
    []
  );

  const handleStyleChange = (value: StyleChangeValue): void => {
    const newObjects = queueDocument!.pages[settings.queuePage].objects.map(
      (object) => {
        if (!settings.selectedObjectUUIDs.includes(object.uuid)) {
          return object;
        }

        // 선택된 오브젝트 -> 변경되는 스타일 적용해야함
        const updatedModel = ((): QueueObjectType => {
          switch (object.type) {
            case 'rect':
            case 'circle':
              return {
                ...object,
                fill: {
                  ...object.fill,
                  color: value.backgroundColor as string,
                  opacity: parseFloat(value.backgroundOpacity as string),
                },
                stroke: {
                  ...object.stroke,
                  color: value.strokeColor as string,
                  width: parseInt(value.strokeWidth as string),
                },
                fade: {
                  ...object.fade,
                  opacity: parseFloat(value.opacity as string),
                },
              };
            case 'icon':
              return {
                ...object,
                fill: {
                  ...object.fill,
                  color: value.backgroundColor as string,
                },
                fade: {
                  ...object.fade,
                  opacity: parseFloat(value.opacity as string),
                },
              };
          }
        })();

        return updatedModel;
      }
    );

    const newPages = queueDocument!.pages.slice(0);
    newPages[settings.queuePage] = {
      ...queueDocument!.pages[settings.queuePage],
      objects: newObjects,
    };

    setQueueDocument({ ...queueDocument!, pages: newPages });
    setDocumentHistory();
  };

  return (
    <div
      id="right-panel-root"
      className={clsx(classes.root, className)}
      {...props}
    >
      {hasSelectedObjects && (
        <div className="p-2">
          <div>
            <ObjectStyler
              objects={selectedObjects}
              onStyleChange={handleStyleChange}
            >
              <div className="flex flex-col gap-3">
                <ObjectStyler.EffectList />
                <ObjectStyler.CurrentQueueEffect />
                <hr className="my-2" />
                <ObjectStyler.Background />
                <hr className="my-2" />
                {selectedObjects[0].type !== 'icon' && (
                  <>
                    <ObjectStyler.Stroke />
                    <hr className="my-2" />
                  </>
                )}
                <ObjectStyler.Opacity />
              </div>
            </ObjectStyler>
          </div>
        </div>
      )}
    </div>
  );
};
