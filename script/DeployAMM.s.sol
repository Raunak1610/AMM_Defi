// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Script} from "forge-std/Script.sol";
import {AMMRouter} from "../src/contracts/AMMRouter.sol";
import {PairFactory} from "../src/contracts/PairFactory.sol";
import {console2} from "forge-std/console2.sol";
import {MockToken} from "../src/contracts/MockToken.sol";

contract DeployAMM is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy tokens
        MockToken tokenA = new MockToken(
            "Token A",
            "TKA"
        );

        MockToken tokenB = new MockToken(
            "Token B",
            "TKB"
        );

        // Deploy factory
        PairFactory pairFactory = new PairFactory();

        // Deploy router
        AMMRouter ammRouter = new AMMRouter(
            address(pairFactory)
        );

        console2.log("Token A:", address(tokenA));
        console2.log("Token B:", address(tokenB));
        console2.log("PairFactory:", address(pairFactory));
        console2.log("AMMRouter:", address(ammRouter));

        vm.stopBroadcast();
    }
}