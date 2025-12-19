"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, MessageSquare, Mail, Check, X } from "lucide-react";
import type { Invoice } from "@/lib/types";

interface PaymentActionsMenuProps {
  invoice: Invoice & { member?: any };
  onEdit: (invoice: Invoice & { member?: any }) => void;
  onDelete: (invoice: Invoice & { member?: any }) => void;
  onStatusChange?: (invoiceId: string, newStatus: string) => void;
  onSendReminder?: (invoice: Invoice, type: "sms" | "email") => void;
}

export function PaymentActionsMenu({ 
  invoice, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onSendReminder 
}: PaymentActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleEdit = () => {
    onEdit(invoice);
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete(invoice);
    setIsOpen(false);
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(invoice.id, newStatus);
    }
    setIsOpen(false);
  };

  const handleSendReminder = (type: "sms" | "email") => {
    if (onSendReminder) {
      onSendReminder(invoice, type);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={toggleDropdown}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-8 z-50 min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <div 
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </div>
          
          {/* Status change options */}
          {onStatusChange && (
            <>
              {invoice.status !== "paid" && (
                <div 
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleStatusChange("paid")}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Paid
                </div>
              )}
              {invoice.status === "paid" && (
                <div 
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleStatusChange("due")}
                >
                  <X className="h-4 w-4 mr-2" />
                  Mark as Unpaid
                </div>
              )}
            </>
          )}

          {/* Reminder options for due invoices */}
          {onSendReminder && invoice.status === "due" && (
            <>
              <div 
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSendReminder("sms")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </div>
              <div 
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSendReminder("email")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </div>
            </>
          )}

          <div 
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Entry
          </div>
        </div>
      )}
    </div>
  );
}