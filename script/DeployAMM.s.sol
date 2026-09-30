// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Script} from "forge-std/Script.sol";
import {AMMRouter} from "../src/contracts/AMMRouter.sol";
import {PairFactory} from "../src/contracts/PairFactory.sol";
import {console2} from "forge-std/console2.sol";

contract DeployAMM is Script {
    function run() external {
        vm.startBroadcast();

        PairFactory pairFactory = new PairFactory();

        AMMRouter ammRouter = new AMMRouter(
            address(pairFactory)
        );

        console2.log("PairFactory:", address(pairFactory));
        console2.log("AMMRouter:", address(ammRouter));

        vm.stopBroadcast();
    }
}