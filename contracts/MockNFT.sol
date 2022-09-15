// SPDX-License-Idenifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFT is ERC721, ERC721Enumerable {
    uint256 public constant MAX_SUPPLY = 100;
    address public owner;

    constructor(string memory _name, string memory _symobl) ERC721(_name, _symobl) {
        owner = msg.sender;
    }

    function mint(uint256 quantity) external {
        uint256 ts = totalSupply();
        require(ts + quantity <= MAX_SUPPLY, "Mint quantity exceeds max supply");

        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, ts + i);
        }
    }

    //overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
