'use client'

import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  onEdit: () => void
  onDelete: () => void
}

export function PostMenu({ onEdit, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="投稿のメニュー"
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-8 -mt-1 -mr-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="border-blue-100 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4 text-blue-500" />
          編集
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
