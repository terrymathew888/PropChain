// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RealEstate
 * @dev Real Estate NFT contract with enhanced security and gas optimization
 */
contract RealEstate is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Events
    event PropertyMinted(uint256 indexed tokenId, address indexed owner, string tokenURI);
    
    // Custom errors for gas optimization
    error InvalidTokenURI();
    error UnauthorizedAccess();
    
    constructor() ERC721("Real Estate", "REAL") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new property NFT
     * @param tokenURI The URI containing property metadata
     * @return tokenId The ID of the newly minted token
     */
    function mint(string memory tokenURI) public returns (uint256) {
        if (bytes(tokenURI).length == 0) revert InvalidTokenURI();
        
        _tokenIdCounter++;
        uint256 newItemId = _tokenIdCounter;
        
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        
        emit PropertyMinted(newItemId, msg.sender, tokenURI);
        
        return newItemId;
    }
    
    /**
     * @dev Batch mint multiple properties (gas optimization)
     * @param tokenURIs Array of token URIs
     * @return tokenIds Array of minted token IDs
     */
    function batchMint(string[] memory tokenURIs) public returns (uint256[] memory) {
        uint256 length = tokenURIs.length;
        uint256[] memory tokenIds = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            tokenIds[i] = mint(tokenURIs[i]);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Get the total supply of minted tokens
     * @return The total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override to add custom logic before token transfers
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        // Add custom transfer logic here if needed
        
        return super._update(to, tokenId, auth);
    }
}