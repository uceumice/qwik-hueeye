import { useComputed$ } from "@builder.io/qwik";
import type { AriaAttributes } from "@builder.io/qwik";
import { $, component$, Slot, useSignal, useStyles$ } from "@builder.io/qwik";
import type { LinkProps} from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { ArrowsKeys, nextFocus, previousFocus, useKeyboard, clsq } from "../utils";
import styles from './navlist.scss?inline';
import { AnchorAttributes, NavAttributes } from "../types";

const disabledKeys = [...ArrowsKeys, ' '];

const isSamePathname = (pathname: string, href?: string) => {
  if (href === undefined) return;
  if (pathname === href) return true;
  if (pathname === `${href}/`) return true;
  return false;
}

export const Navlist = component$((props: NavAttributes) => {
  useStyles$(styles);
  const ref = useSignal<HTMLElement>();
  useKeyboard(ref, disabledKeys, $((event, el) => {
    const key = event.key;
    if (key === 'ArrowRight' || key === 'ArrowDown') nextFocus(el.querySelectorAll<HTMLElement>('a'));
    if (key === 'ArrowLeft' || key === 'ArrowUp') previousFocus(el.querySelectorAll<HTMLElement>('a'));
    if (key === ' ') (event.target as HTMLElement).click();
  }));
  return <nav {...props} ref={ref} class={clsq('nav-list', props.class)}>
    <ul role="list">
      <Slot/>
    </ul>
  </nav>
});

export const NavLink = component$((props: LinkProps) => {
  const { url } = useLocation();
  const href = props.href;
  const aria = useComputed$(() => {
    const result: AriaAttributes = {};
    if (isSamePathname(url.pathname, href)) result['aria-current'] = 'page';
    return result;
  });
  return <li>
    <Link {...props} {...aria.value}>
      <Slot/>
    </Link>
  </li>
});


export interface NavAnchorProps extends AnchorAttributes {}
export const NavAnchor = component$((props: NavAnchorProps) => {
  const { url } = useLocation();
  const href = props.href;
  const aria = useComputed$(() => {
    const result: AriaAttributes = {};
    if (isSamePathname(url.pathname, href)) result['aria-current'] = 'page';
    return result;
  });
  return <li>
    <a {...props} {...aria.value}>
      <Slot/>
    </a>
  </li>
});