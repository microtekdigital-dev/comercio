"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { InternalNotesSidebar } from "./internal-notes-sidebar"
import { getActiveNotesCount } from "@/lib/actions/internal-notes"
import { createClient } from "@/lib/supabase/client"

export function InternalNotesButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    loadActiveCount()
    const cleanup = subscribeToNotes()

    return () => {
      cleanup()
    }
  }, [])

  async function loadActiveCount() {
    try {
      const count = await getActiveNotesCount()
      setActiveCount(count)
    } catch (error) {
      console.error("Error loading active notes count:", error)
    }
  }

  function subscribeToNotes() {
    const supabase = createClient()

    const channel = supabase
      .channel("internal_notes_count_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "internal_notes" },
        () => loadActiveCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Abrir notas internas"
        title="Notas Internas"
      >
        <MessageSquare className="h-5 w-5" />
        {activeCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            aria-label={`${activeCount} notas activas`}
          >
            {activeCount > 99 ? "99+" : activeCount}
          </Badge>
        )}
      </Button>

      <InternalNotesSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
