import { deployments, ethers } from "hardhat";
import { expect, assert } from "chai";

describe("Marketplace", async () => {
    let marketplace;
    beforeEach(async () => {
        await deployments.fixture(["marketplace"]);
    });
});
