/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import FieldCard from './FieldCard';
import { Button } from '@/components/ui/button';

import {
  selectFieldsLoading,
  selectFieldsListData,
  selectFieldSelected,
} from '@/redux/slices/fieldSlice';

const MapSections = () => {
  const navigate = useNavigate();

  const isFieldsLoading = useSelector(selectFieldsLoading);
  const fieldsListData = useSelector(selectFieldsListData);
  const fieldSelected = useSelector(selectFieldSelected);

  return (
    <div className="flex h-full w-full p-4 gap-4">
      {/* Sidebar - Field Panel */}
      <div className="w-[20%] flex-shrink-0 flex flex-col h-full">
        <Button
          className="mt-4 p-5 text-[16px] w-[95%]"
          onClick={() => navigate('/field-create')}
        >
          Add Fields
        </Button>

        {isFieldsLoading ? (
          <div className="mt-6">Loading...</div>
        ) : (
          <div className="mt-4 space-y-4 overflow-auto flex-grow h-[calc(100vh-517px)] thin-scrollbar pr-2">
            {fieldsListData.length > 0 ? (
              fieldsListData.map((field: any) => (
                <FieldCard
                  field={field}
                  key={field.id}
                  index={field.id}
                  fieldSelected={fieldSelected}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                No fields data found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full flex flex-col h-full overflow-hidden p-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Main Section Placeholder
        </h1>
      </div>
    </div>
  );
};

export default MapSections;
