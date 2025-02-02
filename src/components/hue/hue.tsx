import { component$, createContextId, Slot, useStyles$ } from "@builder.io/qwik";
import { SvgGradient } from "../svg-gradient";
import styles from './hue.scss?inline';

export const HueEyeContext = createContextId('HueEyeContext');

export const useHueEyeProvider = () => {
  useStyles$(styles);
}

export const HueEyeProvider = component$(() => {
  useStyles$(styles);
  return <>
    <Slot/>
    <SvgGradient/>
  </>
})