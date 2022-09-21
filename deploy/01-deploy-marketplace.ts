import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { developmentChains } from "../helper-hardhat-config";
import verify from "../utils/verify";

const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const args = [50];

    const marketplace = await deploy("Marketplace", {
        from: deployer,
        gasLimit: 20000000,
        args: args,
        log: true,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API) {
        console.log("Verifing on Etherscan...");
        await verify(marketplace.address, args);
    }
};

export default deployMarketplace;
deployMarketplace.tags = ["marketplace", "all"];
