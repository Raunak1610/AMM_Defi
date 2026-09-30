// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    uint256 public constant ETH_SEPOLIA_CHAIN_ID = 11155111;
    uint256 public constant ETH_MAINNET_CHAIN_ID = 1;
    uint256 public constant LOCAL_CHAIN_ID = 31337;

    address public constant DEFAULT_ANVIL_ACCOUNT =
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    struct NetworkConfig {
        address deployer;
    }

    function getConfig()
        public
        view
        returns (NetworkConfig memory)
    {
        if (block.chainid == LOCAL_CHAIN_ID) {
            return NetworkConfig({
                deployer: DEFAULT_ANVIL_ACCOUNT
            });
        }

        if (block.chainid == ETH_SEPOLIA_CHAIN_ID) {
            return NetworkConfig({
                deployer: vm.envAddress("DEPLOYER_ADDRESS")
            });
        }

        if (block.chainid == ETH_MAINNET_CHAIN_ID) {
            return NetworkConfig({
                deployer: vm.envAddress("DEPLOYER_ADDRESS")
            });
        }

        revert("Unsupported chain");
    }
}