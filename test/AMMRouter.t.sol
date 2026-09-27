// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {AMMRouter} from "src/contracts/AMMRouter.sol";
import {AMMLibrary} from "src/libraries/AMMLibrary.sol";
import {IERC20} from "src/interfaces/IERC20.sol";
import {PairFactory} from "src/contracts/PairFactory.sol";
import {TokenPair} from "src/contracts/TokenPair.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract AMMRouterTest is Test{

    MockERC20 tokenA;
    MockERC20 tokenB;
    PairFactory pairFactory;
    AMMRouter ammRouter;
    uint256 internal constant MINIMUM_LIQUIDITY=1_000;
    uint256 internal constant DEFAULT_DEADLINE_OFFSET=1 hours;

    function _validDeadline() internal view returns (uint256) {
        return block.timestamp + DEFAULT_DEADLINE_OFFSET;
    }
    function setUp() public {
        tokenA=new MockERC20("TokenA","TKA",18);
        tokenB=new MockERC20("TokenB","TKB",18);
        pairFactory=new PairFactory();
        ammRouter=new AMMRouter(address(pairFactory));
    }


    function testConstructor() public{
        assertEq(ammRouter.factory(),address(pairFactory));
        address expectedPair=pairFactory.createPair(address(tokenA),address(tokenB));

        (,,address CalculatedPair)=ammRouter.getReserves(
            address(tokenA),
            address(tokenB)
        );
        assertEq(CalculatedPair,expectedPair,"Pair address should match");
    }

    function testGetReservesWithoutCreatingPair() public view{
        (uint256 reserveA_fromAB,
        uint256 reserveB_fromAB,
        address pair_fromAB)=ammRouter.getReserves(address(tokenA),address(tokenB));
        (uint256 reserveA_fromBA,
        uint256 reserveB_fromBA,
        address pair_fromBA)=ammRouter.getReserves(address(tokenB),address(tokenA));

        assertEq(reserveA_fromAB,0,"Reserve A should be 0");
        assertEq(reserveB_fromAB,0,"Reserve B should be 0");
        assertEq(reserveA_fromBA,0,"Reserve A should be 0");
        assertEq(reserveB_fromBA,0,"Reserve B should be 0");
        assertEq(pair_fromAB,pair_fromBA,"Pair addresses should match");
    }

    function testAddLiquidity() public{
        address pairFromFactory=pairFactory.createPair(address(tokenA),address(tokenB));
        uint256 amountADesired=1e18;
        uint256 amountAMin=amountADesired;
        uint256 amountBDesired=4e18;
        uint256 amountBMin=amountBDesired;  
        uint256 validDeadline=_validDeadline();

        address lpRecipient=makeAddr("lpRecipient");
        address deadAddress=makeAddr("0x000000000000000000000000000000000000dEaD");

        uint256 amountProduct=amountADesired*amountBDesired;
        uint256 expectedTotalSupply=Math.sqrt(amountProduct);
        uint256 expectedLpToProvider=expectedTotalSupply-MINIMUM_LIQUIDITY;
        
        vm.startPrank(lpRecipient);
        tokenA.mint(lpRecipient,amountADesired);
        tokenB.mint(lpRecipient,amountBDesired);

        tokenA.approve(address(ammRouter),amountADesired);
        tokenB.approve(address(ammRouter),amountBDesired);
        
        {
        (uint256 amountA,uint256 amountB,uint256 liquidity)=ammRouter.addLiquidity(
            address(tokenA),
            address(tokenB),
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            lpRecipient,
            validDeadline
        );
        vm.stopPrank();
        (uint256 reserveA_fromAB,
        uint256 reserveB_fromAB,
        address pair_fromAB)=ammRouter.getReserves(address(tokenA),address(tokenB));

        (uint256 reserveA_fromBA,
        uint256 reserveB_fromBA,
        address pair_fromBA)=ammRouter.getReserves(address(tokenB),address(tokenA));

        uint256 deadLpBalance=TokenPair(pairFromFactory).balanceOf(deadAddress);

        assertEq(amountA,amountADesired,"Amount A should match desired");
        assertEq(amountB,amountBDesired,"Amount B should match desired");
        assertEq(liquidity,expectedLpToProvider,"Liquidity should match expected");
        }
    }

}