/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTable } from '@/components/Table/Table';
import { ViewSwitcher } from '@/components/Layout/ViewSwitcher';
import { SegmentedTabs } from '@/components/Layout/SegmentedTabs';
import { ConfirmDeleteDialog } from '@/components/Dialogs/ConfirmDeleteDialog';
import { Plus, type LucideIcon } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

// ─── Stat Card ────────────────────────────────────────────────────────────────

export interface StatConfig {
  label: string;
  /** A function that receives the data array and returns the value to display */
  getValue: (data: any[]) => string | number;
  icon: LucideIcon;
  /** Tailwind colour key used as `text-{color}` and `bg-{color}/5` */
  color?: string;
}

// ─── Action Button (header right area) ───────────────────────────────────────

export interface PageAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** If true, only shown when viewMode === 'table'. Defaults to false. */
  tableOnly?: boolean;
}

// ─── Card Renderer ────────────────────────────────────────────────────────────

export interface CardField {
  /** Key from the data item */
  key: string;
  label?: string;
  /** Custom renderer — receives the raw value and the whole row */
  render?: (value: any, row: any) => React.ReactNode;
}

export interface CardConfig<T = any> {
  /** Primary title field */
  titleKey: keyof T;
  /** Optional subtitle / ID field */
  subtitleKey?: keyof T;
  /** Body text field */
  descriptionKey?: keyof T;
  /** Fallback description shown when description is empty */
  descriptionFallback?: string;
  /** Bottom-left badge: { label, variant } or a render function */
  statusBadge?: (row: T) => { label: string; className?: string } | null;
  /** Bottom-right meta badge: a render function */
  metaBadge?: (row: T) => React.ReactNode;
  /** Extra fields rendered as pill badges below description */
  fields?: CardField[];
}

// ─── Detail Dialog Tab ────────────────────────────────────────────────────────

export interface DetailTab {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Renders the tab content given the selected row */
  render: (row: any) => React.ReactNode;
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

export interface RowAction<T = any> {
  label: string;
  icon: LucideIcon;
  /** 'danger' → red styling */
  variant?: 'default' | 'danger';
  onClick: (row: T) => void;
}

// ─── Delete Config ────────────────────────────────────────────────────────────

export interface DeleteConfig<T = any> {
  title?: string;
  description?: string;
  onDelete: (row: T) => Promise<void>;
}

// ─── PageLayout Props ─────────────────────────────────────────────────────────

export interface PageLayoutProps<T = any> {
  // ── Meta
  title: string;
  subtitle?: string;

  // ── Data
  data: T[];
  isLoading?: boolean;
  /** Custom loading label */
  loadingLabel?: string;

  // ── Stats bar
  stats?: StatConfig[];

  // ── Table
  /** Pass your ColumnDef array. If omitted, columns are auto-generated from data keys (minus 'id'). */
  columns?: ColumnDef<T>[];
  /** Key used by the DataTable search box */
  searchBy?: string;

  // ── Card grid
  cardConfig?: CardConfig<T>;

  // ── Row actions (rendered in both table action column and card hover buttons)
  rowActions?: RowAction<T>[];

  // ── Delete
  deleteConfig?: DeleteConfig<T>;

  // ── Detail Dialog (opens on a configurable trigger)
  detailDialog?: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Dialog title (can use selected row) */
    title: (row: T) => string;
    subtitle?: (row: T) => string;
    icon?: LucideIcon;
    headerClassName?: string;
    tabs: DetailTab[];
  };

  /** The row to display in the detail dialog if managed externally */
  detailDialogRow?: T | null;

  // ── Delete (External)
  externalDeleteDialog?: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
  };

  // ── Header actions (e.g. "New Project" button)
  actions?: PageAction[];

  // ── Form Dialog (for create / edit)
  formDialog?: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
  };

  // ── Default view mode
  defaultView?: 'card' | 'table';

  // ── Class overrides
  className?: string;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function PageLoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/10 rounded-full" />
        <div className="w-16 h-16 border-4 border-t-primary rounded-full animate-spin absolute top-0 left-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xl font-bold text-primary tracking-tight">{label}</p>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          Accessing Secure Infrastructure
        </p>
      </div>
    </div>
  );
}

// ─── Auto-Column Generator ────────────────────────────────────────────────────

