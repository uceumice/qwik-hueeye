import { $, component$, createContextId, useContext, useContextProvider, useId, useSignal, useStyles$, useTask$ } from "@builder.io/qwik";
import type { Signal, JSXNode, QRL } from "@builder.io/qwik";
import type { UlAttributes } from "../types";
import { clsq, cssvar } from '../utils';
import styles from './toaster.scss?inline';


export interface ToastContentProps extends Omit<ToastProps, "content"> {
  timeout: Signal<number>;
}
export interface ToastProps {
  id: string;
  // ----
  content: string | QRL<(props: ToastContentProps) => JSXNode>;
  // ----
  position: 'start' | 'center' | 'end';
  // ----
  duration: number;
  exitDuration: number;
  // ----
  /**
   * Aria role: default 'status'.
   * @description The toast uses the html element output, which has implicit role 'status'
   * For information that requires an immediate attention of the user use 'alert'.
  */
  role: 'alert' | 'status';
  class?: string;
}
export type ToastParams = Partial<Omit<ToastProps, 'content'>>

export const ToasterContext = createContextId<{
  toaster: Signal<HTMLElement>,
  toasts: Signal<ToastProps[]>,
}>('ToasterContext');

export const useToasterProvider = () => {
  const toaster = useSignal<HTMLElement>();
  const toasts = useSignal<ToastProps[]>([]);
  useContextProvider(ToasterContext, { toaster, toasts });
}

function flip(toaster?: HTMLElement) {
  if (!toaster) return;
  const previous: Record<string, number> = {};
  const list = toaster.querySelectorAll('li');
  for (const item of list) {
    previous[item.id] = item.getBoundingClientRect().top;
  }
  const animate = () => {
    const newList = toaster.querySelectorAll('li');
    if (newList.length === list.length) requestAnimationFrame(animate);
    for (const item of newList) {
      const delta = previous[item.id] - item.getBoundingClientRect().top;
      if (delta) {
        item.animate({ transform: [`translateY(${delta}px)`, `translateY(0)`] }, {
          duration: 150,
          easing: 'ease-out'
        });
      }
    }
  }
  requestAnimationFrame(animate)
}

export const useToaster = () => {
  const { toaster, toasts } = useContext(ToasterContext);

  return {
    add: $((content: ToastProps['content'], params: ToastParams = {}) => {
      params.id ||= crypto.randomUUID();
      params.duration ||= 1500;
      params.position ||= 'center';
      params.role ||= 'status';
      params.exitDuration ||= 300;
      flip(toaster.value);
      toasts.value = toasts.value.concat({ content, ...params } as ToastProps);
      return params.id!;
    }),
    clear: $(() => {
      toasts.value.forEach((toast) => {
        toast.duration = 0;
      })
      toasts.value = [...toasts.value];
    }),
    remove: $((id: string) => {
      const toast = toasts.value.find(t => t.id === id);
      if (toast) {
        toast.duration = 0;
        toasts.value = [...toasts.value];
      }
    })
  }
}

export const Toaster = component$((props: UlAttributes) => {
  useStyles$(styles);
  const { toaster, toasts } = useContext(ToasterContext);

  return <ul {...props} ref={toaster} class={clsq('toaster', props.class)}>
    {toasts.value.map((props) => <Toast key={props.id} {...props} />)}
  </ul>
});

export const Toast = component$((props: ToastProps) => {
  const { toaster, toasts } = useContext(ToasterContext);
  const { content, position, ...attributes } = props;
  const itemId = useId();

  const intervalId = useSignal<number>();
  const timeoutId = useSignal<number>();

  const leaving = useSignal<boolean>(false);
  const timeout = useSignal(props.duration);

  /* -------------------------------------------------------------------------- */
  /*                              Animation States                              */
  /* -------------------------------------------------------------------------- */
  const remove = $(() => {
    flip(toaster.value);
    toasts.value = toasts.value.filter(t => t.id !== props.id);
  });

  const leaves = $(() => {
    leaving.value = true;
    setTimeout(remove, props.exitDuration);
  });

  /* -------------------------------------------------------------------------- */
  /*                             Countdown Controls                             */
  /* -------------------------------------------------------------------------- */
  const start = $(() => {
    const start = Date.now();

    intervalId.value = setInterval(() => {
      timeout.value = Math.max(props.duration - (Date.now() - start), 0);
    }, 1);

    timeoutId.value = setTimeout(leaves, props.duration);
  });

  const reset = $(() => {
    clearInterval(intervalId.value);
    clearTimeout(timeoutId.value);
  });

  /* ------------------------------------ . ----------------------------------- */
  useTask$(({ cleanup }) => {
    start();
    cleanup(() => {
      clearTimeout(intervalId.value)
      clearTimeout(timeoutId.value)
    });
  });

  useTask$(({ track }) => {
    const duration = track(() => props.duration);
    if (!duration) leaves();
  });

  return (<li
    id={itemId}

    class={leaving.value ? 'leave' : ''}

    onMouseEnter$={() => {
      reset();
    }}
    onMouseLeave$={() => {
      start();
    }}

    {...cssvar({
      toastPosition: position === 'center' ? position : `flex-${position}`
    })}
  >
    <output {...attributes} class={clsq('toast', props.class)}>
      {typeof content === 'string' ? content : content({ ...props, timeout })}
    </output>
  </li>);
});