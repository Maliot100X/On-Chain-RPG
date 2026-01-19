// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CharacterERC721 is ERC721, ERC2981, Ownable {

    struct CharacterData {
        uint8 classId;
        uint8 raceId;
        bytes32 dna;
        uint32 level;
        bytes32 progressHash;
    }

    event CharacterMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint8 classId,
        uint8 raceId,
        bytes32 dna
    );

    event LevelUpdated(uint256 indexed tokenId, uint32 level);
    event ProgressHashUpdated(uint256 indexed tokenId, bytes32 progressHash);

    mapping(uint256 => CharacterData) private _characters;
    mapping(address => uint256) public mintedPerAddress;

    address public signer;
    string private _baseTokenURI;
    uint256 private _nextTokenId = 1;

    error InvalidSignature();
    error MintLimitExceeded();
    error InvalidPayment();
    error NotTokenOwner();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_,
        address signer_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI_;
        _setDefaultRoyalty(royaltyReceiver_, royaltyFeeNumerator_);
        signer = signer_;
    }

    function setSigner(address newSigner) external onlyOwner {
        signer = newSigner;
    }

    function setBaseTokenURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function mintCharacter(
        uint8 classId,
        uint8 raceId,
        bytes32 dna,
        bytes32 initialProgressHash,
        uint256 price,
        uint256 maxMints,
        uint256 saleId,
        bytes calldata signature
    ) external payable returns (uint256) {
        if (msg.value != price) {
            revert InvalidPayment();
        }

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                msg.sender,
                price,
                maxMints,
                saleId,
                address(this),
                block.chainid
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        if (signer == address(0) || ECDSA.recover(digest, signature) != signer) {
            revert InvalidSignature();
        }

        if (mintedPerAddress[msg.sender] + 1 > maxMints) {
            revert MintLimitExceeded();
        }

        uint256 tokenId = _nextTokenId++;
        mintedPerAddress[msg.sender] += 1;

        _safeMint(msg.sender, tokenId);

        CharacterData storage data = _characters[tokenId];
        data.classId = classId;
        data.raceId = raceId;
        data.dna = dna;
        data.level = 1;
        data.progressHash = initialProgressHash;

        emit CharacterMinted(msg.sender, tokenId, classId, raceId, dna);
        return tokenId;
    }

    function updateLevel(
        uint256 tokenId,
        uint32 newLevel
    ) external onlyOwner {
        CharacterData storage data = _characters[tokenId];
        data.level = newLevel;
        emit LevelUpdated(tokenId, newLevel);
    }

    function updateProgressHash(
        uint256 tokenId,
        bytes32 newProgressHash
    ) external onlyOwner {
        CharacterData storage data = _characters[tokenId];
        data.progressHash = newProgressHash;
        emit ProgressHashUpdated(tokenId, newProgressHash);
    }

    function getCharacter(
        uint256 tokenId
    ) external view returns (CharacterData memory) {
        return _characters[tokenId];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
