"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, MessageSquare, Mail, Check, X, FileText } from "lucide-react";
import type { Invoice } from "@/lib/types";

// Receipt generation function
const generateReceipt = (invoice: Invoice & { member?: any }) => {
  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    .header p { margin: 5px 0; color: #666; }
    .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .receipt-info div { flex: 1; }
    .receipt-info strong { display: block; color: #333; margin-bottom: 5px; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .details-table th { background-color: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 1.1em; background-color: #f9f9f9; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>GymAdmin</h1>
    <p>Payment Receipt</p>
  </div>
  
  <div class="receipt-info">
    <div>
      <strong>Receipt Number:</strong>
      <span>${invoice.invoice_number || `RCP-${invoice.id.slice(-8).toUpperCase()}`}</span>
    </div>
    <div>
      <strong>Payment Date:</strong>
      <span>${invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
    </div>
  </div>
  
  <div class="receipt-info">
    <div>
      <strong>Member Name:</strong>
      <span>${invoice.member?.name || 'N/A'}</span>
    </div>
    <div>
      <strong>Member ID:</strong>
      <span>${invoice.member?.member_id || 'N/A'}</span>
    </div>
  </div>
  
  <table class="details-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Months</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.description || 'Membership Fee'}</td>
        <td>${invoice.months_due || 1} month(s)</td>
        <td>${invoice.status === 'paid' ? 'PAID' : 'DUE'}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Thank you for your payment!</p>
    <p>This is a computer-generated receipt and does not require a signature.</p>
  </div>
</body>
</html>
  `
  
  // Create a blob and download
  const blob = new Blob([receiptHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Receipt-${invoice.invoice_number || invoice.id.slice(-8)}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

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

  const handleViewReceipt = () => {
    generateReceipt(invoice);
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
          {/* View Receipt for paid invoices */}
          {invoice.status === "paid" && (
            <div 
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={handleViewReceipt}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Receipt
            </div>
          )}
          
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