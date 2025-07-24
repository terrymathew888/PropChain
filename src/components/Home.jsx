import { useState, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import toast from 'react-hot-toast'
import close from '../assets/close.svg'
import EscrowABI from '../abis/Escrow.json'

const Home = ({ home, contracts, publicClient, walletClient, account, togglePop }) => {
  const [hasBought, setHasBought] = useState(false)
  const [hasLended, setHasLended] = useState(false)
  const [hasInspected, setHasInspected] = useState(false)
  const [hasSold, setHasSold] = useState(false)
  const [buyer, setBuyer] = useState(null)
  const [lender, setLender] = useState(null)
  const [inspector, setInspector] = useState(null)
  const [seller, setSeller] = useState(null)
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(false)

  const escrowAddress = contracts?.escrow?.address

  const fetchDetails = async () => {
    if (!escrowAddress || !publicClient) return

    try {
      // Fetch buyer
      const buyer = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'buyer',
        args: [BigInt(home.id)]
      })
      setBuyer(buyer)

      const hasBought = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'approval',
        args: [BigInt(home.id), buyer]
      })
      setHasBought(hasBought)

      // Fetch seller
      const seller = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'seller'
      })
      setSeller(seller)

      const hasSold = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'approval',
        args: [BigInt(home.id), seller]
      })
      setHasSold(hasSold)

      // Fetch lender
      const lender = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'lender'
      })
      setLender(lender)

      const hasLended = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'approval',
        args: [BigInt(home.id), lender]
      })
      setHasLended(hasLended)

      // Fetch inspector
      const inspector = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'inspector'
      })
      setInspector(inspector)

      const hasInspected = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'inspectionPassed',
        args: [BigInt(home.id)]
      })
      setHasInspected(hasInspected)
    } catch (error) {
      console.error('Error fetching details:', error)
    }
  }

  const fetchOwner = async () => {
    if (!escrowAddress || !publicClient) return

    try {
      const isListed = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'isListed',
        args: [BigInt(home.id)]
      })

      if (!isListed) {
        const owner = await publicClient.readContract({
          address: escrowAddress,
          abi: EscrowABI,
          functionName: 'buyer',
          args: [BigInt(home.id)]
        })
        setOwner(owner)
      }
    } catch (error) {
      console.error('Error fetching owner:', error)
    }
  }

  const buyHandler = async () => {
    if (!walletClient || !account) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Processing purchase...')

    try {
      // Get escrow amount
      const escrowAmount = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'escrowAmount',
        args: [BigInt(home.id)]
      })

      // Deposit earnest
      const depositHash = await walletClient.writeContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'depositEarnest',
        args: [BigInt(home.id)],
        value: escrowAmount,
        account
      })

      await publicClient.waitForTransactionReceipt({ hash: depositHash })
      toast.success('Earnest deposit successful!', { id: toastId })

      // Approve sale
      const approveToast = toast.loading('Approving sale...')
      const approveHash = await walletClient.writeContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'approveSale',
        args: [BigInt(home.id)],
        account
      })

      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      toast.success('Sale approved!', { id: approveToast })
      
      setHasBought(true)
    } catch (error) {
      console.error('Error in buy handler:', error)
      toast.error(error.message || 'Transaction failed', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const inspectHandler = async () => {
    if (!walletClient || !account) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Updating inspection status...')

    try {
      const hash = await walletClient.writeContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'updateInspectionStatus',
        args: [BigInt(home.id), true],
        account
      })

      await publicClient.waitForTransactionReceipt({ hash })
      toast.success('Inspection approved!', { id: toastId })
      setHasInspected(true)
    } catch (error) {
      console.error('Error in inspect handler:', error)
      toast.error(error.message || 'Transaction failed', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const lendHandler = async () => {
    if (!walletClient || !account) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Processing lending...')

    try {
      // Approve sale
      const approveHash = await walletClient.writeContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'approveSale',
        args: [BigInt(home.id)],
        account
      })

      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      // Get lending amount
      const purchasePrice = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'purchasePrice',
        args: [BigInt(home.id)]
      })

      const escrowAmount = await publicClient.readContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'escrowAmount',
        args: [BigInt(home.id)]
      })

      const lendAmount = purchasePrice - escrowAmount

      // Send funds
      const sendHash = await walletClient.sendTransaction({
        to: escrowAddress,
        value: lendAmount,
        account
      })

      await publicClient.waitForTransactionReceipt({ hash: sendHash })
      toast.success('Lending approved and funds sent!', { id: toastId })
      setHasLended(true)
    } catch (error) {
      console.error('Error in lend handler:', error)
      toast.error(error.message || 'Transaction failed', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const sellHandler = async () => {
    if (!walletClient || !account) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Processing sale...')

    try {
      // Approve sale
      const approveHash = await walletClient.writeContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'approveSale',
        args: [BigInt(home.id)],
        account
      })

      await publicClient.waitForTransactionReceipt({ hash: approveHash })

      // Finalize sale
      const finalizeToast = toast.loading('Finalizing sale...')
      const finalizeHash = await walletClient.writeContract({
        address: escrowAddress,
        abi: EscrowABI,
        functionName: 'finalizeSale',
        args: [BigInt(home.id)],
        account
      })

      await publicClient.waitForTransactionReceipt({ hash: finalizeHash })
      toast.success('Sale completed successfully!', { id: finalizeToast })
      setHasSold(true)
    } catch (error) {
      console.error('Error in sell handler:', error)
      toast.error(error.message || 'Transaction failed', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
    fetchOwner()
  }, [home, escrowAddress, hasSold])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="grid md:grid-cols-2 h-full">
          {/* Image Section */}
          <div className="relative h-64 md:h-full">
            <img 
              src={home.image} 
              alt={home.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={togglePop}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <img src={close} alt="Close" className="w-6 h-6" />
            </button>
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {home.name}
            </h1>
            
            <div className="flex items-center text-gray-600 mb-4">
              <span className="font-semibold text-lg">{home.attributes[2].value}</span>
              <span className="mx-1">beds</span>
              <span className="mx-3">•</span>
              <span className="font-semibold text-lg">{home.attributes[3].value}</span>
              <span className="mx-1">baths</span>
              <span className="mx-3">•</span>
              <span className="font-semibold text-lg">{home.attributes[4].value}</span>
              <span className="mx-1">sqft</span>
            </div>
            
            <p className="text-gray-700 mb-6">{home.address}</p>
            
            <h2 className="text-4xl font-bold text-indigo-600 mb-6">
              {home.attributes[0].value} ETH
            </h2>

            {owner ? (
              <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                Owned by {owner.slice(0, 6)}...{owner.slice(38, 42)}
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {account === inspector ? (
                  <button 
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={inspectHandler} 
                    disabled={hasInspected || loading}
                  >
                    {hasInspected ? 'Inspection Approved' : 'Approve Inspection'}
                  </button>
                ) : account === lender ? (
                  <button 
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={lendHandler} 
                    disabled={hasLended || loading}
                  >
                    {hasLended ? 'Lending Approved' : 'Approve & Lend'}
                  </button>
                ) : account === seller ? (
                  <button 
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={sellHandler} 
                    disabled={hasSold || loading}
                  >
                    {hasSold ? 'Sale Approved' : 'Approve & Sell'}
                  </button>
                ) : (
                  <button 
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={buyHandler} 
                    disabled={hasBought || loading}
                  >
                    {hasBought ? 'Purchase Approved' : 'Buy Property'}
                  </button>
                )}

                <button className="w-full border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
                  Contact Agent
                </button>
              </div>
            )}

            <hr className="my-6" />

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Overview</h3>
                <p className="text-gray-700 leading-relaxed">
                  {home.description}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Facts and Features</h3>
                <ul className="space-y-2">
                  {home.attributes.map((attribute, index) => (
                    <li key={index} className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">
                        {attribute.trait_type}
                      </span>
                      <span className="text-gray-600">
                        {attribute.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home