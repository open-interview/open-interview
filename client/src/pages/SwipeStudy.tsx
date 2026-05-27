import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLocation, useParams } from 'wouter'
import { channels as channelConfigs } from '@/lib/data'
import { useFilterState } from '@/hooks/use-filter-state'
import { useStudySession } from '@/hooks/use-study-session'
import { useStudyKeyboard } from '@/hooks/use-study-keyboard'
import { useIsMobile } from '@/hooks/use-mobile'
import { QuestionService, ChannelService, FlashcardService } from '@/services/api.service'
import { questionToSwipeCard, flashcardToSwipeCard } from '@/lib/card-adapters'
import { recordReview, getCard, getFcCard, recordFcReview, getSRSStats, addToSRS } from '@/lib/spaced-repetition'
import { FilterStrip, CardFan, SwipeHints, EmptyState, UndoToast, FeynmanMode, CreateCardModal } from '@/components/swipe'
import SessionSummary from '@/components/swipe/SessionSummary'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { SwipeCard, SwipeDirection, FeynmanRating, FilterState, CustomCardData, FeynmanAttempt } from '@/types/swipe'
import type { ConfidenceRating } from '@/lib/spaced-repetition'
import { getEnrolledChannels, getEnrolledCerts } from '@/lib/enrollment-service'
import ChannelPicker from '@/components/channels/ChannelPicker'
import { Layout } from '@/ui/Layout'

const DATA_BASE = import.meta.env.BASE_URL + 'data'
const CUSTOM_CARDS_KEY = 'oi-custom-cards'
const FEYNMAN_ATTEMPTS_KEY = 'oi-feynman-attempts'

interface FilterChannel {
  id: string
  name: string
  color: string
  category: string
}

interface CertItem {
  id: string
  name: string
  color: string
}

