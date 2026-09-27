// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import "./TokenPair.sol";
import "../interfaces/IPairFactory.sol";

contract PairFactory is IPairFactory {
   
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs; 

    function allPairsLength() external view returns(uint256){
        return allPairs.length;
    }

    bytes32 public constant INIT_CODE_PAIR_HASH = 
     keccak256(abi.encodePacked(type(TokenPair).creationCode));

    function createPair(address tokenA, address tokenB) external returns(address pair){

        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");

        // Step1:sorting operations 
        (address _tokenA, address _tokenB)= tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(_tokenA != address(0),"ZERO_ADDRESS");
        require(getPair[_tokenA][_tokenB]== address(0),"PAIR_ALREADY_EXISTS");
        
        // Step2: Prepare for create2 arguments(basically helping for deployment of the contract)
        bytes memory bytecode= type(TokenPair).creationCode;
        bytes32 salt= keccak256(abi.encodePacked(_tokenA,_tokenB));

        // Step3: Deploy the tokenpair on the address calculated.
        // with the factory address , bytecode and salt 
        assembly{
            pair:= create2(0,add(bytecode,32), mload(bytecode), salt) 
        }

        ITokenPair(pair).initialize(_tokenA,_tokenB);

        getPair[_tokenA][_tokenB]=pair;
        getPair[_tokenB][_tokenA]=pair;
        allPairs.push(pair);

        emit PairCreated(_tokenA,_tokenB,pair,allPairs.length);
    }

}    