"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Edit, Trash2, CreditCard, Check, X } from "lucide-react"
import type { Invoice } from "@/lib/types"
import { EditInvoiceDialog } from "./edit-invoice-dialog"
import { DeletePaymentDialog } from "./delete-payment-dialog"
import { PaymentActionsMenu } from "./payment-actions-menu"
import { useRouter } from "next/navigation"

interface PaymentTableProps {
  invoices: (Invoice & { member: any })[]
}

export function PaymentTable({ invoices: initialInvoices }: PaymentTableProps) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingInvoice, setEditingInvoice] = useState<(Invoice & { member: any }) | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<(Invoice & { member: any }) | null>(null)
  const router = useRouter()

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.member?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-success-foreground"
      case "due":
        return "bg-warning text-warning-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const handleDeleteConfirm = (invoice: Invoice & { member: any }) => {
    setDeletingInvoice(invoice);
  }

  const handleDeleteComplete = (invoiceId: string) => {
    setInvoices(invoices.filter((i) => i.id !== invoiceId))
  }

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    const supabase = createClient()
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // If marking as paid, set paid_date
    if (newStatus === "paid") {
      updateData.paid_date = new Date().toISOString().split("T")[0]
    } else {
      updateData.paid_date = null
    }

    const { error } = await supabase.from("invoices").update(updateData).eq("id", invoiceId)

    if (!error) {
      setInvoices(
        invoices.map((i) =>
          i.id === invoiceId
            ? {
                ...i,
                status: newStatus as any,
                paid_date: updateData.paid_date,
              }
            : i,
        ),
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTotalStats = () => {
    const totalMonths = invoices.reduce((sum, invoice) => sum + (invoice.months_due || 1), 0)
    const paidMonths = invoices.filter((i) => i.status === "paid").reduce((sum, invoice) => sum + (invoice.months_due || 1), 0)
    const dueMonths = invoices.filter((i) => i.status === "due").reduce((sum, invoice) => sum + (invoice.months_due || 1), 0)

    return { 
      totalMonths, 
      paidMonths, 
      dueMonths,
      totalInvoices: invoices.length,
      paidCount: invoices.filter((i) => i.status === "paid").length,
      dueCount: invoices.filter((i) => i.status === "due").length
    }
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalMonths}</div>
            <p className="text-xs text-muted-foreground">Total Months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{stats.paidMonths}</div>
            <p className="text-xs text-muted-foreground">Months Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.dueMonths}</div>
            <p className="text-xs text-muted-foreground">Months Due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Invoices ({filteredInvoices.length})
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
          <div className="rounded-md border overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Months</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.member?.name || "Unknown Member"}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.description}</TableCell>
                    <TableCell className="font-mono">{invoice.months_due || 1} month(s)</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>{invoice.due_date ? formatDate(invoice.due_date) : "-"}</TableCell>
                    <TableCell>{invoice.paid_date ? formatDate(invoice.paid_date) : "-"}</TableCell>
                    <TableCell className="relative">
                      <PaymentActionsMenu
                        invoice={invoice}
                        onEdit={setEditingInvoice}
                        onDelete={handleDeleteConfirm}
                        onStatusChange={handleStatusChange}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
              {searchTerm && <p className="text-sm mt-2">Try adjusting your search terms</p>}
            </div>
          )}
        </CardContent>

        {editingInvoice && (
          <EditInvoiceDialog
            invoice={editingInvoice}
            onClose={() => setEditingInvoice(null)}
            onUpdate={(updatedInvoice) => {
              setInvoices(
                invoices.map((i) =>
                  i.id === updatedInvoice.id ? { ...updatedInvoice, member: editingInvoice.member } : i,
                ),
              )
              setEditingInvoice(null)
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
      </Card>
    </div>
  )
}