function loadCustomCardsData(): CustomCardData[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CARDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function customCardToSwipeCard(c: CustomCardData): SwipeCard {
  return {
    id: c.id,
    type: 'custom',
    mode: 'recall',
    front: c.front,
    back: c.back,
    hint: c.hint || undefined,
    channel: c.channel,
    difficulty: 'intermediate',
    tags: c.tags,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    masteryLevel: 0,
    palaceImage: undefined,
    codeExample: undefined,
    diagram: undefined,
    mnemonic: undefined,
    subChannel: undefined,
    sourceQuestionId: undefined,
  }
}

function saveFeynmanAttempt(card: SwipeCard, rating: FeynmanRating, attempt: string) {
  try {
    const raw = localStorage.getItem(FEYNMAN_ATTEMPTS_KEY)
    const attempts: FeynmanAttempt[] = raw ? JSON.parse(raw) : []
    attempts.push({
      cardId: card.id,
      attempt,
      timestamp: new Date().toISOString(),
      rating,
      sourceQuestionId: card.sourceQuestionId,
      channel: card.channel,
      subChannel: card.subChannel,
    })
    localStorage.setItem(FEYNMAN_ATTEMPTS_KEY, JSON.stringify(attempts))
  } catch {
    /* ignore */
  }
}

export default function SwipeStudy() {
  // The :filter route param (e.g. /study/:channel) is available via useParams()
  // const { filter } = useParams()
  // Example: /study/data-structures -> filter === 'data-structures'
  //          /study/bookmarks -> filter === 'bookmarks'
  //          /study -> filter === undefined (no param)
  const { filter } = useParams()
  const [, setLocation] = useLocation()
  const isMobile = useIsMobile()

  const { filter: filters, setFilter: setFilters } = useFilterState()
  const {
    cards,
    currentIndex,
    reviewedIds,
    currentCard,
    loadCards,
    setCurrentIndex,
    advance,
    undo,
    reset,
  } = useStudySession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feynmanActive, setFeynmanActive] = useState(false)
  const [streak, setStreak] = useState(0)
  const [undoCard, setUndoCard] = useState<SwipeCard | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [filterChannels, setFilterChannels] = useState<FilterChannel[]>([])
  const [certifications, setCertifications] = useState<CertItem[]>([])
  const [showCreateCardModal, setShowCreateCardModal] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    cardsReviewed: 0,
    correctCount: 0,
    againCount: 0,
    hardCount: 0,
  })
  const [timeEnded, setTimeEnded] = useState<Date | null>(null)
  const [showChannelPicker, setShowChannelPicker] = useState(false)

  const timeStartedRef = useRef(new Date())
  const lastRatingRef = useRef<ConfidenceRating>('good')
  const isProcessingRef = useRef(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem('oi-swipe-hints-seen')
      if (!seen) setShowHints(true)
    } catch {
      /* localStorage unavailable */
    }
  }, [])

  function refreshFilterChannels() {
    const enrolled = getEnrolledChannels()
    setFilterChannels(
      channelConfigs
        .filter(c => enrolled.length === 0 || enrolled.includes(c.id))
        .map(c => ({
          id: c.id,
          name: c.name,
          color: c.color,
          category: 'topic',
        }))
    )
  }

  useEffect(() => {
    refreshFilterChannels()
    const enrolledCerts = getEnrolledCerts()
    fetch(`${DATA_BASE}/certifications.json`)
      .then(res => res.json())
      .then((data: Array<{ id: string; name: string; color: string }>) => {
        setCertifications(
          data
            .filter(c => enrolledCerts.length === 0 || enrolledCerts.includes(c.id))
            .map(c => ({ id: c.id, name: c.name, color: c.color }))
        )
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadCardsForStudy()
  }, [filters])

  useEffect(() => {
    const stats = getSRSStats()
    setStreak(stats.reviewStreak)
  }, [reviewedIds])

  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  useEffect(() => {
    if (cards.length > 0 && currentIndex >= cards.length) {
      setTimeEnded(new Date())
      setSessionStats(prev => ({
        ...prev,
        cardsReviewed: cards.length,
      }))
    }
  }, [currentIndex, cards.length])

  async function loadCardsForStudy() {
    setLoading(true)
    setError(null)
    setTimeEnded(null)
    timeStartedRef.current = new Date()
    setSessionStats({ cardsReviewed: 0, correctCount: 0, againCount: 0, hardCount: 0 })
    reset()

    try {
      const isCustomMode = filters.scope === 'custom' || filters.cardType === 'custom'

      if (isCustomMode) {
        const customCards = loadCustomCardsData()
        const swipeCards = customCards.map(customCardToSwipeCard)
        loadCards(swipeCards)
        return
      }

      let channelIds: string[] = []

      if (filters.scope === 'all') {
        const enrolledIds = getEnrolledChannels()
        if (enrolledIds.length === 0) {
          loadCards([])
          setLoading(false)
          return
        }
        channelIds = enrolledIds
      } else if (filters.scope === 'cert' && filters.certId) {
        // Cert questions live at data/{certId}.json — same fetch pattern as channels
        channelIds = [filters.certId]
      } else if (filters.channelId) {
        channelIds = [filters.channelId]
      }

      const swipeCards: SwipeCard[] = []

      if (channelIds.length > 0) {
        const loadQuestions = filters.cardType === 'all' || filters.cardType === 'questions'
        const loadFlashcards = filters.cardType === 'all' || filters.cardType === 'flashcards'

        if (loadQuestions) {
          const results = await Promise.allSettled(
            channelIds.map(chId => QuestionService.getByChannel(chId))
          )
          for (const result of results) {
            if (result.status === 'fulfilled') {
              for (const q of result.value) {
                const srsCard = getCard(q.id, q.channel, q.difficulty)
                swipeCards.push(questionToSwipeCard(q, srsCard))
              }
            }
          }
        }

        if (loadFlashcards) {
          const results = await Promise.allSettled(
            channelIds.map(chId => FlashcardService.getByChannel(chId))
          )
          for (const result of results) {
            if (result.status === 'fulfilled') {
              for (const fc of result.value) {
                const srsCard = getFcCard(fc.id, fc.channel ?? 'general', fc.difficulty ?? 'intermediate')
                swipeCards.push(flashcardToSwipeCard(fc, srsCard))
              }
            }
          }
        }
      }

      let filteredCards = swipeCards

      if (filters.mode === 'due') {
        const now = new Date()
        filteredCards = swipeCards.filter(
          c => c.repetitions === 0 || new Date(c.nextReview) <= now
        )
      } else if (filters.mode === 'new') {
        filteredCards = swipeCards.filter(c => c.repetitions === 0)
      }

      loadCards(filteredCards)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards')
      loadCards([])
    } finally {
      setLoading(false)
    }
  }

  function recordCardReview(card: SwipeCard, rating: ConfidenceRating) {
    const cardId = card.sourceQuestionId || card.id
    if (card.type === 'flashcard') {
      recordFcReview(cardId, card.channel, card.difficulty, rating)
    } else {
      recordReview(cardId, card.channel, card.difficulty, rating)
      addToSRS(cardId, card.channel, card.difficulty)
    }
  }

  const handleRate = useCallback((rating: ConfidenceRating) => {
    if (!currentCard || isProcessingRef.current) return
    isProcessingRef.current = true

    lastRatingRef.current = rating
    setUndoCard(currentCard)
    setShowUndo(true)
    setSessionStats(prev => ({
      cardsReviewed: prev.cardsReviewed + 1,
      correctCount: rating === 'again' || rating === 'hard' ? prev.correctCount : prev.correctCount + 1,
      againCount: rating === 'again' ? prev.againCount + 1 : prev.againCount,
      hardCount: rating === 'hard' ? prev.hardCount + 1 : prev.hardCount,
    }))
    recordCardReview(currentCard, rating)
    advance()
    setTimeout(() => { isProcessingRef.current = false }, 300)
  }, [currentCard, advance])

  function handleSwipe(direction: SwipeDirection) {
    if (!currentCard || isProcessingRef.current) return

    if (direction === 'up') {
      setFeynmanActive(true)
      return
    }

    isProcessingRef.current = true

    if (direction === 'down') {
      setUndoCard(currentCard)
      setShowUndo(true)
      advance()
      setTimeout(() => { isProcessingRef.current = false }, 300)
      return
    }

    const rating: ConfidenceRating = direction === 'right' ? 'good' : 'again'
    lastRatingRef.current = rating
    setUndoCard(currentCard)
    setShowUndo(true)
    setSessionStats(prev => ({
      cardsReviewed: prev.cardsReviewed + 1,
      correctCount: rating === 'again' ? prev.correctCount : prev.correctCount + 1,
      againCount: rating === 'again' ? prev.againCount + 1 : prev.againCount,
      hardCount: prev.hardCount,
    }))
    recordCardReview(currentCard, rating)
    advance()
    setTimeout(() => { isProcessingRef.current = false }, 300)
  }

  function handleFeynmanComplete(rating: FeynmanRating, text = '') {
    if (!currentCard || isProcessingRef.current) return
    isProcessingRef.current = true

    saveFeynmanAttempt(currentCard, rating, text)

    const mapped: ConfidenceRating =
      rating === 'easy' ? 'easy' : rating === 'hard' ? 'hard' : 'good'
    lastRatingRef.current = mapped
    setUndoCard(currentCard)
    setShowUndo(true)
    setSessionStats(prev => ({
      cardsReviewed: prev.cardsReviewed + 1,
      correctCount: mapped === 'hard' ? prev.correctCount : prev.correctCount + 1,
      againCount: prev.againCount,
      hardCount: mapped === 'hard' ? prev.hardCount + 1 : prev.hardCount,
    }))
    recordCardReview(currentCard, mapped)
    advance()
    setFeynmanActive(false)
    setTimeout(() => { isProcessingRef.current = false }, 300)
  }

  function handleSkip() {
    if (!currentCard || isProcessingRef.current) return
    isProcessingRef.current = true
    setUndoCard(currentCard)
    setShowUndo(true)
    advance()
    setTimeout(() => { isProcessingRef.current = false }, 300)
  }

  function handleUndo() {
    if (!undoCard) return
    undo()
    setUndoCard(null)
    setShowUndo(false)
  }

  function handleUndoTimeout() {
    setShowUndo(false)
    setUndoCard(null)
  }

  function dismissHints() {
    try {
      localStorage.setItem('oi-swipe-hints-seen', 'true')
    } catch {
      /* localStorage unavailable */
    }
    setShowHints(false)
  }

  function handleFilterChange(filter: FilterState) {
    setFilters(filter)
  }

  function handleBrowse() {
    setFilters({ ...filters, scope: 'all', mode: 'browse' } as FilterState)
  }

  function handleCreateCard(card: CustomCardData) {
    setShowCreateCardModal(false)
    try {
      const raw = localStorage.getItem(CUSTOM_CARDS_KEY)
      const existing: CustomCardData[] = raw ? JSON.parse(raw) : []
      existing.push(card)
      localStorage.setItem(CUSTOM_CARDS_KEY, JSON.stringify(existing))
    } catch {
      /* ignore */
    }
    if (filters.cardType === 'custom' || filters.scope === 'custom') {
      loadCardsForStudy()
    }
  }

  function handleRetry() {
    loadCardsForStudy()
  }

  function handleStudyMore() {
    setSessionStats({ cardsReviewed: 0, correctCount: 0, againCount: 0, hardCount: 0 })
    timeStartedRef.current = new Date()
    setTimeEnded(null)
    loadCardsForStudy()
  }

  const keyboardHandlers = useMemo(() => ({
    onFlip: () => setIsFlipped(p => !p),
    onEasy: () => handleRate('easy'),
    onAgain: () => handleRate('again'),
    onHard: () => handleRate('hard'),
    onSkip: () => handleSkip(),
    onFeynman: () => { if (currentCard) setFeynmanActive(true) },
  }), [handleRate, currentCard])

  useStudyKeyboard(keyboardHandlers)

  const isComplete = !loading && !error && cards.length > 0 && currentIndex >= cards.length
  const isEmpty = !loading && !error && cards.length === 0

  const nextReviewText = useMemo(() => {
    const stats = getSRSStats()
    if (stats.dueToday === 0) return 'tomorrow'
    return `${stats.dueToday} cards`
  }, [reviewedIds])

  const activeChannelName = useMemo(() => {
    if (!filters.channelId) return null
    return filterChannels.find(c => c.id === filters.channelId)?.name || null
  }, [filters.channelId, filterChannels])

  const handleBack = useCallback(() => setLocation('/'), [setLocation])
  const handleOpenCreateCard = useCallback(() => setShowCreateCardModal(true), [])
  const handleCancelFeynman = useCallback(() => setFeynmanActive(false), [])
  const handlePickTopics = useCallback(() => setShowChannelPicker(true), [])
  const handleCloseCreateCard = useCallback(() => setShowCreateCardModal(false), [])

  function handleChannelPickerClose() {
    setShowChannelPicker(false)
    refreshFilterChannels()
    loadCardsForStudy()
  }

  return (
    <Layout title="Study" showBack={!!filter} onBack={() => setLocation('/study')}>
      <div data-pagefind-body className="flex flex-col min-h-full">
        <div className="px-4 shrink-0">
          <FilterStrip
            channels={filterChannels}
            certifications={certifications}
            activeFilter={filters}
            onFilterChange={handleFilterChange}
            onCreateCard={handleOpenCreateCard}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0 glass-card rounded-none">
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" aria-hidden={true} />
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" aria-hidden={true} />
                Retry
              </button>
            </div>
          ) : feynmanActive && currentCard ? (
            <FeynmanMode
              card={currentCard}
              onComplete={handleFeynmanComplete}
              onCancel={handleCancelFeynman}
            />
          ) : isComplete ? (
            <SessionSummary
              cardsReviewed={sessionStats.cardsReviewed}
              correctCount={sessionStats.correctCount}
              againCount={sessionStats.againCount}
              hardCount={sessionStats.hardCount}
              timeStarted={timeStartedRef.current}
              timeEnded={timeEnded}
              streak={streak}
              onStudyMore={handleStudyMore}
              onBack={handleBack}
            />
          ) : isEmpty && getEnrolledChannels().length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2 gradient-text">Pick topics to study</h2>
                <p className="text-sm text-muted-foreground mb-6">Choose topics you want to learn to get started</p>
                <button
                  onClick={handlePickTopics}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 font-semibold transition-colors"
                >
                  Pick topics
                </button>
              </div>
            </div>
          ) : isEmpty ? (
            <EmptyState
              nextReviewIn={nextReviewText}
              streak={streak}
              onBrowse={handleBrowse}
            />
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentCard ? (
            <CardFan
              cards={cards}
              currentIndex={currentIndex}
              onSwipe={handleSwipe}
              onRate={handleRate}
              onIndexChange={setCurrentIndex}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
            />
          ) : null}
        </div>

        {showChannelPicker && (
          <ChannelPicker
            onClose={handleChannelPickerClose}
          />
        )}

        <UndoToast
          show={showUndo}
          onUndo={handleUndo}
          onTimeout={handleUndoTimeout}
          duration={3000}
        />

        {showHints && <SwipeHints onDismiss={dismissHints} />}

        <CreateCardModal
          isOpen={showCreateCardModal}
          onClose={handleCloseCreateCard}
          onCreate={handleCreateCard}
          channels={filterChannels}
        />
      </div>
    </Layout>
  )
}
