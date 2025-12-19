"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Eye, UserX, Fingerprint } from "lucide-react";
import { FingerprintEnrollment } from "@/components/biometric/fingerprint-enrollment";
import type { Member } from "@/lib/types";

interface MemberActionsMenuProps {
  member: Member;
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onExpire: (member: Member) => void;
  onBiometricUpdate?: () => void;
}

export function MemberActionsMenu({ member, onView, onEdit, onExpire, onBiometricUpdate }: MemberActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleView = () => {
    console.log('View clicked for member:', member.name);
    onView(member);
    setIsOpen(false);
  };

  const handleEdit = () => {
    console.log('Edit clicked for member:', member.name);
    onEdit(member);
    setIsOpen(false);
  };

  const handleExpire = () => {
    console.log('Expire clicked for member:', member.name);
    onExpire(member);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    console.log('Dropdown toggle clicked for:', member.name);
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
          <div 
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Demographics
          </div>
          <div 
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </div>
          <div className="px-2 py-1.5">
            <FingerprintEnrollment
              memberId={member.id}
              memberName={member.name}
              isEnrolled={member.biometric_enrolled || false}
              onEnrollmentComplete={() => {
                onBiometricUpdate?.()
                setIsOpen(false)
              }}
            />
          </div>
          <div 
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={handleExpire}
          >
            <UserX className="h-4 w-4 mr-2" />
            Expire
          </div>
        </div>
      )}
    </div>
  );
}