function buildAutoColumns<T>(data: T[]): ColumnDef<T>[] {
  if (!data?.length || !data[0]) return [];
  return Object.keys(data[0] as object)
    .filter((k) => k !== 'id')
    .map((key) => ({
      accessorKey: key as keyof T,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      cell: ({ row }: any) => {
        const value = row.getValue(key);
        if (typeof value === 'object' && value !== null) {
          return (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-w-[300px] overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        }
        return <span>{String(value ?? '')}</span>;
      },
    })) as ColumnDef<T>[];
}

// ─── Action Column ────────────────────────────────────────────────────────────

function buildActionColumn<T>(rowActions: RowAction<T>[]): ColumnDef<T> {
  return {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: any) => (
      <div className="flex justify-center items-center gap-2">
        {rowActions.map((action) => (
          <TooltipProvider key={action.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`cursor-pointer p-2 rounded-full transition-colors ${
                    action.variant === 'danger'
                      ? 'hover:bg-red-50'
                      : 'hover:bg-primary/5'
                  }`}
                  onClick={() => action.onClick(row.original)}
                >
                  <action.icon
                    size={18}
                    className={
                      action.variant === 'danger'
                        ? 'text-red-600'
                        : 'text-primary'
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    ),
  };
}

// ─── Stat Bar ─────────────────────────────────────────────────────────────────

function StatBar({ stats, data }: { stats: StatConfig[]; data: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4"
        >
          <div
            className={`p-2.5 rounded-lg bg-${stat.color ?? 'primary'}/5 text-${stat.color ?? 'primary'}`}
          >
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
              {stat.label}
            </p>
            <p className="text-xl font-bold text-[#1a2c20]">
              {stat.getValue(data)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Card Grid ────────────────────────────────────────────────────────────────

interface CardGridProps<T> {
  data: T[];
  cardConfig: CardConfig<T>;
  rowActions?: RowAction<T>[];
  onAddNew?: () => void;
  addNewLabel?: string;
}

function CardGrid<T extends { id?: any }>({
  data,
  cardConfig,
  rowActions = [],
  onAddNew,
  addNewLabel = 'Add New',
}: CardGridProps<T>) {
  const {
    titleKey,
    subtitleKey,
    descriptionKey,
    descriptionFallback = 'No description available.',
    statusBadge,
    metaBadge,
    fields = [],
  } = cardConfig;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {data.map((item, idx) => {
        const title = String(item[titleKey] ?? '');
        const subtitle = subtitleKey ? String(item[subtitleKey] ?? '') : null;
        const description = descriptionKey
          ? String(item[descriptionKey] ?? '')
          : '';
        const status = statusBadge ? statusBadge(item) : null;
        const meta = metaBadge ? metaBadge(item) : null;

        return (
          <div
            key={(item as any).id ?? idx}
            className="bg-white rounded-xl border border-neutral-100 p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  {subtitle && (
                    <span className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-tighter truncate">
                      {subtitle}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-[#1a2c20] group-hover:text-primary transition-colors truncate">
                    {title}
                  </h3>
                </div>

                {/* Row action buttons */}
                {rowActions.length > 0 && (
                  <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {rowActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="ghost"
                        size="icon"
                        title={action.label}
                        className={`h-8 w-8 rounded-lg hover:cursor-pointer ${
                          action.variant === 'danger'
                            ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                        }`}
                        onClick={() => action.onClick(item)}
                      >
                        <action.icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {description || descriptionFallback}
              </p>

              {/* Extra fields */}
              {fields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fields.map((field) => {
                    const val = (item as any)[field.key];
                    if (val === undefined || val === null || val === '')
                      return null;
                    return (
                      <Badge
                        key={field.key}
                        variant="secondary"
                        className="text-[10px] font-mono"
                      >
                        {field.label ? `${field.label}: ` : ''}
                        {field.render ? field.render(val, item) : String(val)}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-neutral-50 flex items-center justify-between">
              {status ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest text-muted-foreground ${status.className ?? ''}`}
                  >
                    {status.label}
                  </span>
                </div>
              ) : (
                <span />
              )}
              {meta && <div>{meta}</div>}
            </div>
          </div>
        );
      })}

      {/* Add new card */}
      {onAddNew && (
        <div
          onClick={onAddNew}
          className="border-2 border-dashed border-neutral-100 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all group min-h-[220px]"
        >
          <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#1a2c20]">{addNewLabel}</p>
            <p className="text-[10px] text-muted-foreground font-medium">
              Click to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  label,
  onAdd,
  addLabel,
}: {
  label: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 bg-white rounded-xl border-2 border-dashed border-neutral-100">
      <div className="w-14 h-14 rounded-xl bg-neutral-50 flex items-center justify-center shadow-inner">
        <Plus className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-base font-bold text-[#1a2c20]">No {label} yet</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Get started by creating your first{' '}
          {label.toLowerCase().replace(/s$/, '')}.
        </p>
      </div>
      {onAdd && (
        <Button
          onClick={onAdd}
          className="rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 font-bold text-xs uppercase tracking-widest px-5"
        >
          <Plus className="mr-2 h-4 w-4" /> {addLabel ?? `New ${label}`}
        </Button>
      )}
    </div>
  );
}

// ─── Main PageLayout ──────────────────────────────────────────────────────────

export function PageLayout<T extends { id?: any } = any>({
  title,
  subtitle,
  data,
  isLoading = false,
  loadingLabel = 'Syncing Dashboard',
  stats,
  columns: columnsProp,
  searchBy,
  cardConfig,
  rowActions = [],
  deleteConfig,
  externalDeleteDialog,
  detailDialog,
  detailDialogRow,
  actions = [],
  formDialog,
  defaultView = 'card',
  className = '',
}: PageLayoutProps<T>) {
  const [viewMode, setViewMode] = useState<'card' | 'table'>(defaultView);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  // Inject delete action into rowActions if deleteConfig provided
  const allRowActions = useMemo<RowAction<T>[]>(() => {
    if (!deleteConfig) return rowActions;
    // Avoid duplicate delete actions
    const alreadyHasDelete = rowActions.some((a) => a.variant === 'danger');
    if (alreadyHasDelete) return rowActions;
    return [
      ...rowActions,
      {
        label: 'Delete',
        icon: rowActions.find(() => false)?.icon ?? rowActions[0]?.icon, // placeholder; caller should provide
        variant: 'danger' as const,
        onClick: (row: T) => {
          setRowToDelete(row);
          setDeleteDialogOpen(true);
        },
      },
    ];
  }, [rowActions, deleteConfig]);

  // Resolve row actions (replace stub delete icon if needed)
  const resolvedRowActions = useMemo<RowAction<T>[]>(() => {
    // caller is responsible for providing icons; just pass through
    return allRowActions;
  }, [allRowActions]);

  // Build columns
  const resolvedColumns = useMemo<ColumnDef<T>[]>(() => {
    const base =
      columnsProp && columnsProp.length > 0
        ? columnsProp
        : buildAutoColumns(data);

    if (resolvedRowActions.length === 0) return base;

    const hasActions = base.some((c: any) => c.id === 'actions');
    if (hasActions) return base;

    return [...base, buildActionColumn(resolvedRowActions)];
  }, [columnsProp, data, resolvedRowActions]);

  // Primary action (first non-tableOnly, or first tableOnly shown in table mode)
  const primaryAction = useMemo(
    () =>
      actions.find(
        (a) => !a.tableOnly || (a.tableOnly && viewMode === 'table'),
      ),
    [actions, viewMode],
  );

  const handleConfirmDelete = async () => {
    if (!rowToDelete || !deleteConfig) return;
    await deleteConfig.onDelete(rowToDelete);
    setDeleteDialogOpen(false);
    setRowToDelete(null);
  };

  if (isLoading) return <PageLoadingSpinner label={loadingLabel} />;

  const list = Array.isArray(data) ? data : [];
  const isEmpty = list.length === 0;

  return (
    <div
      className={`min-h-screen bg-[#fdfdfb] p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 ${className}`}
    >
      {/* ── Header ── */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#1a2c20]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground text-sm">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />

            {/* Show primary action button when: tableOnly=false always, tableOnly=true only in table view */}
            {viewMode === 'table' &&
              actions
                .filter((a) => !a.tableOnly || viewMode === 'table')
                .map((action, i) => (
                  <React.Fragment key={i}>
                    {i === 0 && (
                      <Separator
                        orientation="vertical"
                        className="h-8 mx-1 hidden sm:block"
                      />
                    )}
                    <Button
                      onClick={action.onClick}
                      className="rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 font-bold text-xs uppercase tracking-widest px-5"
                    >
                      {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                      {action.label}
                    </Button>
                  </React.Fragment>
                ))}
          </div>
        </div>

        {/* ── Stats ── */}
        {stats && stats.length > 0 && <StatBar stats={stats} data={list} />}
      </div>

      {/* ── Main Content ── */}
      <div className="space-y-6">
        {isEmpty ? (
          <EmptyState
            label={title}
            onAdd={primaryAction?.onClick}
            addLabel={primaryAction?.label}
          />
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-2 overflow-hidden">
            <DataTable
              pagination
              toolbar
              searchBy={searchBy}
              data={list}
              columns={resolvedColumns}
            />
          </div>
        ) : cardConfig ? (
          <CardGrid
            data={list}
            cardConfig={cardConfig}
            rowActions={resolvedRowActions}
            onAddNew={primaryAction?.onClick}
            addNewLabel={primaryAction?.label}
          />
        ) : (
          /* Fallback: no cardConfig provided → show table anyway */
          <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-2 overflow-hidden">
            <DataTable
              pagination
              toolbar
              searchBy={searchBy}
              data={list}
              columns={resolvedColumns}
            />
          </div>
        )}
      </div>

      {/* ── Delete Confirm Dialog (Internal or External) ── */}
      {(deleteConfig || externalDeleteDialog) && (
        <ConfirmDeleteDialog
          open={externalDeleteDialog?.open ?? deleteDialogOpen}
          onOpenChange={
            externalDeleteDialog?.onOpenChange ?? setDeleteDialogOpen
          }
          onConfirm={externalDeleteDialog?.onConfirm ?? handleConfirmDelete}
          title={
            externalDeleteDialog?.title ?? deleteConfig?.title ?? 'Delete item?'
          }
          description={
            externalDeleteDialog?.description ??
            deleteConfig?.description ??
            'This action cannot be undone.'
          }
        />
      )}

      {/* ── Form Dialog (create / edit) ── */}
      {formDialog && (
        <Dialog open={formDialog.open} onOpenChange={formDialog.onOpenChange}>
          <DialogContent
            className={`${formDialog.maxWidth ?? 'max-w-3xl'} overflow-y-auto max-h-[90vh]`}
          >
            <DialogHeader>
              <DialogTitle>{formDialog.title}</DialogTitle>
            </DialogHeader>
            {formDialog.children}
          </DialogContent>
        </Dialog>
      )}

      {/* ── Detail Dialog ── */}
      {detailDialog && (detailDialogRow || selectedRow) && (
        <Dialog
          open={detailDialog.open ?? detailDialogOpen}
          onOpenChange={detailDialog.onOpenChange ?? setDetailDialogOpen}
        >
          <DialogContent className="max-w-5xl overflow-y-auto max-h-[90vh] p-0 border-none shadow-2xl bg-background [&>button]:text-white">
            {/* Coloured header */}
            <div
              className={`text-white p-6 rounded-t-xl ${detailDialog.headerClassName ?? 'bg-primary'}`}
            >
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {detailDialog.icon && (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <detailDialog.icon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                      {detailDialog.title((detailDialogRow ?? selectedRow)!)}
                    </DialogTitle>
                    {detailDialog.subtitle && (
                      <p className="text-white/70 text-sm mt-1">
                        {detailDialog.subtitle(
                          (detailDialogRow ?? selectedRow)!,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={detailDialog.tabs[0]?.value} className="w-full">
              <div className="px-6 pb-4 border-b border-border flex justify-center">
                <SegmentedTabs
                  options={detailDialog.tabs.map((t) => ({
                    value: t.value,
                    label: t.label,
                    icon: t.icon,
                  }))}
                />
              </div>

              <div className="p-6 bg-background min-h-[500px]">
                {detailDialog.tabs.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {tab.render((detailDialogRow ?? selectedRow)!)}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Expose detail dialog helpers for consumer pages ─────────────────────────

/**
 * Convenience hook: returns helpers to open/close the detail dialog from
 * a row action without the consumer managing state directly.
 *
 * Usage:
 *   const { openDetail, detailProps } = useDetailDialog<Project>();
 *   rowActions={[{ label: 'View', icon: Eye, onClick: openDetail }]}
 *   // Pass detailProps to PageLayout's internal state via ref or callback
 */
export function useDetailDialog<T>() {
  const [open, setOpen] = useState(false);
  const [row, setRow] = useState<T | null>(null);

  const openDetail = (r: T) => {
    setRow(r);
    setOpen(true);
  };

  return { open, row, openDetail, closeDetail: () => setOpen(false), setOpen };
}
