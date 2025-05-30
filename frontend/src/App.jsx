import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, BookOpenIcon, ArrowPathIcon, StarIcon, LightBulbIcon, HeartIcon, AcademicCapIcon, CheckCircleIcon, PaperClipIcon } from '@heroicons/react/24/solid'
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import './App.css'
import axios from 'axios'
import { Transition } from '@headlessui/react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const SURPRISE_PROMPTS = [
  "Write a children's book about a shy turtle who discovers the power of friendship",
  "Create an educational story about space exploration for elementary students",
  "Write a bedtime story about magical dreams and adventure",
  "Create a picture book about the water cycle with fun characters",
  "Write an educational story about a journey through the human body"
]

// Animated particles background
const ParticlesBackground = () => {
  const particlesRef = useRef([]);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const createParticles = () => {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const particleCount = Math.floor(window.innerWidth / 30); // Responsive particle count
      
      particlesRef.current = [];
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random position, size and opacity
        const size = Math.random() * 6 + 2;
        const opacity = Math.random() * 0.5 + 0.1;
        const left = Math.random() * containerRect.width;
        const top = Math.random() * containerRect.height;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = opacity;
        particle.style.left = `${left}px`;
        particle.style.top = `${top}px`;
        
        // Animation properties
        const duration = Math.random() * 30 + 20;
        const delay = Math.random() * 10;
        
        particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
        
        container.appendChild(particle);
        particlesRef.current.push(particle);
      }
    };
    
    createParticles();
    
    // Recreate particles on window resize
    const handleResize = () => {
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
      createParticles();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      particlesRef.current.forEach(particle => {
        if (particle && particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  );
}

// Main sparkle icon
const SparkleIcon = ({ className }) => (
  <motion.div 
    animate={{ rotate: 360 }}
    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    className={className}
  >
    <SparklesIcon className="w-6 h-6" />
  </motion.div>
)

// Feature card component with hover effects and staggered animations
const FeatureCard = ({ icon: Icon, title, description, index }) => (
  <motion.div 
    className="card p-4 text-center"
    whileHover={{ y: -3 }}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: index * 0.1 }}
  >
    <div 
      className="bg-gradient-to-br from-indigo-500 to-violet-500 w-6 h-6 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm feature-icon"
      style={{ '--delay': index }}
    >
      <Icon className="w-3 h-3 text-white" />
    </div>
    <h3 className="font-semibold text-sm mb-1 text-gray-800">{title}</h3>
    <p className="text-xs text-gray-600">{description}</p>
  </motion.div>
)

// Ad component with hover effects and loading animation
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

