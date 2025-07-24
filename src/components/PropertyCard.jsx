import { formatEther } from 'viem'

const PropertyCard = ({ home, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
      onClick={onClick}
    >
      <div className="relative h-64">
        <img 
          src={home.image} 
          alt={home.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {home.attributes[0].value} ETH
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="text-xl font-bold text-gray-900 mb-2">
          {home.name}
        </h4>
        
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <span className="font-semibold">{home.attributes[2].value}</span>
          <span className="mx-1">beds</span>
          <span className="mx-2">•</span>
          <span className="font-semibold">{home.attributes[3].value}</span>
          <span className="mx-1">baths</span>
          <span className="mx-2">•</span>
          <span className="font-semibold">{home.attributes[4].value}</span>
          <span className="mx-1">sqft</span>
        </div>
        
        <p className="text-gray-700 text-sm">
          {home.address}
        </p>
      </div>
    </div>
  )
}

export default PropertyCard