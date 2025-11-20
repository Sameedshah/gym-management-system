"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Search,
  Edit,
  Trash2,
  CreditCard,
  MessageSquare,
  Mail,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
} from "lucide-react";
import type { Invoice } from "@/lib/types";
import { Loading } from "@/components/ui/loading";
import { EditInvoiceDialog } from "./edit-invoice-dialog";
import { DeletePaymentDialog } from "./delete-payment-dialog";
import { PaymentActionsMenu } from "./payment-actions-menu";

interface EnhancedPaymentTableProps {
  invoices: Invoice[];
}

export function EnhancedPaymentTable({
  invoices: initialInvoices,
}: EnhancedPaymentTableProps) {
  const [invoices, setInvoices] = useState(initialInvoices);
  

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [editingInvoice, setEditingInvoice] = useState<
    (Invoice & { member: any }) | null
  >(null);
  const [deletingInvoice, setDeletingInvoice] = useState<
    (Invoice & { member: any }) | null
  >(null);

  // Show paid invoices and due invoices (combine dues and overdues)
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const dueInvoices = invoices.filter((inv) => inv.status === "due");

  // Filter by search term
  const filterInvoices = (invoiceList: Invoice[]) => {
    return invoiceList.filter(
      (invoice) =>
        (invoice.invoice_number || invoice.id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.member?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.member?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get invoices for current tab
  const getCurrentTabInvoices = () => {
    switch (activeTab) {
      case "paid":
        return filterInvoices(paidInvoices);
      case "due":
        return filterInvoices(dueInvoices);
      default:
        return filterInvoices(invoices);
    }
  };

  // Monthly summary calculation
  const getMonthlyStats = () => {
    const monthInvoices = invoices.filter((inv) =>
      inv.created_at.startsWith(selectedMonth)
    );

    const totalPayments = monthInvoices.filter(
      (inv) => inv.status === "paid"
    ).length;
    const totalDueMonths = monthInvoices
      .filter((inv) => inv.status === "due")
      .reduce((sum, inv) => sum + (inv.months_due || 1), 0);
    const totalPaidMonths = monthInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + (inv.months_due || 1), 0);

    return {
      totalInvoices: monthInvoices.length,
      totalPayments,
      totalDueMonths,
      totalPaidMonths,
      paidCount: monthInvoices.filter((inv) => inv.status === "paid").length,
      dueCount: monthInvoices.filter((inv) => inv.status === "due").length,
    };
  };

  const monthlyStats = getMonthlyStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-success-foreground";
      case "due":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "due":
        return <Clock className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const sendReminder = async (invoice: Invoice, type: "sms" | "email") => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Log the notification attempt
      const { error: logError } = await supabase
        .from("notification_logs")
        .insert({
          invoice_id: invoice.id,
          member_id: invoice.member_id,
          notification_type: type,
          status: "sent",
          message: `Payment reminder for invoice ${invoice.invoice_number}`,
          sent_at: new Date().toISOString(),
        });

      if (logError) throw logError;

      // Update invoice reminder fields
      const updateData =
        type === "sms"
          ? {
              sms_sent: true,
              last_reminder_sent: new Date().toISOString(),
              reminder_count: (invoice.reminder_count || 0) + 1,
            }
          : {
              email_sent: true,
              last_reminder_sent: new Date().toISOString(),
              reminder_count: (invoice.reminder_count || 0) + 1,
            };

      const { error: updateError } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", invoice.id);

      if (updateError) throw updateError;

      // Update local state
      setInvoices(
        invoices.map((inv) =>
          inv.id === invoice.id ? { ...inv, ...updateData } : inv
        )
      );

      alert(
        `${type.toUpperCase()} reminder sent successfully to ${
          invoice.member?.name
        }`
      );
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert(`Failed to send ${type} reminder`);
    } finally {
      setLoading(false);
    }
  };

  const sendBulkReminders = async (
    invoiceList: Invoice[],
    type: "sms" | "email"
  ) => {
    setLoading(true);

    try {
      for (const invoice of invoiceList) {
        await sendReminder(invoice, type);
        // Add small delay to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      alert(
        `Bulk ${type.toUpperCase()} reminders sent to ${
          invoiceList.length
        } members`
      );
    } catch (error) {
      alert(`Error sending bulk reminders: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (invoice: Invoice & { member: any }) => {
    setDeletingInvoice(invoice);
  };

  const handleDeleteComplete = (invoiceId: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
  };

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Summary
            </CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = date.toISOString().slice(0, 7);
                  const label = date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  });
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Definitions */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-3 text-sm">Payment Terms Guide:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-medium text-success">Months Paid:</span>
                <p className="text-muted-foreground mt-1">
                  Total months of membership fees received from members.
                </p>
              </div>
              <div>
                <span className="font-medium text-warning">Months Due:</span>
                <p className="text-muted-foreground mt-1">
                  Number of months that members need to pay for their
                  membership.
                </p>
              </div>
              <div>
                <span className="font-medium text-primary">Total Records:</span>
                <p className="text-muted-foreground mt-1">
                  All payment entries (both paid and due) for the selected
                  month.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="text-2xl font-bold text-success">
                {monthlyStats.totalPaidMonths}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {monthlyStats.paidCount} payments received
              </div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="text-2xl font-bold text-warning">
                {monthlyStats.totalDueMonths}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {monthlyStats.dueCount} members pending
              </div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-2xl font-bold text-primary">
                {monthlyStats.totalInvoices}
              </div>
              <div className="text-sm text-muted-foreground">Total Records</div>
              <div className="text-xs text-muted-foreground mt-1">
                Payment entries
              </div>
            </div>
            <div className="text-center p-4 bg-muted/10 rounded-lg border border-muted/20">
              <div className="text-2xl font-bold text-muted-foreground">
                {monthlyStats.paidCount + monthlyStats.dueCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Members
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                With payment records
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Management
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  Payment Records ({paidInvoices.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab}>
              <div className="rounded-md border overflow-visible">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Months</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentTabInvoices().map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="font-mono font-medium">
                            {invoice.invoice_number ||
                              `INV-${invoice.id.slice(-8).toUpperCase()}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {invoice.member?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.member?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {invoice.months_due || 1} month(s)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Membership period
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1">{invoice.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {invoice.status === "paid" && invoice.paid_date
                              ? new Date(invoice.paid_date).toLocaleDateString()
                              : invoice.due_date
                              ? new Date(invoice.due_date).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {invoice.status === "paid" ? "Paid" : "Due"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {invoice.description ||
                              (invoice.status === "paid"
                                ? "Payment received"
                                : "Monthly dues")}
                          </div>
                        </TableCell>
                        <TableCell className="relative">
                          <PaymentActionsMenu
                            invoice={invoice as Invoice & { member: any }}
                            onEdit={setEditingInvoice}
                            onDelete={handleDeleteConfirm}
                            onSendReminder={sendReminder}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {getCurrentTabInvoices().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">
                      Try adjusting your search terms
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Loading text="Processing reminders..." />
        </div>
      )}

      {editingInvoice && (
        <EditInvoiceDialog
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onUpdate={(updatedInvoice) => {
            setInvoices(
              invoices.map((i) =>
                i.id === updatedInvoice.id
                  ? { ...updatedInvoice, member: editingInvoice.member }
                  : i
              )
            );
            setEditingInvoice(null);
          }}
        />
      )}

      {deletingInvoice && (
        <DeletePaymentDialog
          invoice={deletingInvoice}
          open={!!deletingInvoice}
          onClose={() => setDeletingInvoice(null)}
          onDelete={handleDeleteComplete}
        />
      )}
    </div>
  );
}
