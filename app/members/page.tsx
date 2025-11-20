"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MemberTable } from "@/components/members/member-table"
import { AddMemberDialog } from "@/components/members/add-member-dialog"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Loading } from "@/components/ui/loading"

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const highlightMemberId = searchParams.get('highlight')

  useEffect(() => {
    async function fetchMembers() {
      const supabase = createClient()

      try {
        console.log('Fetching members...')
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false })
        
        console.log('Members fetch result:', { 
          count: data?.length || 0, 
          error: error?.message,
          data: data?.slice(0, 2) // Log first 2 members
        })

        if (error) {
          console.error('Supabase error:', error)
        }

        setMembers(data || [])
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Members" description="Manage gym members and memberships" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Member Management</h2>
                  <p className="text-muted-foreground">View and manage all gym members</p>
                </div>
                <AddMemberDialog />
              </div>

              {loading ? (
                <Loading text="Loading members..." />
              ) : (
                <MemberTable members={members} highlightMemberId={highlightMemberId || undefined} />
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
