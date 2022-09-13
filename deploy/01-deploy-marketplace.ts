import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

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
};

export default deployMarketplace;
deployMarketplace.tags = ["marketplace"];
