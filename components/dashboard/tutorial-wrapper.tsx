"use client"

import { OnboardingTutorial, useTutorial } from "./onboarding-tutorial"
import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"

export function TutorialWrapper() {
  const { open, openTutorial, closeTutorial } = useTutorial()

  return (
    <>
      {/* Botón flotante siempre visible */}
      <Button
        variant="outline"
        size="sm"
        onClick={openTutorial}
        className="fixed bottom-20 right-4 z-40 gap-2 shadow-md"
        title="Abrir tutorial"
      >
        <GraduationCap className="h-4 w-4" />
        <span className="hidden sm:inline">Tutorial</span>
      </Button>

      <OnboardingTutorial open={open} onClose={closeTutorial} />
    </>
  )
}
