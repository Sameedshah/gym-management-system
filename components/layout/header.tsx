"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchResultsDropdown } from "@/components/ui/search-results-dropdown"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import type { Member } from "@/lib/types"

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const router = useRouter()
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    showResults,
    clearSearch,
    hideResults
  } = useDebouncedSearch(300)



  // Handle clicking outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        hideResults()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [hideResults])

  const handleSelectMember = (member: Member) => {
    // Navigate to members page with member ID as query parameter for highlighting
    router.push(`/members?highlight=${member.id}`)
    clearSearch()
  }

  const handleClearSearch = () => {
    clearSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch()
    }
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={searchContainerRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search members by name, ID, phone, email, or plan..." 
            className="w-80 pl-10 pr-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {(showResults || isSearching) && searchTerm && (
            <SearchResultsDropdown
              results={searchResults}
              isSearching={isSearching}
              onSelectMember={handleSelectMember}
            />
          )}
          
          {/* Debug info */}
          {searchTerm && (
            <div className="absolute top-full left-0 mt-20 p-2 bg-black text-white text-xs z-50">
              Debug: term="{searchTerm}" results={searchResults.length} searching={isSearching.toString()} show={showResults.toString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
