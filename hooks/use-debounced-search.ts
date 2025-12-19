import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/lib/types'

export function useDebouncedSearch(delay: number = 300) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const searchMembers = useCallback(async (query: string) => {
    console.log('🔍 Search called:', query)
    
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)
    const supabase = createClient()

    try {
      // Search across name, email, member_id, and phone fields
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,member_id.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10)

      console.log('🔍 Search result:', { query, data, error, dataLength: data?.length })

      if (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } else {
        console.log('✅ Setting results:', data?.length || 0)
        setSearchResults(data || [])
      }
      
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMembers(searchTerm)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchTerm, delay, searchMembers])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSearchResults([])
    setShowResults(false)
  }, [])

  const hideResults = useCallback(() => {
    setShowResults(false)
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    showResults,
    clearSearch,
    hideResults
  }
}