// Prompt option button component
const PromptOptionButton = ({ icon: Icon, label }) => (
  <motion.button
    type="button"
    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/90 text-gray-700 text-xs font-medium rounded-full border border-gray-200 hover:bg-white"
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <Icon className="w-3.5 h-3.5 text-gray-500" />
    {label}
  </motion.button>
)

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [showSuccessAd, setShowSuccessAd] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [loadingText, setLoadingText] = useState('Creating your masterpiece...')
  const textareaRef = useRef(null)

  useEffect(() => {
    // Show entry ad after 3 seconds (for user engagement)
    const timer = setTimeout(() => {
      setShowInterstitial(true);
      // Hide after 3 seconds
      setTimeout(() => setShowInterstitial(false), 3000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Loading text rotation
  useEffect(() => {
    if (loading) {
      const messages = [
        'Crafting your narrative...',
        'Designing magical illustrations...',
        'Weaving in captivating details...',
        'Perfecting the final touches...',
        'Almost ready to unveil...'
      ];
      
      const interval = setInterval(() => {
        setGenerationStep(prev => {
          const next = (prev + 1) % messages.length;
          setLoadingText(messages[next]);
          return next;
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`;
    }
  }, [prompt]);

  const handleSurprise = () => {
    const idx = Math.floor(Math.random() * SURPRISE_PROMPTS.length)
    setPrompt(SURPRISE_PROMPTS[idx])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!prompt.trim()) {
      setError('Please share your story idea first!')
      return
    }
    
    startBookGeneration()
  }

  const startBookGeneration = async () => {
    setLoading(true)
    setGenerationStep(0)
    setLoadingText('Creating your masterpiece...')
    
    try {
      const response = await axios.post(`${BACKEND_URL}/generate-book`, { prompt }, {
        responseType: 'blob'
      });
      
      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);
      
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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center py-8 px-4">
      {/* Animated Background */}
      <ParticlesBackground />
      
      {/* Header */}
      <header className="pt-4 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <BookOpenIcon className="w-8 h-8 text-purple-400 mr-2" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              LazyWrite
            </h1>
          </div>
          <div className="text-gray-400 text-sm flex items-center">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Powered by Hostinger
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl mx-auto text-center"
        >
          <SparkleIcon className="mr-2 text-purple-400" />
          
          <h1 className="text-5xl font-bold mb-2 text-white">
            Unleash Your Story with{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              LazyWrite AI
            </span>
          </h1>
          
          <p className="text-lg text-purple-100/80 max-w-3xl mx-auto mb-12">
            Simply type your book idea, and our AI will craft a unique, beautifully designed 
            book for you in moments – completely free!
          </p>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-[#13111d]/80 backdrop-blur-md rounded-xl p-6 border border-purple-900/50 shadow-[0_0_25px_rgba(139,92,246,0.15)]">
                <h2 className="text-purple-300 font-medium mb-4 text-lg">
                  What story shall we write today?
                </h2>
                
                <textarea
                  ref={textareaRef}
                  className="w-full bg-[#0c0a14] text-gray-100 placeholder-gray-500 text-lg rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all min-h-[80px] border border-purple-900/40"
                  placeholder="e.g., A thrilling mystery in a futuristic city with flying cars and sentient AI detectives..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
                
                <div className="mt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleSurprise}
                    disabled={loading}
                    className="text-purple-400 hover:text-purple-300 transition-colors flex items-center text-sm"
                  >
                    <SparklesIcon className="w-4 h-4 mr-1" />
                    <span>Surprise me</span>
                  </button>
                  
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-full text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-900/30 min-w-[200px]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <span>{loadingText}</span>
                      </>
                    ) : (
                      <>
                        <BookOpenIcon className="w-5 h-5" />
                        Generate My Book!
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-300 text-sm font-medium p-3 bg-red-900/20 rounded-lg border border-red-900/50"
                >
                  {error}
                </motion.div>
              )}
            </form>
          </div>
        </motion.div>
      </main>

      {/* Progress Indicators - Shown during loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <motion.div 
              className="bg-[#13111d]/90 backdrop-blur-md px-5 py-3 rounded-full border border-purple-900/50 shadow-lg flex items-center gap-3"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex space-x-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div 
                    key={i}
                    className={`w-2 h-2 rounded-full ${i <= generationStep ? 'bg-purple-500' : 'bg-gray-700'}`}
                    animate={i === generationStep ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.6, repeat: i === generationStep ? Infinity : 0 }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-purple-200">{loadingText}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="card p-5 max-w-xs w-full mx-3 text-center"
            >
              <h2 className="text-base font-bold mb-2 gradient-text">Creating Your Book...</h2>
              <AdBanner className="h-32 w-full mb-2" size="interstitial" />
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
              className="card p-5 max-w-xs w-full mx-3 text-center"
            >
              <motion.div 
                className="mb-2 text-green-500"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircleIcon className="w-8 h-8 mx-auto" />
              </motion.div>
              <h2 className="text-base font-bold mb-1.5 text-gray-800">Your Book Is Ready!</h2>
              <p className="mb-2 text-xs text-gray-600">Download will start automatically...</p>
              <AdBanner className="h-32 w-full mb-2" size="interstitial" />
              <p className="text-xs text-gray-600">Like LazyWrite? Create another book!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
