//SPDX-License-Identifer:MIT
pragma solidity  ^0.8.18;

import{Script} from "forge-std/Script.sol";
import{Transactions} from "../src/Transactions.sol";

contract DeployX1Coin is Script{
    uint256 owner = vm.envUint("PRIVATE_KEY");

    function run() external returns (Transactions) {
        vm.startBroadcast(owner);
        Transactions transactions  = new Transactions();


        vm.stopBroadcast();
        return(transactions);
    }
   
}