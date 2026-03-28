"use client"

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useCallback, useRef, useState } from 'react'
import { X } from 'lucide-react'

export function ResizableImageView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const { src, alt, width } = node.attrs
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = containerRef.current?.offsetWidth || width || 300

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX
      const newWidth = Math.max(100, startWidth + diff)
      updateAttributes({ width: newWidth })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, updateAttributes])

  return (
    <NodeViewWrapper className="resizable-image-wrapper" data-drag-handle>
      <div
        ref={containerRef}
        className={`resizable-image-container ${selected ? 'selected' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{ width: width ? `${width}px` : 'auto', maxWidth: '100%' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={src}
          alt={alt || ''}
          style={{ width: '100%', display: 'block' }}
          draggable={false}
        />

        {isHovered && (
          <button
            type="button"
            className="image-delete-button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              deleteNode()
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <div
          className="resize-handle resize-handle-right"
          onMouseDown={handleMouseDown}
        />
        <div
          className="resize-handle resize-handle-left"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsResizing(true)

            const startX = e.clientX
            const startWidth = containerRef.current?.offsetWidth || width || 300

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const diff = startX - moveEvent.clientX
              const newWidth = Math.max(100, startWidth + diff)
              updateAttributes({ width: newWidth })
            }

            const handleMouseUp = () => {
              setIsResizing(false)
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        />
      </div>
    </NodeViewWrapper>
  )
}
