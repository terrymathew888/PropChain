const Search = () => {
  return (
    <header className="relative bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("/src/assets/houses.png")',
          filter: 'brightness(0.7)'
        }}
      ></div>
      
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Search it. Explore it. Buy it.
        </h2>
        
        <div className="relative">
          <input
            type="text"
            className="w-full px-6 py-4 rounded-full text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-400"
            placeholder="Enter an address, neighborhood, city, or ZIP code"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors">
            Search
          </button>
        </div>
      </div>
    </header>
  )
}

export default Search