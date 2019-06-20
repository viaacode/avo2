/* tslint:disable */
import {useState, useRef, useCallback, useMemo} from 'react';
import raf from 'raf';
import {
  callAll,
  noop,
  getElementHeight,
  makeTransitionStyles,
  joinTransitionProperties,
  defaultTransitionStyles,
} from './utils';
import {useUniqueId, useLayoutEffectAfterMount, useStateOrProps} from './hooks';

export default function useCollapse(initialConfig = {}) {
  const uniqueId = useUniqueId();
  const el = useRef(null);
  const [isOpen, setOpen] = useStateOrProps(initialConfig);
  const [shouldAnimateOpen, setShouldAnimateOpen] = useState(null);
  const [heightAtTransition, setHeightAtTransition] = useState(0);
  const collapsedHeight = `${initialConfig.collapsedHeight || 0}px`;
  const {expandStyles, collapseStyles} = useMemo(
    () => makeTransitionStyles(initialConfig),
    [initialConfig]
  );
  const [styles, setStyles] = useState(
    isOpen ? null : {display: collapsedHeight === '0px' ? 'none' : 'block', height: collapsedHeight, overflow: 'hidden'}
  );
  const [mountChildren, setMountChildren] = useState(isOpen);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const toggleOpen = useCallback(() => setOpen(oldOpen => !oldOpen), []);

  useLayoutEffectAfterMount(() => {
    if (isOpen) {
      setMountChildren(true);
      setStyles(oldStyles => ({
        ...oldStyles,
        ...expandStyles,
        display: 'block',
        overflow: 'hidden',
      }));
      setShouldAnimateOpen(true);
    } else {
      const height = getElementHeight(el);
      setStyles(oldStyles => ({...oldStyles, ...collapseStyles, height}));
      setShouldAnimateOpen(false);
    }
  }, [isOpen]);

  useLayoutEffectAfterMount(() => {
    const height = getElementHeight(el);
    if (shouldAnimateOpen) {
      setStyles(oldStyles => ({...oldStyles, height}));
      setHeightAtTransition(height);
    } else {
      // requstAnimationFrame required to transition, otherwise will flash closed
      raf(() => {
        setStyles(oldStyles => ({
          ...oldStyles,
          height: collapsedHeight,
          overflow: 'hidden',
        }));
        setHeightAtTransition(height);
      });
    }
  }, [shouldAnimateOpen]);

  const handleTransitionEnd = e => {
    // Sometimes onTransitionEnd is triggered by another transition,
    // such as a nested collapse panel transitioning. But we only
    // want to handle this if this component's element is transitioning
    if (e.target !== el.current) {
      return;
    }

    const height = getElementHeight(el);
    if (isOpen && height !== heightAtTransition) {
      setHeightAtTransition(height);
      setStyles(oldStyles => ({...oldStyles, height}));
      return;
    }

    if (isOpen) {
      setStyles();
    } else {
      setMountChildren(false);
      setStyles({
				overflow: 'hidden',
        display: collapsedHeight === '0px' ? 'none' : 'block',
        height: collapsedHeight,
      });
    }
  };

  return {
    getToggleProps(
      {disabled, onClick, ...rest} = {
        disabled: false,
        onClick: noop,
      }
    ) {
      return {
        type: 'button',
        role: 'button',
        id: `react-collapsed-toggle-${uniqueId}`,
        'aria-controls': `react-collapsed-panel-${uniqueId}`,
        'aria-expanded': isOpen ? 'true' : 'false',
        tabIndex: 0,
        ...rest,
        onClick: disabled ? noop : callAll(onClick, toggleOpen),
      };
    },
    getCollapseProps(
      {style, onTransitionEnd, ...rest} = {style: {}, onTransitionEnd: noop}
    ) {
      return {
        id: `react-collapsed-panel-${uniqueId}`,
        'aria-hidden': isOpen ? null : 'true',
        ...rest,
        ref: el,
        onTransitionEnd: callAll(handleTransitionEnd, onTransitionEnd),
        style: {
          // Default transition duration and timing function, so height will transition
          // when resting and the height of the collapse changes
          ...defaultTransitionStyles,
          // additional styles passed, e.g. getCollapseProps({style: {}})
          ...style,
          // combine any additional transition properties with height
          transitionProperty: joinTransitionProperties(
            style.transitionProperty
          ),
          // style overrides from state
          ...styles,
        },
      };
    },
    isOpen,
    toggleOpen,
    mountChildren,
  };
}
