'use client'

import React, { SVGProps } from "react";

const PokeballSvg: React.FC<SVGProps<SVGSVGElement>> = ({
  color = "currentColor",
  height = "2.5rem",
  width = "2.5rem",
  ...props
}) => (
  <svg
    height={height}
    viewBox="0 0 100 100"
    width={width}
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    {...props}
  >
    <circle cx={50} cy={49.6} r={6.5} fill={color} />
    <path
      fill={color}
      d="M81.6 18C64.1.6 35.8.6 18.3 18s-17.5 45.8 0 63.2 45.8 17.5 63.2 0S99 35.5 81.6 18zM40.8 40.5c5.1-5.1 13.3-5.1 18.4 0 5.1 5.1 5.1 13.3 0 18.4s-13.3 5.1-18.4 0-5.1-13.4 0-18.4zm36 36c-14.8 14.8-38.9 14.8-53.7 0l13.4-13.4c7.4 7.4 19.5 7.4 26.9 0 7.4-7.4 7.4-19.5 0-26.9l13.4-13.4c14.9 14.8 14.9 38.9 0 53.7z"
    />
  </svg>
);

export default PokeballSvg;
