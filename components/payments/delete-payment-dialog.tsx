"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Trash2 } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface DeletePaymentDialogProps {
  invoice: Invoice & { member?: any }
  open: boolean
  onClose: () => void
  onDelete: (invoiceId: string) => void
}

export function DeletePaymentDialog({
  invoice,
  open,
  onClose,
  onDelete,
}: DeletePaymentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Check if this is a paid invoice that might affect member dues calculation
      if (invoice.status === "paid") {
        // For paid invoices, we need to be careful about data consistency
        // Check if there are any related due invoices that might be affected
        const { data: relatedInvoices, error: checkError } = await supabase
          .from("invoices")
          .select("*")
          .eq("member_id", invoice.member_id)
          .eq("status", "due")
          .order("created_at", { ascending: true })

        if (checkError) {
          throw new Error("Failed to check related invoices")
        }

        // If there are due invoices, warn about potential impact
        if (relatedInvoices && relatedInvoices.length > 0) {
          console.log(`Deleting paid invoice may affect ${relatedInvoices.length} due invoice(s)`)
        }
      }

      // Delete the invoice
      const { error: deleteError } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id)

      if (deleteError) {
        throw deleteError
      }

      // If this was a paid invoice, we might need to recreate due invoices
      // This ensures data consistency for member dues tracking
      if (invoice.status === "paid" && invoice.months_due) {
        // Create a new due invoice to maintain the member's payment obligation
        const { error: recreateError } = await supabase
          .from("invoices")
          .insert({
            member_id: invoice.member_id,
            months_due: invoice.months_due,
            status: "due",
            description: `Restored due after payment deletion: ${invoice.description || 'Monthly dues'}`,
            due_date: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
          })

        if (recreateError) {
          console.error("Warning: Failed to recreate due invoice:", recreateError)
          // Don't throw here as the main deletion was successful
        }
      }

      // Call the parent's onDelete callback
      onDelete(invoice.id)
      onClose()

    } catch (error) {
      console.error("Error deleting payment entry:", error)
      setError(error instanceof Error ? error.message : "Failed to delete payment entry")
    } finally {
      setIsDeleting(false)
    }
  }

  const getDeleteWarning = () => {
    if (invoice.status === "paid") {
      return "Deleting this payment record will restore the member's dues obligation. This action cannot be undone."
    }
    return "This will permanently delete the payment entry. This action cannot be undone."
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Payment Entry
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this payment entry?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Details */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Member:</span>
              <span className="text-sm">{invoice.member?.name || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Months:</span>
              <span className="text-sm">{invoice.months_due || 1} month(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm capitalize">{invoice.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Description:</span>
              <span className="text-sm">{invoice.description || "N/A"}</span>
            </div>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {getDeleteWarning()}
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Entry
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}