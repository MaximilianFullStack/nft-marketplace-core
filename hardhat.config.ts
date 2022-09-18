import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "dotenv/config";
import "hardhat-contract-sizer";
import "solidity-coverage";

const config: HardhatUserConfig = {
    solidity: "0.8.9",
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337,
        },
        goerli: {
            chainId: 5,
            url: process.env.ALCHEMY_KEY!,
            accounts: [process.env.KEY!],
        },
    },

    gasReporter: {
        enabled: true,
        currency: "USD",
        gasPrice: 100,
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API,
        outputFile: "gas-report.txt",
    },

    etherscan: { apiKey: process.env.ETHERSCAN_API },

    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};

export default config;
