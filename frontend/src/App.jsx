import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, BookOpenIcon, ArrowPathIcon, StarIcon, LightBulbIcon, HeartIcon, AcademicCapIcon } from '@heroicons/react/24/solid'
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

// Animated gradient background component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-blue-50 to-indigo-50" />
    <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-rose-200/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-br from-indigo-200/10 to-transparent rounded-full blur-3xl" />
  </div>
)

// Feature card component with hover effects
const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    className="card p-5 text-center"
    whileHover={{ y: -4 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div className="bg-gradient-to-br from-indigo-500 to-violet-500 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm feature-icon">
      <Icon className="w-4 h-4 text-white" />
    </div>
    <h3 className="font-semibold text-base mb-1 text-gray-800">{title}</h3>
    <p className="text-xs text-gray-600">{description}</p>
  </motion.div>
)

// Ad component with hover effects
const AdBanner = ({ className, size }) => (
  <div 
    className={`ad-slot flex items-center justify-center text-gray-400 text-xs ${className}`}
  >
    {size === 'horizontal' && '[Horizontal Banner Ad]'}
    {size === 'vertical' && '[Vertical Banner Ad]'}
    {size === 'square' && '[Square Ad]'}
    {size === 'interstitial' && '[Fullscreen Ad]'}
  </div>
)

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [showSuccessAd, setShowSuccessAd] = useState(false)

  useEffect(() => {
    // Show entry ad after 3 seconds (for user engagement)
    const timer = setTimeout(() => {
      setShowInterstitial(true);
      // Hide after 3 seconds
      setTimeout(() => setShowInterstitial(false), 3000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

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
    }, 3000)
  }

  const startBookGeneration = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/generate-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate book: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Show success ad before download
      setShowSuccessAd(true)
      setTimeout(() => {
        setShowSuccessAd(false)
        // Trigger download
        const a = document.createElement('a')
        a.href = url
        a.download = 'LazyWrite-Book.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 3000)
    } catch (err) {
      setError(err.message || 'Oops! Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <AnimatedBackground />
      
      {/* Header with Top Banner Ad */}
      <header className="w-full bg-white/70 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto p-3">
          <AdBanner className="h-12 w-full mx-auto" size="horizontal" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row">
        {/* Left Side Ad */}
        <div className="hidden xl:block w-48 mr-6 flex-shrink-0">
          <div className="sticky top-24">
            <AdBanner className="h-[400px] w-full mb-4" size="vertical" />
            <AdBanner className="h-48 w-full" size="square" />
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 max-w-3xl mx-auto">
          {/* Logo and Title */}
          <motion.div 
            className="text-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <BookOpenIcon className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500" />
                </div>
              </div>
            </motion.div>
            
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              <span className="gradient-text">LazyWrite</span>
            </h1>
            
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Create Professional Books with AI
            </h2>
            
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Transform your ideas into beautifully designed educational books in seconds—free, instant, and no sign-up required.
            </p>
          </motion.div>

          {/* Main Input Card */}
          <motion.div 
            className="card p-6 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like your book to be about?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 text-sm"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    <SparklesIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-sm"
                whileHover={{ scale: 1.01, boxShadow: "0 8px 16px -4px rgba(79, 70, 229, 0.3)" }}
                whileTap={{ scale: 0.99 }}
              >
                {loading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <BookOpenIcon className="w-4 h-4" />
                    Generate My Book
                  </>
                )}
              </motion.button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-xs font-medium p-2 bg-red-50 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Mid-page Ad */}
          <div className="mb-8">
            <AdBanner className="h-16 w-full" size="horizontal" />
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <FeatureCard 
              icon={StarIcon}
              title="Professional Design"
              description="Beautiful layouts and illustrations"
            />
            <FeatureCard 
              icon={LightBulbIcon}
              title="Educational Content"
              description="Rich learning material and activities"
            />
            <FeatureCard 
              icon={HeartIcon}
              title="100% Free"
              description="No hidden costs or sign-ups"
            />
          </div>

          {/* How It Works Section */}
          <motion.div 
            className="card p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold text-center mb-4 text-gray-800">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs mx-auto mb-2">1</div>
                <h4 className="font-semibold text-sm text-gray-800 mb-1">Enter Your Topic</h4>
                <p className="text-xs text-gray-600">Any subject for your educational book</p>
              </div>
              <div className="text-center">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs mx-auto mb-2">2</div>
                <h4 className="font-semibold text-sm text-gray-800 mb-1">AI Creates Your Book</h4>
                <p className="text-xs text-gray-600">Text, illustrations, and educational elements</p>
              </div>
              <div className="text-center">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs mx-auto mb-2">3</div>
                <h4 className="font-semibold text-sm text-gray-800 mb-1">Download & Enjoy</h4>
                <p className="text-xs text-gray-600">Professional PDF ready to use</p>
              </div>
            </div>
          </motion.div>
          
          {/* Testimonials Section */}
          <motion.div 
            className="card p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-bold text-center mb-4 text-gray-800">Educators Love LazyWrite</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-gray-600 italic text-xs">"LazyWrite has transformed how I create materials for my classroom!"</p>
                <p className="text-gray-800 font-medium text-xs mt-2">- Sarah T., Teacher</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-gray-600 italic text-xs">"My students love the books we generate together."</p>
                <p className="text-gray-800 font-medium text-xs mt-2">- Michael K., Librarian</p>
              </div>
            </div>
          </motion.div>

          {/* Bottom Ad */}
          <div className="mb-8">
            <AdBanner className="h-16 w-full" size="horizontal" />
          </div>
        </div>

        {/* Right Side Ad */}
        <div className="hidden xl:block w-48 ml-6 flex-shrink-0">
          <div className="sticky top-24">
            <AdBanner className="h-[400px] w-full mb-4" size="vertical" />
            <AdBanner className="h-48 w-full" size="square" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur-md border-t border-gray-100 py-6 text-center">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <h4 className="font-bold text-sm text-gray-800 mb-2">LazyWrite</h4>
              <p className="text-xs text-gray-600">Creating educational books with AI.</p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 mb-2">Quick Links</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-500 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-800 mb-2">Contact</h4>
              <p className="text-xs text-gray-600"><a href="#" className="text-indigo-500 hover:underline">Contact us</a></p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">© 2023 LazyWrite — Free, instant book creation powered by AI</p>
          </div>
          <div className="mt-4">
            <AdBanner className="h-16 w-full" size="horizontal" />
          </div>
        </div>
      </footer>

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
              className="card p-6 max-w-sm w-full mx-4 text-center"
            >
              <h2 className="text-lg font-bold mb-3 gradient-text">Creating Your Book...</h2>
              <AdBanner className="h-36 w-full mb-3" size="interstitial" />
              <p className="text-xs text-gray-600">Your support helps keep LazyWrite free for everyone!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Ad Modal */}
      <AnimatePresence>
        {showSuccessAd && (
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
              className="card p-6 max-w-sm w-full mx-4 text-center"
            >
              <div className="mb-3 text-green-500">
                <AcademicCapIcon className="w-10 h-10 mx-auto" />
              </div>
              <h2 className="text-lg font-bold mb-2 text-gray-800">Your Book Is Ready!</h2>
              <p className="mb-3 text-xs text-gray-600">Download will start automatically...</p>
              <AdBanner className="h-36 w-full mb-3" size="interstitial" />
              <p className="text-xs text-gray-600">Like LazyWrite? Create another book!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
