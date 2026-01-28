import './globals.css'

export const metadata = {
  title: 'DayPilot Alternative - Resource Scheduler',
  description: 'Custom DayPilot-like resource scheduler built with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}