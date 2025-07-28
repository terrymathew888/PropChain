import { ConnectButton } from '@rainbow-me/rainbowkit'
import logo from '../assets/logo.svg'

const Navigation = () => {
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <img src={logo} alt="PropChain Logo" className="h-10 w-10 mr-3" />
            <h1 className="text-2xl font-bold text-indigo-600">PropChain</h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#" 
              className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
            >
              Buy
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
            >
              Rent
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 font-medium"
            >
              Sell
            </a>
          </div>

          {/* Connect Button */}
          <div>
            <ConnectButton 
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation