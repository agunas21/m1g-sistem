"use client";

import dynamic from 'next/dynamic'
import { use } from 'react'

const OperasyonHaritasi = dynamic(
  () => import('@/components/admin/OperasyonHaritasi'),
  { ssr: false }
)

export default function CanliHaritaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <OperasyonHaritasi operationId={resolvedParams.id} />
}
