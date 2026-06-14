import React from 'react';

export const Dialog = ({ children, open, onOpenChange }: any) => {
  if (!open) return null;
  return <div role="dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">{children}</div>;
};

export const DialogContent = ({ children, className }: any) => (
  <div className={`bg-white p-6 rounded-lg shadow-lg ${className}`}>{children}</div>
);

export const DialogHeader = ({ children }: any) => (
  <div className="flex flex-col gap-2 mb-4">{children}</div>
);

export const DialogTitle = ({ children }: any) => (
  <h2 className="text-xl font-bold">{children}</h2>
);

export const DialogDescription = ({ children }: any) => (
  <p className="text-sm text-gray-500">{children}</p>
);

export const DialogFooter = ({ children }: any) => (
  <div className="flex justify-end gap-2 mt-4">{children}</div>
);
