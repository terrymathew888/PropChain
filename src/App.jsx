import { useState, useEffect } from 'react'
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import toast from 'react-hot-toast'

// Components
import Navigation from './components/Navigation'
import Search from './components/Search'
import Home from './components/Home'
import PropertyCard from './components/PropertyCard'

// ABIs
import RealEstateABI from './abis/RealEstate.json'
import EscrowABI from './abis/Escrow.json'

// Config
import deployedAddresses from './config/deployedAddresses.json'

function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [homes, setHomes] = useState([])
  const [home, setHome] = useState({})
  const [toggle, setToggle] = useState(false)
  const [loading, setLoading] = useState(true)

  const contracts = deployedAddresses[chainId] || deployedAddresses[31337]

  const loadBlockchainData = async () => {
    try {
      setLoading(true)
      
      if (!contracts) {
        toast.error('No contracts deployed on this network')
        return
      }

      // Get total supply
      const totalSupply = await publicClient.readContract({
        address: contracts.realEstate.address,
        abi: RealEstateABI,
        functionName: 'totalSupply',
      })

      const homes = []
      
      // Fetch all homes
      for (let i = 1; i <= Number(totalSupply); i++) {
        const uri = await publicClient.readContract({
          address: contracts.realEstate.address,
          abi: RealEstateABI,
          functionName: 'tokenURI',
          args: [i],
        })

        const response = await fetch(uri)
        const metadata = await response.json()
        homes.push(metadata)
      }

      setHomes(homes)
      toast.success(`Loaded ${homes.length} properties`)
    } catch (error) {
      console.error('Error loading blockchain data:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (publicClient) {
      loadBlockchainData()
    }
  }, [publicClient, chainId])

  const togglePop = (home) => {
    setHome(home)
    setToggle(!toggle)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Search />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Homes For You
          </h3>
          {!isConnected && (
            <div className="text-gray-600">
              Connect your wallet to interact with properties
            </div>
          )}
        </div>

        <hr className="mb-8" />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homes.map((home, index) => (
              <PropertyCard
                key={index}
                home={home}
                onClick={() => togglePop(home)}
              />
            ))}
          </div>
        )}
      </div>

      {toggle && (
        <Home
          home={home}
          contracts={contracts}
          publicClient={publicClient}
          walletClient={walletClient}
          account={address}
          togglePop={togglePop}
        />
      )}
    </div>
  )
}

export default App