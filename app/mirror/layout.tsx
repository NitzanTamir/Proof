import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'The Mirror' }

export default function MirrorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
