/**
 * Mock for react-native-svg in test environment.
 * Uses a Proxy so any SVG element tag (Path, Circle, G, etc.) used by lucide-react-native
 * returns a no-op component instead of undefined.
 */
import React from 'react';
import { View } from 'react-native';

const SvgMock = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, null, children);

const NullComponent = () => null;

const mock = new Proxy(
  { Svg: SvgMock, default: SvgMock },
  {
    get(target, name: string) {
      if (name in target) return target[name as keyof typeof target];
      return NullComponent;
    },
  }
);

export default mock;
export const Svg = SvgMock;
export const Rect = NullComponent;
export const Circle = NullComponent;
export const Ellipse = NullComponent;
export const Path = NullComponent;
export const Line = NullComponent;
export const Polygon = NullComponent;
export const Polyline = NullComponent;
export const G = NullComponent;
export const Text = NullComponent;
export const TSpan = NullComponent;
export const TextPath = NullComponent;
export const Use = NullComponent;
export const Image = NullComponent;
export const ClipPath = NullComponent;
export const Defs = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(View, null, children);
export const Symbol = NullComponent;
export const Mask = NullComponent;
export const LinearGradient = NullComponent;
export const RadialGradient = NullComponent;
export const Stop = NullComponent;
