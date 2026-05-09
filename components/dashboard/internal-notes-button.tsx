"use client"

import { useState, useEffect } from "react"
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
    return () => { cleanup() }
  }, [])

  async function loadActiveCount() {
    try { const count = await getActiveNotesCount(); setActiveCount(count) }
    catch (error) { console.error("Error loading notes count:", error) }
  }

  function subscribeToNotes() {
    const supabase = createClient()
    const channel = supabase.channel("internal_notes_count_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "internal_notes" }, () => loadActiveCount())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-8 h-8 flex items-center justify-center hover:bg-[#0000aa] text-white"
        aria-label="Notas internas"
        title="Notas Internas"
      >
        <MessageSquare className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
            {activeCount > 99 ? "99+" : activeCount}
          </span>
        )}
      </button>
      <InternalNotesSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
