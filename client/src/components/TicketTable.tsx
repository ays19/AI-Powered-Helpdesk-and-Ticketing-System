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

const PRIORITY_DOT_CLASSES: Record<string, string> = {
  low: 'bg-priority-low',
  medium: 'bg-priority-medium',
  high: 'bg-priority-high',
  critical: 'bg-priority-critical',
};

const PRIORITY_TEXT_CLASSES: Record<string, string> = {
  low: 'text-priority-low',
  medium: 'text-priority-medium',
  high: 'text-priority-high',
  critical: 'text-priority-critical',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  open: 'bg-[rgba(78,205,196,0.15)] text-status-open border border-[rgba(78,205,196,0.3)]',
  'in-progress': 'bg-[rgba(249,168,38,0.15)] text-status-in-progress border border-[rgba(249,168,38,0.3)]',
  resolved: 'bg-[rgba(108,99,255,0.15)] text-status-resolved border border-[rgba(108,99,255,0.3)]',
  closed: 'bg-[rgba(107,107,138,0.15)] text-status-closed border border-[rgba(107,107,138,0.3)]',
};

const CATEGORY_LABELS: Record<string, string> = {
  general_question: 'General',
  technical_question: 'Technical',
  refund_request: 'Refund',
};

const CATEGORY_FULL_LABELS: Record<string, string> = {
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
          <span
            className="text-[0.72rem] font-mono font-bold text-text-muted whitespace-nowrap block"
            title={`#${info.getValue()}`}
          >
            #{info.getValue().slice(0, 6)}&hellip;
          </span>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Subject',
        cell: (info) => {
          const ticket = info.row.original;
          // Extract ticket number from title if present (e.g. "Title (Ticket #35)")
          const ticketNumMatch = ticket.title.match(/\(Ticket #(\d+)\)/);
          const ticketNum = ticketNumMatch ? `#${ticketNumMatch[1]}` : `#${ticket.id.slice(0, 6)}`;
          const subjectTitle = ticket.title.replace(/\s*\(Ticket #\d+\)/, '');
          return (
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[0.9rem] font-semibold text-text-primary leading-[1.4] line-clamp-1">
                {subjectTitle}
              </h3>
              <span className="text-xs text-text-muted font-normal leading-none">
                Ticket {ticketNum}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('customerEmail', {
        id: 'sender',
        header: 'Sender',
        cell: (info) => {
          const ticket = info.row.original;
          let senderName = 'System';
          let senderEmail: string | null = null;

          if (ticket.customerEmail) {
            senderEmail = ticket.customerEmail;
            if (ticket.user && ticket.user.email === ticket.customerEmail) {
              senderName = ticket.user.name;
            } else {
              const prefix = ticket.customerEmail.split('@')[0];
              senderName = prefix
                .split('.')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
            }
          } else if (ticket.user) {
            senderName = ticket.user.name;
            senderEmail = ticket.user.email;
          }

          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.85rem] font-medium text-text-primary leading-[1.3]">
                {senderName}
              </span>
              {senderEmail && (
                <span
                  className="text-xs text-text-muted truncate max-w-[160px]"
                  title={senderEmail}
                >
                  {senderEmail}
                </span>
              )}
            </div>
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
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              title={CATEGORY_FULL_LABELS[val] || val}
              className={`inline-block px-[10px] py-[2px] rounded-full text-[0.65rem] font-bold uppercase tracking-[0.05em] whitespace-nowrap ${
                CATEGORY_BADGE_CLASSES[val] || CATEGORY_BADGE_CLASSES.general_question
              }`}
            >
              {CATEGORY_LABELS[val] || val}
            </span>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => (
          <span className="text-text-secondary text-sm">
            {new Date(info.getValue()).toLocaleDateString()}
          </span>
        ),
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold capitalize ${PRIORITY_TEXT_CLASSES[val] ?? 'text-text-secondary'}`}>
              <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT_CLASSES[val] ?? 'bg-text-muted'}`} />
              {val}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: (info) => {
          const ticket = info.row.original;
          return (
            <div className="flex gap-[10px] items-center justify-end">
              <select
                aria-label="Change status"
                className="min-w-[110px] py-[6px] px-3 border border-border-color rounded-sm bg-bg-secondary text-text-primary font-sans text-[0.8rem] cursor-pointer transition-[0.2s_cubic-bezier(0.4,0,0.2,1)] hover:border-accent focus:outline-none focus:border-accent"
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
      <section className="min-w-[1000px] border border-border-color rounded-lg bg-bg-card overflow-hidden">
        {/* Table Header */}
        <section className="grid grid-cols-[88px_1.5fr_1.2fr_110px_120px_100px_110px_190px] border-b border-border-color bg-bg-secondary/40 text-text-secondary text-xs uppercase tracking-wider font-semibold px-6 py-3 items-center select-none">
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
                className="grid grid-cols-[88px_1.5fr_1.2fr_110px_120px_100px_110px_190px] px-6 py-3 items-center"
              >
                <span><Skeleton className="h-4 w-10" /></span>
                <span>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-3.5 w-60" />
                </span>
                <span><Skeleton className="h-4 w-28" /></span>
                <span><Skeleton className="h-5 w-16 rounded-full" /></span>
                <span><Skeleton className="h-5 w-24 rounded-full" /></span>
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
                  className={`grid grid-cols-[88px_1.5fr_1.2fr_110px_120px_100px_110px_190px] px-6 py-3 items-center bg-bg-card hover:bg-bg-hover/30 transition-colors relative ${PRIORITY_BORDER_CLASSES[ticket.priority]}`}
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
