import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpenIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry'
import './App.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const SURPRISE_PROMPTS = [
  "A 50-page fantasy adventure with talking dragons and a lost city",
  "A cozy mystery set in a magical bakery",
  "A sci-fi journey to a planet made of music",
  "A children's book about a brave mouse and a giant library",
  "A romance between rival time travelers",
  "A dystopian tale where dreams are currency",
  "A self-help book written by a cat",
  "A historical epic about the first book ever written",
  "A comedy about a wizard who can't spell",
  "A horror story set in a haunted bookstore"
]

const OPENROUTER_KEY_LINK = 'https://openrouter.ai/keys';

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookUrl, setBookUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [pdfPageCount, setPdfPageCount] = useState(0)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageAnimKey, setPageAnimKey] = useState(0)
  const canvasRef = useRef(null)
  const downloadRef = useRef(null)
  const urlRef = useRef('')
  const [bookHistory, setBookHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('bookHistory') || '[]')
  })
  const [showAdModal, setShowAdModal] = useState(false)
  const [adWatched, setAdWatched] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('userApiKey') || '')
  const [showUserKeyModal, setShowUserKeyModal] = useState(false)
  const [userKeyInput, setUserKeyInput] = useState(userApiKey)
  const [userKeyError, setUserKeyError] = useState('')

  useEffect(() => {
    // Clean up object URL when bookUrl changes or component unmounts
    return () => {
      if (urlRef.current) {
        window.URL.revokeObjectURL(urlRef.current)
        urlRef.current = ''
      }
    }
  }, [bookUrl])

  useEffect(() => {
    if (showPreview && bookUrl) {
      renderPdfPreview(bookUrl, pdfPage)
    }
    // eslint-disable-next-line
  }, [showPreview, bookUrl, pdfPage])

  const renderPdfPreview = async (url, pageNum = 1) => {
    setPdfLoaded(false)
    try {
      let doc = pdfDoc
      if (!doc || url !== urlRef.current) {
        const loadingTask = pdfjsLib.getDocument(url)
        doc = await loadingTask.promise
        setPdfDoc(doc)
        setPdfPageCount(doc.numPages)
        urlRef.current = url
      }
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.2 })
      const canvas = canvasRef.current
      if (!canvas) return
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      await page.render({ canvasContext: context, viewport }).promise
      setPdfLoaded(true)
    } catch (e) {
      setPdfLoaded(false)
    }
  }

  const handleSurprise = () => {
    const idx = Math.floor(Math.random() * SURPRISE_PROMPTS.length)
    setPrompt(SURPRISE_PROMPTS[idx])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBookUrl('')
    setShowPreview(false)
    setPdfLoaded(false)
    setPdfPage(1)
    setPdfDoc(null)
    if (!prompt.trim()) {
      setError('Please enter a prompt for your book!')
      return
    }
    setShowAdModal(true) // Show ad modal before generating
  }

  const startBookGeneration = async () => {
    setShowAdModal(false)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2500)
    setLoading(true)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (userApiKey) headers['x-user-api-key'] = userApiKey
      const response = await fetch(`${BACKEND_URL}/generate-book`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt })
      })
      if (!response.ok) {
        let err = { error: 'Failed to generate book' }
        try { err = await response.json() } catch {}
        // If backend says user key failed, clear it and show modal
        if (err.error && err.error.toLowerCase().includes('user api key')) {
          removeUserKey()
          setShowUserKeyModal(true)
          setUserKeyError('Your API key was invalid or rate-limited. Please try a new one.')
          setLoading(false)
          return
        }
        throw new Error(err.error || 'Failed to generate book')
      }
      // Get PDF blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setBookUrl(url)
      setShowPreview(true)
      setPdfPage(1)
      setPdfDoc(null)
      // Save to history
      saveBookToHistory({
        prompt,
        date: Date.now(),
        url,
      })
    } catch (err) {
      if (err instanceof TypeError && err.message.match(/fetch|network|failed/i)) {
        setError('Could not connect to the server. Please check your internet connection or try again later.')
      } else if (err.message && err.message.toLowerCase().includes('all api keys')) {
        setShowUserKeyModal(true)
        setUserKeyError('Our free keys are exhausted. Add your own OpenRouter API key to keep generating books!')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Simulate ad completion (replace with real ad callback)
  const handleAdComplete = () => {
    setAdWatched(true)
    setTimeout(() => {
      setAdWatched(false)
      startBookGeneration()
    }, 1200)
  }

  const handleDownload = () => {
    if (bookUrl && downloadRef.current) {
      downloadRef.current.click()
    }
  }

  const handlePrevPage = () => {
    if (pdfPage > 1) {
      setPdfPage(pdfPage - 1)
      setPageAnimKey(pageAnimKey - 1)
    }
  }
  const handleNextPage = () => {
    if (pdfPage < pdfPageCount) {
      setPdfPage(pdfPage + 1)
      setPageAnimKey(pageAnimKey + 1)
    }
  }

  // Save book to history
  const saveBookToHistory = (meta) => {
    const history = [meta, ...bookHistory].slice(0, 10) // keep last 10
    setBookHistory(history)
    localStorage.setItem('bookHistory', JSON.stringify(history))
  }

  // Clear history
  const clearHistory = () => {
    setBookHistory([])
    localStorage.removeItem('bookHistory')
  }

  // Save user key to localStorage
  const saveUserKey = () => {
    if (!userKeyInput.trim()) {
      setUserKeyError('API key cannot be empty.')
      return
    }
    setUserApiKey(userKeyInput.trim())
    localStorage.setItem('userApiKey', userKeyInput.trim())
    setShowUserKeyModal(false)
    setUserKeyError('')
  }
  const removeUserKey = () => {
    setUserApiKey('')
    localStorage.removeItem('userApiKey')
    setShowUserKeyModal(false)
    setUserKeyInput('')
    setUserKeyError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SparklesIcon className="w-32 h-32 text-yellow-300 animate-bounce drop-shadow-xl" />
          <span className="absolute text-4xl font-extrabold text-pink-400 animate-pulse drop-shadow-lg">Book Magic!</span>
        </motion.div>
      )}
      {/* Book Magic Ad Modal */}
      {showAdModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center relative max-w-md w-full border-4 border-pink-400/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <button
              className="absolute top-3 right-3 text-pink-300 hover:text-pink-500"
              onClick={() => setShowAdModal(false)}
              aria-label="Close ad modal"
            >
              <XMarkIcon className="w-7 h-7" />
            </button>
            <SparklesIcon className="w-16 h-16 text-yellow-300 animate-pulse mb-2" />
            <h2 className="text-2xl font-bold text-white mb-2 text-center">✨ Watch a short ad to unlock your book for free! ✨</h2>
            <p className="text-purple-200 text-center mb-4">Your support keeps LazyWrite 100% free for everyone. Thank you!</p>
            {/* Magical animation */}
            <motion.div
              className="w-32 h-32 mb-4 flex items-center justify-center"
              animate={{ rotate: [0, 360, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            >
              <BookOpenIcon className="w-32 h-32 text-pink-400 drop-shadow-2xl animate-pulse" />
            </motion.div>
            {/* AdinPlay or other ad provider code goes here */}
            <div className="w-full flex flex-col items-center">
              {/* TODO: Replace this with your ad provider's rewarded ad container */}
              {!adWatched ? (
                <button
                  className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl text-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 mb-2"
                  onClick={handleAdComplete}
                >
                  <SparklesIcon className="w-7 h-7" />
                  <span>Simulate Ad Completion</span>
                </button>
              ) : (
                <div className="text-green-400 font-bold text-lg animate-pulse mt-2">Ad complete! Unlocking your book...</div>
              )}
      </div>
          </motion.div>
        </motion.div>
      )}
      {/* User API Key Modal */}
      {showUserKeyModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center relative max-w-md w-full border-4 border-yellow-400/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <button
              className="absolute top-3 right-3 text-yellow-300 hover:text-yellow-500"
              onClick={() => { setShowUserKeyModal(false); setUserKeyError('') }}
              aria-label="Close user key modal"
            >
              <XMarkIcon className="w-7 h-7" />
            </button>
            <SparklesIcon className="w-16 h-16 text-yellow-300 animate-pulse mb-2" />
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Add Your Own OpenRouter API Key</h2>
            <p className="text-purple-200 text-center mb-4">Our free keys are temporarily exhausted. You can add your own OpenRouter API key to keep generating books for free. <a href={OPENROUTER_KEY_LINK} target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 hover:text-yellow-400">Get a key</a>.</p>
            <input
              type="text"
              className="w-full rounded-xl px-4 py-3 text-lg bg-white/90 text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 transition mb-2"
              placeholder="Paste your OpenRouter API key here"
              value={userKeyInput}
              onChange={e => { setUserKeyInput(e.target.value); setUserKeyError('') }}
              autoFocus
            />
            {userKeyError && <div className="text-red-400 mb-2 font-semibold text-center">{userKeyError}</div>}
            <div className="flex gap-2 mt-2">
              <button
                className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-bold px-6 py-2 rounded-xl shadow-xl text-lg hover:scale-105 active:scale-95 transition-all duration-200"
                onClick={saveUserKey}
              >
                Save Key
              </button>
              {userApiKey && (
                <button
                  className="bg-gradient-to-r from-gray-400 to-gray-700 text-white font-bold px-6 py-2 rounded-xl shadow-xl text-lg hover:scale-105 active:scale-95 transition-all duration-200"
                  onClick={removeUserKey}
                >
                  Remove Key
        </button>
              )}
            </div>
            <div className="text-xs text-purple-300 mt-4 text-center">Your API key is only stored in your browser and never sent to our server or anyone else.</div>
          </motion.div>
        </motion.div>
      )}
      {/* Animated background shapes */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-700 opacity-30 rounded-full blur-3xl z-0"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-indigo-600 opacity-20 rounded-full blur-3xl z-0"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
      />
      {/* Hero Section */}
      <main className="z-10 flex flex-col items-center justify-center w-full max-w-2xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center"
        >
          <BookOpenIcon className="w-20 h-20 text-white drop-shadow-lg mb-4 animate-pulse" />
          <h1 className="text-5xl md:text-6xl font-extrabold text-white text-center drop-shadow-xl mb-4">
            LazyWrite
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 text-center mb-8 max-w-xl">
            Instantly create <span className="text-pink-400 font-bold">beautiful, AI-powered books</span> with vibrant writing, stunning images, and professional layouts. <span className="text-yellow-300 font-bold">100% free</span> — no paywalls, ever.
          </p>
        </motion.div>
        {/* Prompt Input + Surprise Me */}
        <motion.form
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center gap-4"
        >
          <div className="w-full flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              className="flex-1 rounded-xl px-6 py-4 text-lg bg-white/90 text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-400 transition"
              placeholder="Describe your dream book (e.g. 'A 50-page fantasy adventure with dragons')"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={loading}
              maxLength={200}
              aria-label="Book prompt input"
            />
            <button
              type="button"
              className="bg-gradient-to-r from-indigo-500 to-pink-400 text-white font-bold px-4 py-4 rounded-xl shadow-xl text-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1"
              onClick={handleSurprise}
              disabled={loading}
              aria-label="Surprise Me"
            >
              <SparklesIcon className="w-7 h-7" />
            </button>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-bold px-8 py-4 rounded-xl shadow-xl text-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
            disabled={loading}
            aria-label="Start book generation"
          >
            <span>Start Your Book</span>
            <BookOpenIcon className="w-7 h-7" />
          </button>
        </motion.form>
        {error && <div className="text-red-400 mt-2 font-semibold">{error}</div>}
        {/* Loading Animation */}
        {loading && (
          <motion.div
            className="mt-8 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-white text-lg font-semibold animate-pulse">Generating your book...</div>
          </motion.div>
        )}
        {/* Book Preview & Download */}
        {showPreview && bookUrl && !loading && (
          <motion.div
            className="mt-10 w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-full flex flex-col items-center mb-4">
              <div className="w-full max-w-md h-64 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-inner overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.canvas
                    ref={canvasRef}
                    key={pageAnimKey}
                    className={`transition-opacity duration-700 ${pdfLoaded ? 'opacity-100' : 'opacity-0'}`}
                    initial={{ x: pdfPage > 1 ? 100 : 0, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: pdfPage > 1 ? -100 : 0, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </AnimatePresence>
                {!pdfLoaded && <span className="absolute text-white text-opacity-70 text-lg font-semibold">Loading preview...</span>}
                {/* Page navigation */}
                {pdfLoaded && pdfPageCount > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={handlePrevPage}
                      disabled={pdfPage === 1}
                      className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <span className="text-white text-xs font-semibold px-2 py-1 bg-black/30 rounded-lg">
                      Page {pdfPage} of {pdfPageCount}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={pdfPage === pdfPageCount}
                      className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRightIcon className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl text-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 mb-2"
              aria-label="Download book PDF"
            >
              <ArrowDownTrayIcon className="w-7 h-7" />
              <span>Download Book (PDF)</span>
            </button>
            <a
              href={bookUrl}
              download="LazyWrite-Book.pdf"
              ref={downloadRef}
              className="hidden"
            >Download</a>
          </motion.div>
        )}
        {/* My Books Section */}
        {bookHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full mt-16"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white drop-shadow">My Books</h2>
              <button
                onClick={clearHistory}
                className="text-xs text-pink-300 hover:text-pink-500 font-semibold bg-white/10 px-3 py-1 rounded-lg transition"
              >
                Clear History
              </button>
            </div>
            <div className="grid gap-4">
              {bookHistory.map((b, i) => (
                <motion.div
                  key={b.url + b.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="bg-gradient-to-r from-purple-800/60 to-indigo-800/60 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-lg"
                >
                  <div className="flex-1">
                    <div className="text-white font-semibold text-lg truncate">{b.prompt}</div>
                    <div className="text-purple-200 text-xs mt-1">{new Date(b.date).toLocaleString()}</div>
                  </div>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`LazyWrite-Book-${b.date}.pdf`}
                    className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold px-5 py-2 rounded-lg shadow hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 text-base"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>View/Download</span>
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {/* Ad Slot Placeholder */}
        <div className="mt-12 w-full flex justify-center">
          <div className="w-[320px] h-[100px] bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white text-opacity-60 text-sm font-semibold shadow-inner">
            [Ad Slot — Your support keeps this free!]
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="z-10 w-full text-center text-purple-200 py-6 text-sm mt-auto">
        Made with 💜 for everyone. No paywalls. No tricks. Just books.
      </footer>
      </div>
  )
}
