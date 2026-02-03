/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import chroma from 'chroma-js';

type CropType =
  | 'Sugar Cane'
  | 'Rice'
  | 'Wheat'
  | 'Maize'
  | 'Cotton'
  | 'Tea'
  | 'Millet'
  | 'Sugarcane'
  | 'Jute';

interface OptimizedMapProps {
  geoJsonObject: any;
  disableButtons?: boolean;
}

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import bbox from '@turf/bbox';

interface OptimizedMapProps {
  geoJsonObject: any;
  disableButtons?: boolean;
  heightProps?: number;
  width?: number;
  height?: number;
  cropType: CropType;
}

const cropColors = {
  'Sugar Cane': '#FF6F61',
  Rice: '#6B5B95',
  Wheat: '#88B04B',
  Maize: '#F7CAC9',
  Cotton: '#92A8D1',
  Tea: '#955251',
  Millet: '#B565A7',
  Sugarcane: '#009B77',
  Jute: '#DD4124',
};

// Function to generate stroke color from fill color (darker and contrasting)
const getStrokeColor = (fillColor: string) => {
  return chroma(fillColor).darken(2).hex();
};

const OptimizedMap: React.FC<OptimizedMapProps> = ({
  geoJsonObject,
  heightProps = 80, // Default height
  cropType,
}) => {
  if (!geoJsonObject || !geoJsonObject.features) {
    return <p>Invalid GeoJSON data</p>;
  }

  const [minLng, minLat, maxLng, maxLat] = bbox(geoJsonObject);

  // Compute the center point
  const center: [number, number] = [
    (minLng + maxLng) / 2,
    (minLat + maxLat) / 2,
  ];

  // Adjust scale based on heightProps dynamically
  const getDynamicScaleValue = (
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    height: number
  ): number => {
    const width = maxLng - minLng;
    const heightExtent = maxLat - minLat;

    const maxDimension = Math.max(width, heightExtent);

    // Dynamically adjust the base scale based on heightProps
    const baseScale = height * 75; // Adjust multiplier as needed

    return baseScale / maxDimension;
  };

  const scaleValue = getDynamicScaleValue(
    minLng,
    minLat,
    maxLng,
    maxLat,
    heightProps
  );

  const PROJECTION_CONFIG = {
    scale: scaleValue,
    center: center,
  };

  const fillColor = cropColors[cropType] ?? '#666666';
  const strokeColor = getStrokeColor(fillColor);

  return (
    <ComposableMap
      width={heightProps * 2} // Maintain aspect ratio
      height={heightProps}
      projection="geoMercator"
      projectionConfig={PROJECTION_CONFIG}
    >
      <Geographies geography={geoJsonObject}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={1}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  );
};

export default OptimizedMap;
