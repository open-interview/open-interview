import { useState, useEffect, useCallback, useMemo } from 'react'
import { nanoid } from 'nanoid'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import type { CustomCardData } from '@/types/swipe'

export interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (card: CustomCardData) => void;
  channels: Array<{ id: string; name: string }>;
}

interface FormErrors {
  front?: string;
  back?: string;
  channel?: string;
}

const LOCAL_STORAGE_KEY = 'oi-custom-cards'

function loadSavedCards(): CustomCardData[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCards(cards: CustomCardData[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards))
}

export function CreateCardModal({
  isOpen,
  onClose,
  onCreate,
  channels,
}: CreateCardModalProps) {
  const isMobile = useIsMobile()

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [palaceScene, setPalaceScene] = useState('')
  const [channel, setChannel] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      setFront('')
      setBack('')
      setHint('')
      setPalaceScene('')
      setChannel('')
      setTagsInput('')
      setErrors({})
      setTouched(new Set())
    }
  }, [isOpen])

  const backStartsWithVerb = useMemo(() => {
    const trimmed = back.trim()
    if (!trimmed) return true
    const nonVerbPrefixes = ['the ', 'a ', 'an ', 'this ', 'that ', 'these ', 'those ', 'it ', 'its ', 'their ', 'our ', 'my ', 'your ', 'his ', 'her ']
    const lower = trimmed.toLowerCase()
    return !nonVerbPrefixes.some(p => lower.startsWith(p))
  }, [back])

  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {}
    if (!front.trim()) {
      e.front = 'Question/concept is required'
    } else if (front.trim().length > 150) {
      e.front = 'Maximum 150 characters'
    }
    if (!back.trim()) {
      e.back = 'Answer / explanation is required'
    }
    if (!channel) {
      e.channel = 'Topic is required'
    }
    return e
  }, [front, back, channel])

  const handleSubmit = () => {
    const validationErrors = validate()
    setErrors(validationErrors)
    setTouched(new Set(['front', 'back', 'channel']))
    if (Object.keys(validationErrors).length > 0) return

    const card: CustomCardData = {
      id: nanoid(),
      front: front.trim(),
      back: back.trim(),
      hint: hint.trim(),
      palaceScene: palaceScene.trim(),
      channel,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    }

    const existing = loadSavedCards()
    existing.push(card)
    saveCards(existing)

    onCreate(card)
  }

  const markTouched = (field: string) => {
    setTouched(prev => new Set(prev).add(field))
  }

  const showError = (field: keyof FormErrors) => {
    return touched.has(field) && errors[field]
  }

  const formContent = (
    <div className="space-y-5">
      {/* Front */}
      <div>
        <label htmlFor="card-front" className="block text-sm font-medium text-zinc-300 mb-1.5">
          What's the question/concept?
        </label>
        <textarea
          id="card-front"
          value={front}
          onChange={(e) => {
            if (e.target.value.length <= 150) setFront(e.target.value)
          }}
          onBlur={() => markTouched('front')}
          placeholder="e.g. What is a closure in JavaScript?"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none h-20"
          aria-describedby={showError('front') ? 'card-front-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {showError('front') && (
            <span id="card-front-error" role="alert" className="text-xs text-red-400">{errors.front}</span>
          )}
          <span className={`text-xs ml-auto ${front.length > 130 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {front.length}/150
          </span>
        </div>
      </div>

      {/* Back */}
      <div>
        <label htmlFor="card-back" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Answer / Explanation
        </label>
        <textarea
          id="card-back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          onBlur={() => markTouched('back')}
          placeholder="e.g. A closure is a function that remembers its outer variables..."
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none h-24"
          aria-describedby={showError('back') ? 'card-back-error' : undefined}
        />
        <div className="flex items-center gap-2 mt-1">
          {back.trim() && (
            <span
              className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                backStartsWithVerb ? 'bg-green-500' : 'bg-amber-400'
              }`}
              title={backStartsWithVerb ? 'Starts with a verb' : 'Consider starting with a verb'}
            />
          )}
          {showError('back') && (
            <span id="card-back-error" role="alert" className="text-xs text-red-400">{errors.back}</span>
          )}
        </div>
      </div>

      {/* Hint */}
      <div>
        <label htmlFor="card-hint" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Hint <span className="text-zinc-500">(optional)</span>
        </label>
        <input
          id="card-hint"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="A subtle hint to help recall"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      {/* Palace Scene */}
      <div>
        <label htmlFor="card-palace" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Palace Scene <span className="text-zinc-500">(optional)</span>
        </label>
        <input
          id="card-palace"
          value={palaceScene}
          onChange={(e) => {
            if (e.target.value.length <= 60) setPalaceScene(e.target.value)
          }}
          placeholder="e.g. 🏰 A giant JS engine in the throne room"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
        <div className={`text-xs mt-1 ${palaceScene.length > 50 ? 'text-amber-400' : 'text-zinc-500'}`}>
          {palaceScene.length}/60
        </div>
      </div>

      {/* Channel */}
      <div>
        <label htmlFor="card-channel" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Topic
        </label>
        <select
          id="card-channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          onBlur={() => markTouched('channel')}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 appearance-none"
          aria-describedby={showError('channel') ? 'card-channel-error' : undefined}
        >
          <option value="" disabled>Select a topic</option>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name}
            </option>
          ))}
        </select>
        {showError('channel') && (
          <span id="card-channel-error" role="alert" className="text-xs text-red-400 mt-1 block">{errors.channel}</span>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="card-tags" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Tags <span className="text-zinc-500">(comma-separated)</span>
        </label>
        <input
          id="card-tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. javascript, closures, fundamentals"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 text-sm font-medium bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Create Card
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DrawerContent className="bg-[#141414] border-[#2a2a2a]">
          <DrawerHeader>
            <DrawerTitle className="text-zinc-100">Create Custom Card</DrawerTitle>
            <DrawerDescription className="text-zinc-400">
              Add your own flashcard to study
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-[#141414] border-[#2a2a2a] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Create Custom Card</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Add your own flashcard to study
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
