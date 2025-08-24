import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    source: {
      url: process.env.SOURCE_RPC_URL || "",
    },
    target: {
      url: process.env.TARGET_RPC_URL || "",
    },
  },
};

export default config;
