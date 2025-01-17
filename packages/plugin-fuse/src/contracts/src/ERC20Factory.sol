// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Custom ERC20 token contract
contract CustomToken is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        _decimals = decimalsValue;
        _mint(owner, initialSupply * (10 ** decimalsValue));
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}

// Factory contract to deploy new ERC20 tokens
contract ERC20Factory is Ownable {
    // Event emitted when a new token is created
    event TokenCreated(address tokenAddress, string name, string symbol, address owner);

    // Array to store all created token addresses
    address[] public createdTokens;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Creates a new ERC20 token
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals Token decimals
     * @param initialSupply Initial supply of tokens
     * @param tokenOwner Address that will own the token contract
     * @return address Address of the newly created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        address tokenOwner
    ) public returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(tokenOwner != address(0), "Invalid owner address");

        CustomToken newToken = new CustomToken(
            name,
            symbol,
            decimals,
            initialSupply,
            tokenOwner
        );

        createdTokens.push(address(newToken));
        emit TokenCreated(address(newToken), name, symbol, tokenOwner);

        return address(newToken);
    }

    /**
     * @dev Returns the number of tokens created by this factory
     * @return uint256 Number of tokens created
     */
    function getTokenCount() public view returns (uint256) {
        return createdTokens.length;
    }

    /**
     * @dev Returns all tokens created by this factory
     * @return address[] Array of token addresses
     */
    function getAllTokens() public view returns (address[] memory) {
        return createdTokens;
    }
}
