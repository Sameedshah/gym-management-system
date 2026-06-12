"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { EnhancedPaymentTable } from "@/components/payments/enhanced-payment-table"
import { QuickPaymentEntry } from "@/components/payments/quick-payment-entry"
import { MonthWisePaymentView } from "@/components/payments/month-wise-payment-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Loading } from "@/components/ui/loading"

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchInvoices = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data } = await supabase
        .from("invoices")
        .select(`
          *,
          member:members(*)
        `)
        .order("created_at", { ascending: false })

      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Payments" description="Manage invoices and payment tracking" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Payment Management</h2>
                <p className="text-muted-foreground">Quick payment entry and tracking - Monthly dues</p>
              </div>



              {loading ? (
                <Loading text="Loading payments..." />
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Payment Overview</TabsTrigger>
                    <TabsTrigger value="monthly">Month-wise Records</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1">
                        <QuickPaymentEntry />
                      </div>
                      <div className="lg:col-span-2">
                        <EnhancedPaymentTable invoices={invoices} />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="monthly" className="space-y-6">
                    <MonthWisePaymentView invoices={invoices} onRefresh={fetchInvoices} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
