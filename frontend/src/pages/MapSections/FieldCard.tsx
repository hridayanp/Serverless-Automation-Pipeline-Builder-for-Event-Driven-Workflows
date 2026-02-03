/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from '@/components/ui/card';
import React, { useEffect, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';
import { setFieldSelected } from '@/redux/slices/fieldSlice';
import OptimizedMap from '@/components/Maps/OptimizedMap';

interface FieldCardProps {
  fieldSelected?: any;
  index?: number;
  field?: any;
}

const FieldCard: React.FC<FieldCardProps> = ({
  fieldSelected,
  index,
  field,
}) => {
  const dispatch = useDispatch();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (mapContainerRef.current) {
      const { width, height } = mapContainerRef.current.getBoundingClientRect();
      setSize({ width, height });
    }
  }, []);

  return (
    <Card
      className={`flex flex-col items-center justify-between md:flex-row gap-3 p-4 rounded-md shadow-sm border ${
        fieldSelected?.id === index
          ? 'border-2 border-primary'
          : 'border-gray-200'
      } transition-all duration-200 hover:shadow-md hover:cursor-pointer`}
      onClick={() => dispatch(setFieldSelected(field))}
    >
      {/* Left Section */}
      <div className="flex flex-col justify-between w-full md:w-[70%] space-y-1">
        {/* Top-left field */}
        <div className="flex flex-col items-start ">
          <span className="font-inter font-medium text-[16px] leading-[22px] text-gray-700">
            {field ? field?.field_name : ''}
          </span>

          {/* <span className="font-inter font-medium text-[16px] leading-[22px] text-gray-700">
            {field ? `${field?.area} acres` : ''}
          </span> */}
        </div>

        {/* Bottom-left text */}
        <span className="font-inter leading-[18px] text-gray-900">
          {field ? (
            <>
              <span className="font-semibold text-[16px]">
                {field.crop_name}
              </span>
              {' - '}
              <span className="font-medium text-[14px]">{field.area} ac</span>
            </>
          ) : (
            ''
          )}
        </span>
      </div>

      {/* Map Section (Right) */}
      <div className="w-full md:w-[30%] h-full rounded-md overflow-hidden flex items-center justify-center">
        <OptimizedMap
          key={`map-${index}`}
          geoJsonObject={field.geojsonObject as any}
          disableButtons={true}
          heightProps={80}
          width={size.width} // Pass width
          height={size.height} // Pass height
          cropType={field?.crop_name}
        />
      </div>
    </Card>
  );
};

export default FieldCard;
