/**
 * Ambilight component. Provides a glowing effect filter with grain intensity
 * using specular lighting for a more organic grain texture.
 * Include this component once in your application
 * Then apply the "ambilight" class to any element you want to have the effect
 */
export default function Ambilight() {
  return (
    <>
      <style>
        {`
        .ambilight {
          filter: url(#ambilight);
        }
        `}
      </style>
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <filter
          id="ambilight"
          width="300%"
          height="300%"
          x="-100%"
          y="-100%"
          colorInterpolationFilters="sRGB"
        >
          {/* Preserve original source */}
          <feComposite
            in="SourceGraphic"
            in2="SourceGraphic"
            operator="over"
            result="source-preserved"
          />

          {/* Create the standard ambilight glow effect */}
          <feColorMatrix
            in="SourceGraphic"
            type="saturate"
            values="2.5"
            result="saturated"
          />
          <feColorMatrix
            in="saturated"
            type="matrix"
            values="0.8 0 0 0 0
                   0 1 0 0 0
                   0.2 0 1 0 0
                   33 33 33 101 0"
            result="bright-colors"
          />
          <feMorphology
            in="bright-colors"
            operator="dilate"
            radius="3.5"
            result="spread"
          />
          <feGaussianBlur
            in="spread"
            stdDeviation="80"
            result="ambilight-glow"
          />
          <feComponentTransfer
            in="ambilight-glow"
            result="ambilight-glow-falloff"
          >
            <feFuncA type="gamma" amplitude="1" exponent="1.4" offset="0" />
          </feComponentTransfer>

          {/* Generate specular lighting grain */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="2.5"
            numOctaves="5"
            seed="15"
            stitchTiles="stitch"
            result="noise"
          />

          <feSpecularLighting
            surfaceScale="10"
            specularConstant="2"
            specularExponent="20"
            lightingColor="#999"
            in="noise"
            result="specularLighting"
          >
            <feDistantLight azimuth="3" elevation="144" />
          </feSpecularLighting>

          <feColorMatrix
            type="matrix"
            values="1 0 1 0 0
                   0 1 0 0 0
                   1 0 1 0 0
                   0 0 0 0.2 0"
            in="specularLighting"
            result="white-grain"
          />

          {/* Apply grain to the glow areas */}
          <feComposite
            in="white-grain"
            in2="ambilight-glow"
            operator="in"
            result="grain-in-glow"
          />

          {/* Combine everything */}
          <feMerge>
            <feMergeNode in="ambilight-glow-falloff" />
            <feMergeNode in="grain-in-glow" />
            <feMergeNode in="source-preserved" />
          </feMerge>
        </filter>
      </svg>
    </>
  );
}
