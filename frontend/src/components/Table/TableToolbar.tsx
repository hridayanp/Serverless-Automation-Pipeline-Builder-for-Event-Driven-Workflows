/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { type Table } from '@tanstack/react-table';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Input } from '../ui/input';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

// Utility function to get export file blob
const getExportFileBlob = ({
  columns,
  data,
  fileType,
  fileName,
}: {
  columns: any;
  data: any;
  fileType: 'csv' | 'xlsx';
  fileName: string;
}) => {
  if (fileType === 'csv') {
    const headerNames = columns.map((col: any) => col.accessorKey || col.id);
    const csvString = Papa.unparse({ fields: headerNames, data });
    return new Blob([csvString], { type: 'text/csv' });
  } else if (fileType === 'xlsx') {
    const header = columns.map((c: any) => c.accessorKey || c.id);
    const compatibleData = data.map((row: any) => {
      const obj: { [key: string]: any } = {};
      header.forEach((col: any) => {
        obj[col] = row[col];
      });
      return obj;
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(compatibleData, { header });
    XLSX.utils.book_append_sheet(wb, ws1, 'React Table Data');
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    return false; // Download handled by XLSX
  }
  return false;
};

// Utility function to get export file name
const getExportFileName = ({ fileType }: { fileType: any }) => {
  console.log('fileType', fileType);
  return 'Weather Data';
};

interface TableToolbarProps<TData> {
  table: Table<TData>;
  searchBy: string;
  exportOption?: boolean;
  onDialogOpen?: () => void; // Function to open the dialog
  dialogButtonLabel?: string; // Label for the button that opens the dialog
}

interface TableViewOptionsProps<TData> {
  table: Table<TData>;
}

function TableViewOptions<TData>({ table }: TableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex hover:text-black"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize cursor-pointer"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableToolbar<TData>({
  table,
  searchBy,
  exportOption = false,
  onDialogOpen,
  dialogButtonLabel,
}: TableToolbarProps<TData>) {
  const handleExport = () => {
    const columns = table.getAllColumns().map((column: any) => ({
      id: column.id,
      accessorKey: column.columnDef.accessorKey || column.id,
    }));

    const data = table.getRowModel().rows.map((row) =>
      row.getVisibleCells().reduce((acc: { [key: string]: any }, cell) => {
        acc[cell.column.id] = cell.getValue();
        return acc;
      }, {})
    );

    const blob = getExportFileBlob({
      columns,
      data,
      fileType: 'csv', // Change to 'xlsx' if needed
      fileName: getExportFileName({ fileType: 'csv' }),
    });

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getExportFileName({ fileType: 'csv' })}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search"
          value={(table.getColumn(searchBy)?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn(searchBy)?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
      </div>
      <div className="flex items-center space-x-2">
        {exportOption && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export as CSV
          </Button>
        )}

        <TableViewOptions table={table} />

        {dialogButtonLabel && (
          <Button size="sm" onClick={onDialogOpen}>
            {dialogButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
