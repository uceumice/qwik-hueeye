import { component$, createContextId, Slot, useContext, useContextProvider, useSignal, useId, useStyles$, $, useStore } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import { Popover } from "../dialog/popover";
import type { ButtonAttributes, DivAttributes, InputAttributes, MenuAttributes } from "../types";
import { useKeyboard, nextFocus, previousFocus, clsq } from "../utils";
import styles from './menu.scss?inline';

interface MenuContext {
  menuId: string;
  triggerId: string;
  origin: Signal<HTMLElement | undefined>;
  open: Signal<boolean>;
}

interface MenuRootContext  {
  root: Signal<HTMLElement | undefined>;
  openMenu: Record<string, Signal<boolean>>
} 

const MenuRootContext = createContextId<MenuRootContext>('MenuRootContext');
const MenuContext = createContextId<MenuContext>('MenuContext');

export const MenuRoot = component$((props: DivAttributes) => {
  useStyles$(styles);
  const root = useSignal<HTMLElement>();
  const openMenu = useStore<Record<string, Signal<boolean>>>({});
  useContextProvider(MenuRootContext, { root, openMenu });
  return <div {...props} ref={root} class={clsq('menu-root', props.class)}>
    <Slot/>
  </div>
});


interface MenuTriggerProps extends Omit<ButtonAttributes, 'ref' | 'onClick$'> {}
export const MenuTrigger = component$((props: MenuTriggerProps) => {
  const {openMenu} = useContext(MenuRootContext);
  const ref = useSignal<HTMLElement>();
  const triggerId = useId();
  const menuId = useId();
  const open = useSignal(false);
  openMenu[menuId] = open;
  useContextProvider(MenuContext, {
    menuId: menuId,
    triggerId: triggerId,
    open,
    origin: ref
  })
  return <>
    <button {...props}
      ref={ref}
      class={clsq('menu-trigger', props.class)}
      type="button"
      id={triggerId}
      onClick$={() => open.value = true}
      aria-haspopup="menu"
      aria-controls={menuId}
    >
      <Slot />
    </button>
    <Slot name="menu"/>
  </>
});

// TODO: create ContextMenu element
// type ContextMenuTriggerProps = Omit<ButtonAttributes, 'ref' | 'onContextMenu$'>
// export const ContextMenuTrigger = component$((props: ContextMenuTriggerProps) => {
//   const { menuId, triggerId, origin, open } = useContext(MenuContext);
//   return <button {...props}
//     ref={origin}
//     id={triggerId}
//     onContextMenu$={() => open.value = true}
//     aria-haspopup="true"
//     aria-controls={menuId}
//   >
//     <Slot />
//   </button>
// });

interface MenuProps extends Omit<MenuAttributes, 'id'> {}
export const Menu = component$((props: MenuProps) => {
  const {root} = useContext(MenuRootContext);
  const list = useSignal<HTMLElement>();
  const { menuId, triggerId, origin, open } = useContext(MenuContext);
  useKeyboard(list, ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'], $((event, el) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextFocus(el.querySelectorAll<HTMLElement>('button, input'))
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      previousFocus(el.querySelectorAll<HTMLElement>('button, input'))
    }
  }));
  return <Popover origin={origin} open={open} layer={root} position="inline" class="menu-overlay">
    <menu {...props} id={menuId} ref={list} role="menu" class="menu-list" aria-labelledby={triggerId}>
      <Slot />
    </menu>
  </Popover>
});

interface MenuItemProps extends ButtonAttributes {}

export const MenuItem = component$((props: MenuItemProps) => {
  const {openMenu} = useContext(MenuRootContext);
  const closeAll = $(() => {
    for (const open of Object.values(openMenu)) open.value = false;
  })
  return <li role="presentation">
    <button type="button" role="menuitem" {...props} onClick$={closeAll}>
      <Slot/>
    </button>
  </li>
});

// We need to duplicate the code from MenuTrigger because Slot cannot be forwarded
export const MenuItemTrigger = component$((props: MenuTriggerProps) => {
  const {openMenu} = useContext(MenuRootContext);
  const ref = useSignal<HTMLElement>();
  const triggerId = useId();
  const menuId = useId();
  const open = useSignal(false);
  openMenu[menuId] = open;
  useContextProvider(MenuContext, {
    menuId: menuId,
    triggerId: triggerId,
    open,
    origin: ref
  });
  return <li role="presentation">
    <button {...props} 
      ref={ref}
      id={triggerId}
      role="menuitem" 
      class={clsq('menu-trigger', props.class)}
      type="button"
      onClick$={() => open.value = true}
      aria-haspopup="menu"
      aria-controls={menuId}
    >
      <Slot/>
      <svg viewBox="0 0 5 10" width="5" height="10" focusable="false" aria-hidden="true" fill="currentColor">
        <polygon points="0,0 5,5 0,10"></polygon>
      </svg>
    </button>
    <Slot name="menu"/>
  </li>
})


export const MenuGroup = component$(() => {
  const { triggerId } = useContext(MenuContext);
  return <fieldset aria-labelledby={triggerId}>
    <Slot/>
  </fieldset>
})

type RadioProps = Omit<InputAttributes, 'type' | 'children'>;
export const MenuRadio = component$((props: RadioProps) => {
  const id = useId();
  return <li class="menu-radio">
    <input id={id} role="menuitemradio" type="radio" {...props} value={props.value} />
    <label for={id}>
      <svg focusable="false" viewBox="0 0 24 24" aria-hidden="true">
        <circle r="8" cx="12" cy="12"/>
      </svg>
      <Slot/>
    </label>
  </li>
});


export const MenuCheckbox = component$(() => {
  // TODO 
  return <li role="menuitemcheckbox">
  </li>
});