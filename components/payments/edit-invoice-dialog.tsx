"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2 } from "lucide-react";
import type { Invoice, Member } from "@/lib/types";

interface EditInvoiceDialogProps {
  invoice: Invoice & { member: Member };
  onClose: () => void;
  onUpdate: (invoice: Invoice) => void;
}

export function EditInvoiceDialog({
  invoice,
  onClose,
  onUpdate,
}: EditInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    member_id: invoice.member_id,
    months_due: invoice.months_due.toString(),
    due_date: invoice.due_date || "",
    status: invoice.status,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("members").select("*").order("name");
    if (data) {
      setMembers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const updateData: any = {
        member_id: formData.member_id,
        months_due: parseInt(formData.months_due),
        due_date: formData.due_date,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      // Handle paid_date based on status
      if (formData.status === "paid" && invoice.status !== "paid") {
        updateData.paid_date = new Date().toISOString().split("T")[0];
      } else if (formData.status !== "paid") {
        updateData.paid_date = null;
      }

      console.log('Updating invoice with data:', updateData);

      const { data, error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", invoice.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
        alert(`Error updating invoice: ${error.message}`);
      } else if (data) {
        console.log('Invoice updated successfully:', data);
        onUpdate(data);
        onClose();
      } else {
        console.error('No data returned from update');
        alert('Update failed: No data returned');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert(`Unexpected error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>Update invoice information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="member_id">Member</Label>
            <Select
              value={formData.member_id}
              onValueChange={(value) =>
                setFormData({ ...formData, member_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="months_due">Months Due</Label>
            <Input
              id="months_due"
              type="number"
              min="1"
              max="12"
              value={formData.months_due}
              onChange={(e) =>
                setFormData({ ...formData, months_due: e.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as "paid" | "due" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Invoice"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
