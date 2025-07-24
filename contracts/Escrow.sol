// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title Escrow
 * @dev Enhanced escrow contract for real estate transactions with security improvements
 */
contract Escrow is ReentrancyGuard {
    using Address for address payable;
    
    // State variables
    address public immutable nftAddress;
    address payable public immutable seller;
    address public immutable inspector;
    address public immutable lender;
    
    // Mappings
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;
    
    // Events
    event PropertyListed(uint256 indexed nftID, address indexed buyer, uint256 purchasePrice, uint256 escrowAmount);
    event EarnestDeposited(uint256 indexed nftID, address indexed buyer, uint256 amount);
    event InspectionStatusUpdated(uint256 indexed nftID, bool passed);
    event SaleApproved(uint256 indexed nftID, address indexed approver);
    event SaleFinalized(uint256 indexed nftID, address indexed buyer, address indexed seller);
    event SaleCancelled(uint256 indexed nftID);
    
    // Custom errors
    error OnlyBuyer();
    error OnlySeller();
    error OnlyInspector();
    error InsufficientEarnestAmount();
    error PropertyNotListed();
    error InspectionNotPassed();
    error NotAllPartiesApproved();
    error InsufficientFunds();
    error TransferFailed();
    
    // Modifiers
    modifier onlyBuyer(uint256 _nftID) {
        if (msg.sender != buyer[_nftID]) revert OnlyBuyer();
        _;
    }
    
    modifier onlySeller() {
        if (msg.sender != seller) revert OnlySeller();
        _;
    }
    
    modifier onlyInspector() {
        if (msg.sender != inspector) revert OnlyInspector();
        _;
    }
    
    modifier propertyListed(uint256 _nftID) {
        if (!isListed[_nftID]) revert PropertyNotListed();
        _;
    }
    
    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        require(_nftAddress != address(0), "Invalid NFT address");
        require(_seller != address(0), "Invalid seller address");
        require(_inspector != address(0), "Invalid inspector address");
        require(_lender != address(0), "Invalid lender address");
        
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }
    
    /**
     * @dev List a property for sale
     */
    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) external onlySeller {
        require(_buyer != address(0), "Invalid buyer address");
        require(_purchasePrice > 0, "Invalid purchase price");
        require(_escrowAmount > 0 && _escrowAmount <= _purchasePrice, "Invalid escrow amount");
        
        // Transfer NFT from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
        
        emit PropertyListed(_nftID, _buyer, _purchasePrice, _escrowAmount);
    }
    
    /**
     * @dev Deposit earnest money
     */
    function depositEarnest(uint256 _nftID) external payable onlyBuyer(_nftID) propertyListed(_nftID) {
        if (msg.value < escrowAmount[_nftID]) revert InsufficientEarnestAmount();
        
        emit EarnestDeposited(_nftID, msg.sender, msg.value);
    }
    
    /**
     * @dev Update inspection status
     */
    function updateInspectionStatus(uint256 _nftID, bool _passed)
        external
        onlyInspector
        propertyListed(_nftID)
    {
        inspectionPassed[_nftID] = _passed;
        emit InspectionStatusUpdated(_nftID, _passed);
    }
    
    /**
     * @dev Approve sale
     */
    function approveSale(uint256 _nftID) external propertyListed(_nftID) {
        approval[_nftID][msg.sender] = true;
        emit SaleApproved(_nftID, msg.sender);
    }
    
    /**
     * @dev Finalize the sale
     */
    function finalizeSale(uint256 _nftID) external nonReentrant propertyListed(_nftID) {
        if (!inspectionPassed[_nftID]) revert InspectionNotPassed();
        if (!approval[_nftID][buyer[_nftID]]) revert NotAllPartiesApproved();
        if (!approval[_nftID][seller]) revert NotAllPartiesApproved();
        if (!approval[_nftID][lender]) revert NotAllPartiesApproved();
        if (address(this).balance < purchasePrice[_nftID]) revert InsufficientFunds();
        
        // Update state before external calls
        isListed[_nftID] = false;
        address propertyBuyer = buyer[_nftID];
        
        // Transfer funds to seller
        (bool success, ) = seller.call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
        
        // Transfer NFT to buyer
        IERC721(nftAddress).transferFrom(address(this), propertyBuyer, _nftID);
        
        emit SaleFinalized(_nftID, propertyBuyer, seller);
    }
    
    /**
     * @dev Cancel sale and handle earnest deposit
     */
    function cancelSale(uint256 _nftID) external nonReentrant propertyListed(_nftID) {
        require(
            msg.sender == buyer[_nftID] || msg.sender == seller,
            "Only buyer or seller can cancel"
        );
        
        isListed[_nftID] = false;
        
        // Return earnest deposit based on inspection status
        if (address(this).balance > 0) {
            if (!inspectionPassed[_nftID]) {
                // Refund to buyer if inspection failed
                payable(buyer[_nftID]).sendValue(address(this).balance);
            } else {
                // Send to seller if inspection passed
                seller.sendValue(address(this).balance);
            }
        }
        
        // Return NFT to seller
        IERC721(nftAddress).transferFrom(address(this), seller, _nftID);
        
        emit SaleCancelled(_nftID);
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}