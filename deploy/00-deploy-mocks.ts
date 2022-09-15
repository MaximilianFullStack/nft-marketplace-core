import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const deployMocks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const args = ["Bob", "BOBS"];

    const mocks = await deploy("NFT", {
        from: deployer,
        gasLimit: 20000000,
        args: args,
        log: true,
    });
};

export default deployMocks;
deployMocks.tags = ["mocks", "all"];
