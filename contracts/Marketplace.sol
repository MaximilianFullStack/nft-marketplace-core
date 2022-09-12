// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Marketplace is ReentrancyGuard {
    uint16 public immutable i_adminFee; //50 = 2% fee
    address public immutable i_owner;

    mapping(address => mapping(uint256 => address)) public listings;
    mapping(address => mapping(uint256 => uint256)) public listingPrice;

    /** === Constructor === **/
    constructor(uint16 _adminFee) {
        i_adminFee = _adminFee;
        i_owner = msg.sender;
    }

    /** === Events === **/
    event newListing(address lister, address erc721, uint256 tokenId, uint256 price);
    event sale(address seller, address buyer, address erc721, uint256 tokenId, uint256 salePrice);

    /** === External Functions === **/
    function listItem(
        address erc721,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(IERC721(erc721).ownerOf(tokenId) == msg.sender, "Token is not owned by sender");
        require(listings[erc721][tokenId] == address(0), "Token is already listed");

        IERC721(erc721).setApprovalForAll(address(this), true);

        listings[erc721][tokenId] = msg.sender;
        listingPrice[erc721][tokenId] = price;

        emit newListing(msg.sender, erc721, tokenId, price);
    }

    function buyItem(address erc721, uint256 tokenId) external payable nonReentrant {
        require(listings[erc721][tokenId] == address(0), "Token is not listed");
        require(
            IERC721(erc721).ownerOf(tokenId) != msg.sender,
            "Token seller cannot buy their token"
        );
        require(
            listingPrice[erc721][tokenId] == msg.value,
            "Msg value does not match listing price"
        );

        uint256 fee = msg.value / i_adminFee;
        payable(listings[erc721][tokenId]).transfer(msg.value - fee);

        IERC721(erc721).safeTransferFrom(listings[erc721][tokenId], msg.sender, tokenId);

        emit sale(
            listings[erc721][tokenId],
            msg.sender,
            erc721,
            tokenId,
            listingPrice[erc721][tokenId]
        );

        delete listings[erc721][tokenId];
        delete listingPrice[erc721][tokenId];
    }

    function cancelItem(address erc721, uint256 tokenId) external nonReentrant {
        require(listings[erc721][tokenId] == msg.sender, "Only lister can cancel their listing");

        delete listings[erc721][tokenId];
        delete listingPrice[erc721][tokenId];
    }

    function updateListing(
        address erc721,
        uint256 tokenId,
        uint256 newPrice
    ) external nonReentrant {
        require(listings[erc721][tokenId] == msg.sender, "Only lister can update their listing");
        require(
            listingPrice[erc721][tokenId] != newPrice,
            "Old price cannot be the same as the new"
        );

        listingPrice[erc721][tokenId] = newPrice;
    }

    function withdrawlAdminFees() external nonReentrant {
        require(address(this).balance > 0, "Contract balance is zero");
        payable(i_owner).transfer(address(this).balance);
    }
}
