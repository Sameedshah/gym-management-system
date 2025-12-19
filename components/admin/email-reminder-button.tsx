"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, Users, AlertCircle, CheckCircle } from "lucide-react";
import type { Member } from "@/lib/types";
import { defaultEmailTemplates, formatEmailTemplate, type EmailTemplate } from "@/lib/email-templates";

interface MemberDue {
  member_id: string;
  member: Member;
  totalMonthsDue: number;
  invoiceCount: number;
}

interface EmailReminderButtonProps {
  dueMembers: MemberDue[];
  onRemindersSent?: () => void;
}



export function EmailReminderButton({ dueMembers, onRemindersSent }: EmailReminderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>("friendly");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(new Set(dueMembers.map(m => m.member_id)));
    } else {
      setSelectedMembers(new Set());
    }
  };

  const handleMemberSelect = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers);
    if (checked) {
      newSelected.add(memberId);
    } else {
      newSelected.delete(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const getCurrentTemplate = (): EmailTemplate => {
    const template = defaultEmailTemplates.find(t => t.id === selectedTemplate);
    if (!template) return defaultEmailTemplates[0];
    
    if (selectedTemplate === "custom") {
      return {
        id: "custom",
        name: "Custom Template",
        subject: customSubject,
        message: customMessage
      };
    }
    
    return template;
  };

  const handleSendReminders = async () => {
    if (selectedMembers.size === 0) return;

    setIsSending(true);
    setSendingStatus({ sent: 0, failed: 0, total: selectedMembers.size });

    try {
      const template = getCurrentTemplate();
      const selectedMemberData = dueMembers.filter(m => selectedMembers.has(m.member_id));
      
      let sent = 0;
      let failed = 0;

      // Send emails to selected members using the notification service directly
      for (const memberDue of selectedMemberData) {
        try {
          const { subject, message } = formatEmailTemplate(template, {
            memberName: memberDue.member.name,
            memberId: memberDue.member.member_id,
            monthsDue: memberDue.totalMonthsDue,
            invoiceCount: memberDue.invoiceCount
          });
          
          // Send email using the bulk email API
          const result = await fetch('/api/notifications/bulk-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'email',
              to: memberDue.member.email,
              subject: subject,
              message: message,
              memberId: memberDue.member.id
            }),
          });

          if (result.ok) {
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          console.error(`Error sending email to ${memberDue.member.email}:`, error);
        }

        setSendingStatus({ sent, failed, total: selectedMembers.size });
        
        // Small delay to prevent overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Reset form after sending
      setSelectedMembers(new Set());
      setIsOpen(false);
      onRemindersSent?.();
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      setSendingStatus({ 
        sent: 0, 
        failed: selectedMembers.size, 
        total: selectedMembers.size 
      });
    } finally {
      setIsSending(false);
    }
  };

  const selectedMemberData = dueMembers.filter(m => selectedMembers.has(m.member_id));

  if (dueMembers.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Reminders
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email Reminders
          </DialogTitle>
          <DialogDescription>
            Send payment reminder emails to members with outstanding dues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Select Members ({selectedMembers.size} selected)</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedMembers.size === dueMembers.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">Select All</Label>
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
              {dueMembers.map((memberDue) => (
                <div key={memberDue.member_id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`member-${memberDue.member_id}`}
                      checked={selectedMembers.has(memberDue.member_id)}
                      onCheckedChange={(checked) => handleMemberSelect(memberDue.member_id, checked as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {memberDue.member.member_id}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{memberDue.member.name}</div>
                        <div className="text-xs text-muted-foreground">{memberDue.member.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-destructive">
                      {memberDue.totalMonthsDue} month{memberDue.totalMonthsDue > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {defaultEmailTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Template</SelectItem>
              </SelectContent>
            </Select>

            {selectedTemplate === "custom" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="custom-subject">Subject</Label>
                  <input
                    id="custom-subject"
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-message">Message</Label>
                  <Textarea
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter email message..."
                    rows={8}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Template Preview */}
            {selectedMemberData.length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <Label className="text-sm font-medium">Preview (for {selectedMemberData[0].member.name})</Label>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-xs font-medium">Subject:</span>
                    <div className="text-sm bg-background p-2 rounded border">
                      {formatEmailTemplate(getCurrentTemplate(), {
                        memberName: selectedMemberData[0].member.name,
                        memberId: selectedMemberData[0].member.member_id,
                        monthsDue: selectedMemberData[0].totalMonthsDue,
                        invoiceCount: selectedMemberData[0].invoiceCount
                      }).subject}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium">Message:</span>
                    <div className="text-sm bg-background p-2 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {formatEmailTemplate(getCurrentTemplate(), {
                        memberName: selectedMemberData[0].member.name,
                        memberId: selectedMemberData[0].member.member_id,
                        monthsDue: selectedMemberData[0].totalMonthsDue,
                        invoiceCount: selectedMemberData[0].invoiceCount
                      }).message}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sending Status */}
          {isSending && sendingStatus && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-4 w-4 animate-pulse" />
                <span className="font-medium">Sending Reminders...</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Progress: {sendingStatus.sent + sendingStatus.failed} / {sendingStatus.total}
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Sent: {sendingStatus.sent}
                </div>
                {sendingStatus.failed > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    Failed: {sendingStatus.failed}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendReminders} 
            disabled={selectedMembers.size === 0 || isSending}
            className="flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Send className="h-4 w-4 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {selectedMembers.size} Member{selectedMembers.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}