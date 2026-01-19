// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ItemERC1155 is ERC1155, Ownable {
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalMinted;
    mapping(uint256 => bool) public soulbound;

    error MaxSupplyExceeded();
    error SoulboundToken();

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    function setMaxSupply(
        uint256 id,
        uint256 newMaxSupply
    ) external onlyOwner {
        require(newMaxSupply >= totalMinted[id], "Invalid max supply");
        maxSupply[id] = newMaxSupply;
    }

    function setSoulbound(uint256 id, bool isSoulbound) external onlyOwner {
        soulbound[id] = isSoulbound;
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        uint256 newTotal = totalMinted[id] + amount;
        uint256 cap = maxSupply[id];
        if (cap != 0 && newTotal > cap) {
            revert MaxSupplyExceeded();
        }
        totalMinted[id] = newTotal;
        _mint(to, id, amount, data);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        if (from != address(0) && to != address(0) && soulbound[id]) {
            revert SoulboundToken();
        }
        super.safeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                if (soulbound[ids[i]]) {
                    revert SoulboundToken();
                }
            }
        }
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
}
