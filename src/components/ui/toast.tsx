import * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          color: '#1a1a1a',
          border: '1px solid #e5e7eb',
        },
      }}
    />
  )
}