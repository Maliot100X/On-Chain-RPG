// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract GameMarket is ReentrancyGuard {
    enum AssetType {
        ERC721,
        ERC1155
    }

    struct Listing {
        address seller;
        address assetContract;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        AssetType assetType;
        bool active;
    }

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed assetContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        AssetType assetType
    );

    event ListingCancelled(uint256 indexed listingId);
    event ListingPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price
    );

    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    error InvalidListing();
    error NotSeller();
    error InvalidPayment();

    function createListing721(
        address assetContract,
        uint256 tokenId,
        uint256 price
    ) external returns (uint256) {
        IERC721 token = IERC721(assetContract);
        require(token.ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            token.getApproved(tokenId) == address(this) ||
                token.isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            assetContract: assetContract,
            tokenId: tokenId,
            amount: 1,
            price: price,
            assetType: AssetType.ERC721,
            active: true
        });

        emit ListingCreated(
            listingId,
            msg.sender,
            assetContract,
            tokenId,
            1,
            price,
            AssetType.ERC721
        );

        return listingId;
    }

    function createListing1155(
        address assetContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    ) external returns (uint256) {
        IERC1155 token = IERC1155(assetContract);
        require(
            token.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient balance"
        );
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            assetContract: assetContract,
            tokenId: tokenId,
            amount: amount,
            price: price,
            assetType: AssetType.ERC1155,
            active: true
        });

        emit ListingCreated(
            listingId,
            msg.sender,
            assetContract,
            tokenId,
            amount,
            price,
            AssetType.ERC1155
        );

        return listingId;
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        if (!listing.active) {
            revert InvalidListing();
        }
        if (listing.seller != msg.sender) {
            revert NotSeller();
        }
        listing.active = false;
        emit ListingCancelled(listingId);
    }

    function buy(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) {
            revert InvalidListing();
        }
        if (msg.value != listing.price) {
            revert InvalidPayment();
        }

        listing.active = false;

        uint256 remaining = msg.value;
        if (_supports2981(listing.assetContract)) {
            try
                IERC2981(listing.assetContract).royaltyInfo(
                    listing.tokenId,
                    msg.value
                )
            returns (address receiver, uint256 royaltyAmount) {
                if (receiver != address(0) && royaltyAmount > 0) {
                    (bool royaltySent, ) = receiver.call{
                        value: royaltyAmount
                    }("");
                    require(royaltySent, "Royalty payment failed");
                    remaining -= royaltyAmount;
                }
            } catch {}
        }

        (bool sent, ) = listing.seller.call{value: remaining}("");
        require(sent, "Payment failed");

        if (listing.assetType == AssetType.ERC721) {
            IERC721(listing.assetContract).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId
            );
        } else {
            IERC1155(listing.assetContract).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId,
                listing.amount,
                ""
            );
        }

        emit ListingPurchased(listingId, msg.sender, msg.value);
    }

    function _supports2981(
        address assetContract
    ) internal view returns (bool) {
        try IERC165(assetContract).supportsInterface(type(IERC2981).interfaceId) returns (bool supported) {
            return supported;
        } catch {
            return false;
        }
    }
}
