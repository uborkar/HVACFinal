import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          color: '#1a1a1a',
          border: '1px solid #e5e7eb',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }