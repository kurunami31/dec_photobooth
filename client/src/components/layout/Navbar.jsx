import { useState } from 'react'
import { Camera, Image, Menu, X, Aperture, ChevronRight } from 'lucide-react'

export default function Navbar({ currentView, setCurrentView, photoCount }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'camera', label: 'Studio', icon: Camera },
    { id: 'gallery', label: 'Gallery', icon: Image, badge: photoCount },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-30 glass safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="DEC" 
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                />
                <div className="absolute inset-0 bg-brand-red/20 blur-xl rounded-full" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold tracking-tight">
                  DEC
                </span>
                <span className="text-xl font-light text-gray-400 ml-1">
                  Photobooth
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-brand-red/10 text-brand-red border border-brand-red/20'
                      : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  <item.icon size={18} strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-brand-red/20 text-brand-red text-xs px-2 py-0.5 rounded-lg font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="mobile-menu-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                    currentView === item.id
                      ? 'bg-brand-red/10 text-brand-red'
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-brand-red/20 text-brand-red text-xs px-2 py-1 rounded-lg font-medium">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="ml-auto opacity-30" />
                </button>
              ))}
            </div>

            <div className="divider my-6" />

            <div className="flex items-center gap-3 px-4 py-3 text-gray-500">
              <Aperture size={18} strokeWidth={1.5} />
              <span className="text-sm">Version 1.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
