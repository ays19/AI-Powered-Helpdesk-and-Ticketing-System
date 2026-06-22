import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  OnChangeFn,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Ticket, TicketStatus } from '../types';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onStatusChange: (id: string, status: TicketStatus) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_EMOJI: Record<string, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  critical: '🔴',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  open: 'bg-[rgba(78,205,196,0.15)] text-status-open border border-[rgba(78,205,196,0.3)]',
  'in-progress': 'bg-[rgba(249,168,38,0.15)] text-status-in-progress border border-[rgba(249,168,38,0.3)]',
  resolved: 'bg-[rgba(108,99,255,0.15)] text-status-resolved border border-[rgba(108,99,255,0.3)]',
  closed: 'bg-[rgba(107,107,138,0.15)] text-status-closed border border-[rgba(107,107,138,0.3)]',
};

const CATEGORY_LABELS: Record<string, string> = {
  general_question: 'General Question',
  technical_question: 'Technical Question',
  refund_request: 'Refund Request',
};

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  general_question: 'bg-[rgba(107,107,138,0.15)] text-text-secondary border border-[rgba(107,107,138,0.3)]',
  technical_question: 'bg-[rgba(108,99,255,0.15)] text-accent border border-[rgba(108,99,255,0.3)]',
  refund_request: 'bg-[rgba(255,77,106,0.15)] text-danger border border-[rgba(255,77,106,0.3)]',
};

const PRIORITY_BORDER_CLASSES: Record<string, string> = {
  low: 'border-l-[4px] border-l-priority-low',
  medium: 'border-l-[4px] border-l-priority-medium',
  high: 'border-l-[4px] border-l-priority-high',
  critical: 'border-l-[4px] border-l-priority-critical',
};

export default function TicketTable({
  tickets,
  isLoading,
  sorting,
  onSortingChange,
  onStatusChange,
  onDelete,
}: TicketTableProps) {
  const columnHelper = createColumnHelper<Ticket>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => (
          <span className="text-[0.75rem] font-bold text-text-muted">
            #{info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Ticket',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <h3 className="text-[0.95rem] font-semibold text-text-primary leading-[1.4]">
              {info.getValue()}
            </h3>
            <p className="text-[0.8rem] text-text-secondary line-clamp-1 max-w-[280px]">
              {info.row.original.description}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={`inline-block px-[10px] py-[2px] rounded-full text-[0.65rem] font-bold uppercase tracking-[0.05em] ${
                CATEGORY_BADGE_CLASSES[val] || CATEGORY_BADGE_CLASSES.general_question
              }`}
            >
              {CATEGORY_LABELS[val] || val}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={`inline-block px-[10px] py-[2px] rounded-full text-[0.65rem] font-bold uppercase tracking-[0.05em] ${STATUS_BADGE_CLASSES[val]}`}
            >
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="capitalize font-medium text-sm">
              {PRIORITY_EMOJI[val]} {val}
            </span>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created At',
        cell: (info) => (
          <span className="text-text-secondary text-sm">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: (info) => {
          const ticket = info.row.original;
          return (
            <div className="flex gap-[10px] items-center justify-end">
              <select
                className="py-[6px] px-3 border border-border-color rounded-sm bg-bg-secondary text-text-primary font-sans text-[0.8rem] cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:border-accent focus:outline-none focus:border-accent"
                value={ticket.status}
                onChange={(e) =>
                  onStatusChange(ticket.id, e.target.value as TicketStatus)
                }
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                className="bg-danger text-white hover:bg-danger-hover inline-flex items-center gap-[6px] px-3 py-[6px] border-none rounded-md font-sans text-[0.75rem] font-semibold cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap"
                onClick={() => onDelete(ticket.id)}
              >
                Delete
              </button>
            </div>
          );
        },
      }),
    ],
    [onStatusChange, onDelete]
  );

  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      sorting,
    },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="overflow-x-auto w-full">
      <section className="min-w-[900px] border border-border-color rounded-lg bg-bg-card overflow-hidden">
        {/* Table Header */}
        <section className="grid grid-cols-[80px_1.5fr_140px_120px_120px_120px_180px] border-b border-border-color bg-bg-secondary/40 text-text-secondary text-xs uppercase tracking-wider font-semibold px-6 py-3 items-center select-none">
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const sortingState = header.column.getIsSorted();

              return (
                <span
                  key={header.id}
                  className={`flex items-center gap-1.5 ${
                    header.id === 'actions' ? 'justify-end' : ''
                  }`}
                >
                  {header.isPlaceholder ? null : (
                    <>
                      {canSort ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-pointer uppercase font-semibold text-xs tracking-wider"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {sortingState === 'desc' ? (
                            <ArrowDown className="size-3.5 text-accent" />
                          ) : sortingState === 'asc' ? (
                            <ArrowUp className="size-3.5 text-accent" />
                          ) : (
                            <ArrowUpDown className="size-3.5 text-text-muted" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </>
                  )}
                </span>
              );
            })
          )}
        </section>

        {/* Table Body */}
        <section className="divide-y divide-border-color">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <section
                key={i}
                className="grid grid-cols-[80px_1.5fr_140px_120px_120px_120px_180px] px-6 py-4 items-center"
              >
                <span><Skeleton className="h-4 w-10" /></span>
                <span>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-3.5 w-60" />
                </span>
                <span><Skeleton className="h-5 w-24 rounded-full" /></span>
                <span><Skeleton className="h-5 w-16 rounded-full" /></span>
                <span><Skeleton className="h-4 w-20" /></span>
                <span><Skeleton className="h-4 w-24" /></span>
                <span className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-24 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </span>
              </section>
            ))
          ) : tickets.length === 0 ? (
            <section className="text-center py-20 text-text-muted">
              <span className="text-[3rem] block mb-3">📭</span>
              <p>No tickets found</p>
            </section>
          ) : (
            table.getRowModel().rows.map((row) => {
              const ticket = row.original;
              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[80px_1.5fr_140px_120px_120px_120px_180px] px-6 py-4 items-center bg-bg-card hover:bg-bg-hover/30 transition-colors relative ${PRIORITY_BORDER_CLASSES[ticket.priority]}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <span
                      key={cell.id}
                      className={cell.column.id === 'actions' ? 'text-right' : ''}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                  ))}
                </div>
              );
            })
          )}
        </section>
      </section>
    </section>
  );
}
