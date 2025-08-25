import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    bsc: {
      url: process.env.BSC_RPC_URL || "",
      chainId: 56,
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "",
      chainId: 97,
    },
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
      chainId: 56,
    },
    bscTestnet: {
      url:
        process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
      chainId: 97,
    },
  },
};

export default config;
