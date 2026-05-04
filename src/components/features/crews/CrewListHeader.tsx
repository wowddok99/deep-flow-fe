"use client"

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { CreateCrewDialog } from './CreateCrewDialog'

export function CrewListHeader() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <h1 className="text-lg font-bold">크루</h1>
      <div className="flex gap-2">
        <Link href="/app/crews/search">
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer flex-shrink-0">
            <Search className="h-3.5 w-3.5" />
            둘러보기
          </Button>
        </Link>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 cursor-pointer flex-shrink-0">
          <Plus className="h-4 w-4" />
          새 크루
        </Button>
      </div>
      <CreateCrewDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
