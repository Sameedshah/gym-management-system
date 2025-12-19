"use client"

import { forwardRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { User, Phone, Mail, Calendar } from 'lucide-react'
import type { Member } from '@/lib/types'

interface SearchResultsDropdownProps {
  results: Member[]
  isSearching: boolean
  onSelectMember: (member: Member) => void
  className?: string
}

export const SearchResultsDropdown = forwardRef<
  HTMLDivElement,
  SearchResultsDropdownProps
>(({ results, isSearching, onSelectMember, className = '' }, ref) => {
  if (isSearching) {
    return (
      <Card ref={ref} className={`absolute top-full left-0 right-0 mt-1 z-[9999] p-4 shadow-lg border ${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card ref={ref} className={`absolute top-full left-0 right-0 mt-1 z-[9999] p-4 shadow-lg border ${className}`}>
        <div className="text-center py-4">
          <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No members found</p>
        </div>
      </Card>
    )
  }

  return (
    <Card ref={ref} className={`absolute top-full left-0 right-0 mt-1 z-[9999] max-h-96 overflow-y-auto shadow-lg border ${className}`}>
      <div className="p-2">
        {results.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
            onClick={() => onSelectMember(member)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">{member.name}</h4>
                <Badge variant="outline" className="text-xs font-mono">
                  {member.member_id}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {member.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{member.email}</span>
                  </div>
                )}
                
                {member.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {member.membership_type || 'Standard'}
                </Badge>
                <Badge 
                  variant={member.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {member.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {results.length === 10 && (
        <div className="border-t p-2 text-center">
          <p className="text-xs text-muted-foreground">
            Showing first 10 results. Refine your search for more specific results.
          </p>
        </div>
      )}
    </Card>
  )
})