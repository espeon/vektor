import React from 'react';

const Grain = ({
  color = '#562c8f',
  className = '',
  intensity = 23,
  // Use tailwind-compatible props
  opacity = 100,
  zIndex = 10,
}) => {
  const filterId = `grain-filter-${Math.random().toString(36).substr(2, 9)}`;

  // Convert opacity from tailwind scale (0-100) to CSS scale (0-1)
  const opacityValue = opacity / 100;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: opacityValue, zIndex: -zIndex }}
    >
      <svg
        className="block w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
      >
        <defs>
          <filter
            id={filterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
            color-interpolation-filters="linearRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.071"
              numOctaves="4"
              seed="15"
              stitchTiles="stitch"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              result="turbulence"
            />
            <feSpecularLighting
              surfaceScale={intensity}
              specularConstant="1.4"
              specularExponent="20"
              lighting-color={color}
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              in="turbulence"
              result="specularLighting"
            >
              <feDistantLight azimuth="3" elevation="50" />
            </feSpecularLighting>
            <feColorMatrix
              type="saturate"
              values="0"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
              in="specularLighting"
              result="colormatrix"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="transparent" />
        <rect
          width="100%"
          height="100%"
          fill={color}
          filter={`url(#${filterId})`}
        />
      </svg>
    </div>
  );
};

export default Grain;
