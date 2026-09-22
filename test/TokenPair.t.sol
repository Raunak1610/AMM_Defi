// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {TokenPair} from "../src/contracts/TokenPair.sol";
import {MOCKERC20} from "./mocks/MOCKERC20.sol";

contract TokenPairTest is Test {
    TokenPair public pair;
    MOCKERC20 public tokenA;
    MOCKERC20 public tokenB;

    address internal lp=makeAddr("lp");
    address internal trader=makeAddr("trader");

    uint256 iternal constant MINIMUM_LIQUIDITY=1_000;
    event Tranfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed sender, uint256 amountA, uint256 amountB);
    event Burn(address indexed sender, uint256 amountA, uint256 amountB, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amountAIn,
        uint256 amountBIn,
        uint256 amountAOut,
        uint256 amountBOut,
        address indexed to
    );
    function setUp() public{
        uint8 decimals=18;
        tokenA=new MOCKERC20("Token A","TKA");
        tokenB=new MOCKERC20("Token B","TKB");
        pair=new TokenPair();
        pair.initialize(address(tokenA),address(tokenB));
    }

    function testInitializeAndSetsMetadataAndFactory()public{
        assertEq(pair.name(),"LP Token");
        assertEq(pair.symbol(),"LPT");
        assertEq(pair.factory(),address(this));
    }

    function testGetReservesInitializeZero()public{
        assertEq(pair.getReserves().reserveA,0);
        assertEq(pair.getReserves().reserveB,0);
        assertEq(pair.getReserves().blockTimestampLast,0);
    }

    function testInitializeRevertWhenNotFactory() public{
        vm.prank(makeAddr("notFactory"));
        vm.expectRevert(bytes("Not Factory"));
        pair.initialize(address(tokenA),address(tokenB));

    }

    function testMintFirstLiquidity() public{
        uint256 amountA=1e18;
        uint256 amountB=4e18;
        uint256 expectedTotalSupply=2e18;// this is the total supply of the lp tokens after minting
        uint256 expectedLiquidity=expectedTotalSupply-MINIMUM_LIQUIDITY;// this is the amount of liquidity that will be minted to the lp after locking the minimum liquidity
        tokenA.mint(lp,amountA);
        tokenB.mint(lp,amountB);
        
        vm.startPrank(lp);
        tokenA.transfer(address(pair),anountA);
        tokenB.transfer(address(pair),amountB);

        vm.expectEmit(true,true,false,true,address(pair));
        emit Transfer(address(0),address(0xdead),MINIMUM_LIQUIDITY);

        vm.expectEmit(true,true,true,true,address(pair));
        emit Transfer(address(0),lp,expectedLiquidity);

        vm

        vm.stopPrank();

    }

    function addLiquidity(uint256 amountA,uint256 amountB,address provider)internal{
        tokenA.mint(provider,amountA);
        tokenB.mint(provider,amountB);

        vm.startPrank(provider);
        tokenA.transfer(address(pair),amountA);
        tokenB.transfer(address(pair),amountB);
        pair.mint(provider);// minting lp tokens to provider after adding liquidity
        vm.stopPrank();
    }

    function testBurnForAddedLiquidity() public{
        uint256 amountA=3e18;
        uint256 amountB=3e18;
        addLiquidity(amountA,amountB,lp);

        uint256 expectedTokenSupply=3e18;
        uint256 burnLiquidity=expectedTokenSupply-MINIMUM_LIQUIDITY;

        vm.startPrank(lp);
        pair.transfer(address(pair),burnLiquidity); // sending the lp tokens to the pair contract for burning
        
        vm.expectEmit(true, true, true, true, address(pair));
        emit Transfer(address(pair), address(0), burnLiquidity);

        vm.expectEmit(false, false, false, true, address(pair));
        emit Sync(MINIMUM_LIQUIDITY, MINIMUM_LIQUIDITY);

        vm.expectEmit(true, false, false, true, address(pair));
        emit Burn(lp, amountA - MINIMUM_LIQUIDITY, amountB - MINIMUM_LIQUIDITY, lp);

        (uint256 outA, uint256 outB) = pair.burn(lp);
        vm.stopPrank();    

        assertEq(outA, amountA - MINIMUM_LIQUIDITY);// the outA is the amount of tokenA that will be sent to the lp after burning the liquidity
        assertEq(outB, amountB - MINIMUM_LIQUIDITY);

        assertEq(pair.balanceOf(lp), 0);// the lp should have no more lp tokens after burning all of them
        assertEq(pair.totalSupply(), MINIMUM_LIQUIDITY);//

        assertEq(tokenA.balanceOf(address(pair)), MINIMUM_LIQUIDITY);
        assertEq(tokenB.balanceOf(address(pair)), MINIMUM_LIQUIDITY);

        (uint256 rA, uint256 rB,) = pair.getReserves();
        assertEq(rA, MINIMUM_LIQUIDITY);//
        assertEq(rB, MINIMUM_LIQUIDITY);    
    }

    function _getAmountAtoB(
        uint256 amountIn
        uint256 reserveA
        uint256 reserveB
    ) internal pure returns(uint256){

        uint256 amountInWithFee=amountIn*998;
        uint256 numerator=amountInWithFee*reserveB;
        uint256 denominator=(reserveA*1000)+amountInWithFee;

        return numerator/denominator;
    }

}
