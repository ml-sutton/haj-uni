/**
 * TypeScript module declaration for SVG imports transformed by `react-native-svg-transformer`.
 * Each `*.svg` file default-exports a React component accepting {@link SvgProps}.
 */
declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}
