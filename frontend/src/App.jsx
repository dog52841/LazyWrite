import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, BookOpenIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import './App.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const SURPRISE_PROMPTS = [
  "A magical journey through the wonders of science",
  "An adventurous tale about protecting our oceans",
  "A friendly dragon teaching about emotions",
  "A time-traveling story about historical heroes",
  "A space exploration guide for young astronauts"
]

const FeatureCard = ({ emoji, title, description }) => (
  <motion.div 
    className="card p-6 text-center"
    whileHover={{ y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <span className="feature-icon text-4xl mb-4 inline-block">{emoji}</span>
    <h3 className="font-semibold text-lg mb-2 text-gray-800">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </motion.div>
)

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInterstitial, setShowInterstitial] = useState(false)

  const handleSurprise = () => {
    const idx = Math.floor(Math.random() * SURPRISE_PROMPTS.length)
    setPrompt(SURPRISE_PROMPTS[idx])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!prompt.trim()) {
      setError('Please describe the book you want to create!')
      return
    }
    setShowInterstitial(true)
    setTimeout(() => {
      setShowInterstitial(false)
      startBookGeneration()
    }, 2000)
  }

  const startBookGeneration = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/generate-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!response.ok) throw new Error('Failed to generate book')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'LazyWrite-Book.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Oops! Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Top Banner Ad */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 p-4 flex justify-center sticky top-0 z-50"
      >
        <div className="w-full max-w-screen-xl h-16 ad-slot flex items-center justify-center text-gray-400">
          [Top Banner Ad]
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-12 flex min-h-[calc(100vh-12rem)]">
        {/* Left Side Ad */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="hidden lg:block w-48 mr-8"
        >
          <div className="sticky top-24 w-full h-[600px] ad-slot flex items-center justify-center text-gray-400">
            [Side Banner Ad]
          </div>
        </motion.div>

        {/* Center Content */}
        <div className="flex-1 max-w-3xl mx-auto">
          {/* Logo and Title */}
          <motion.div 
            className="text-center mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold gradient-text mb-6">
              LazyWrite
            </h1>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Create Beautiful Books with AI
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your ideas into professionally designed books—free, instant, and no sign-up required.
            </p>
          </motion.div>

          {/* Main Input Card */}
          <motion.div 
            className="card p-8 mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your book
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl text-gray-800 placeholder-gray-400"
                    placeholder="A magical storybook about..."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    disabled={loading}
                  />
                  <motion.button
                    type="button"
                    onClick={handleSurprise}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
                  >
                    <SparklesIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <BookOpenIcon className="w-5 h-5" />
                    Generate Book
                  </>
                )}
              </motion.button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              emoji="✨"
              title="Professional Design"
              description="Beautiful layouts and illustrations"
            />
            <FeatureCard 
              emoji="🚀"
              title="Instant Creation"
              description="Get your book in seconds"
            />
            <FeatureCard 
              emoji="💝"
              title="100% Free"
              description="No hidden costs or sign-ups"
            />
          </div>
        </div>

        {/* Right Side Ad */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="hidden lg:block w-48 ml-8"
        >
          <div className="sticky top-24 w-full h-[600px] ad-slot flex items-center justify-center text-gray-400">
            [Side Banner Ad]
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg border-t border-gray-100 py-8 text-center text-sm text-gray-600"
      >
        <p>Made with 💜 by LazyWrite — Free, instant book creation powered by AI</p>
      </motion.footer>

      {/* Interstitial Ad Modal */}
      <AnimatePresence>
        {showInterstitial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 interstitial-modal flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card p-8 max-w-md w-full mx-4 text-center"
            >
              <h2 className="text-xl font-bold mb-4 gradient-text">Creating Your Book...</h2>
              <div className="w-full h-48 ad-slot flex items-center justify-center text-gray-400 mb-4">
                [Interstitial Ad]
              </div>
              <p className="text-sm text-gray-600">Your support helps keep LazyWrite free for everyone!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
