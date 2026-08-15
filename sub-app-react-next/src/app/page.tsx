'use client'

import dynamic from 'next/dynamic'

const PageContent = dynamic(() => import('./page-content'), { ssr: false })

export default function Home() {
  return <PageContent />
}
