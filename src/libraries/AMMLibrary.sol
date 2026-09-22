// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

library AMMLibrary{

    function sortTokens(
        address tokenA,
         address tokenB
         ) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ZERO_ADDRESS");
    }

    
    
}