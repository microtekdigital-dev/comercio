"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink, X } from "lucide-react"
import { useState, useEffect } from "react"

export function TutorialBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem("tutorial-banner-dismissed")
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("tutorial-banner-dismissed", "true")
  }

  if (!isVisible) return null

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-blue-900 dark:text-blue-100">
              🎉 ¡Bienvenido! Aprende a usar el sistema
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Tenemos tutoriales completos para ayudarte a aprovechar al máximo tu prueba gratuita.
              Desde configuración inicial hasta ventas y reportes.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                asChild
              >
                <a
                  href="https://github.com/microtekdigital-dev/comercio/blob/main/INDICE_TUTORIALES.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Ver Tutoriales
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                asChild
              >
                <a
                  href="https://github.com/microtekdigital-dev/comercio/blob/main/GUIA_RAPIDA_TRIAL.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Guía Rápida (5 min)
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
