"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2, User, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export function AddMemberDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("basic")
  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    email: "",
    phone: "",
    membership_type: "standard",
    plan_name: "Strength Training" as "Strength Training" | "Cardio" | "Personal Training",
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    
    const memberData = {
      ...formData,
      status: "active",
      join_date: new Date().toISOString().split("T")[0],
    }

    // Insert member
    const { data: newMember, error: memberError } = await supabase
      .from("members")
      .insert(memberData)
      .select()
      .single()

    if (memberError) {
      setError(memberError.message)
      setIsLoading(false)
      return
    }

    // Create initial due invoice for the first month
    const today = new Date()
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    const invoiceData = {
      member_id: newMember.id,
      invoice_number: invoiceNumber,
      status: "due",
      months_due: 1,
      due_date: today.toISOString().split("T")[0],
      description: "Initial membership fee - First month",
      sms_sent: false,
      email_sent: false,
      reminder_count: 0,
    }

    const { error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)

    if (invoiceError) {
      console.error("Failed to create initial invoice:", invoiceError)
      // Don't block member creation if invoice fails
    }

    setOpen(false)
    setFormData({ name: "", father_name: "", email: "", phone: "", membership_type: "standard", plan_name: "Strength Training" })
    setCurrentTab("basic")
    router.refresh()
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({ name: "", father_name: "", email: "", phone: "", membership_type: "standard", plan_name: "Strength Training" })
    setCurrentTab("basic")
    setError(null)
  }

  const canProceedToReview = formData.name && formData.father_name && formData.email

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>Create a new gym member account</DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!canProceedToReview} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter member's full name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="father_name">Father Name *</Label>
                <Input
                  id="father_name"
                  value={formData.father_name}
                  onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  placeholder="Enter father's name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="member@example.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plan_name">Select Plan *</Label>
                <Select value={formData.plan_name} onValueChange={(value: "Strength Training" | "Cardio" | "Personal Training") => setFormData({ ...formData, plan_name: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strength Training">Strength Training</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Personal Training">Personal Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertDescription>
                  All members have standard membership. A unique 4-digit member ID will be automatically generated.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => setCurrentTab("review")}
                disabled={!canProceedToReview}
              >
                Next: Review
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Review Member Information</h3>
              
              <div className="grid gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Father Name</Label>
                    <p className="font-medium">{formData.father_name || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Plan</Label>
                    <p className="font-medium">{formData.plan_name}</p>
                  </div>
                </div>
                
                {formData.phone && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <p className="font-medium">{formData.phone}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Membership</Label>
                  <Badge variant="outline">Standard Membership</Badge>
                </div>

                <Alert>
                  <AlertDescription>
                    A due invoice for the first month will be automatically created upon registration.
                  </AlertDescription>
                </Alert>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCurrentTab("basic")}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Member...
                  </>
                ) : (
                  "Create Member"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}