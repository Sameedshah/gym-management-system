"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserCheck } from "lucide-react";
import type { Member } from "@/lib/types";
import { EditMemberDialog } from "./edit-member-dialog";
import { MemberDemographicsDialog } from "./member-demographics-dialog";
import { MemberActionsMenu } from "./member-actions-menu";
import { useRouter } from "next/navigation";

interface MemberTableProps {
  members: Member[];
  highlightMemberId?: string;
}

export function MemberTable({ members: initialMembers, highlightMemberId }: MemberTableProps) {
  const [members, setMembers] = useState(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const router = useRouter();

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "inactive":
        return "bg-warning text-warning-foreground";
      case "expired":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);

    if (!error) {
      setMembers(members.filter((m) => m.id !== memberId));
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("members")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", memberId);

    if (!error) {
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, status: newStatus as any } : m
        )
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return "Never";
    const days = Math.floor(
      (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Members ({filteredMembers.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-visible">
        <div className="rounded-md border overflow-visible">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow 
                  key={member.id}
                  className={highlightMemberId === member.id ? "bg-accent/50 border-primary/50" : ""}
                >
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {member.member_id || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.plan_name || "Not Set"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(member.join_date)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getLastSeenText(member.last_seen)}
                  </TableCell>
                  <TableCell className="relative">
                    <MemberActionsMenu
                      member={member}
                      onView={setViewingMember}
                      onEdit={setEditingMember}
                      onExpire={(member) => handleStatusChange(member.id, "expired")}
                      onBiometricUpdate={() => {
                        // Refresh member data to show updated biometric status
                        router.refresh()
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No members found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </CardContent>

      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdate={(updatedMember) => {
            setMembers(
              members.map((m) =>
                m.id === updatedMember.id ? updatedMember : m
              )
            );
            setEditingMember(null);
          }}
        />
      )}

      {viewingMember && (
        <MemberDemographicsDialog
          member={viewingMember}
          onClose={() => setViewingMember(null)}
        />
      )}
    </Card>
  );
}
