import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'CleanConnect - Connect Landlords with Professional Cleaners',
  description: 'Streamline your rental property turnovers with CleanConnect. Connect landlords with cleaning crews for efficient property management.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
