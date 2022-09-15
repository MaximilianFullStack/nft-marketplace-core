import { Marketplace, NFT } from "../../typechain-types";
import { deployments, ethers } from "hardhat";
import { expect, assert } from "chai";
import { Signer } from "ethers";
import exp from "constants";

describe("Marketplace", async () => {
    let marketplace: Marketplace;
    let nft: NFT;
    beforeEach(async () => {
        await deployments.fixture(["all"]);
        marketplace = await ethers.getContract("Marketplace");
        nft = await ethers.getContract("NFT");
    });

    describe("ListItem", async () => {
        it("Fails if the caller does not own the nft", async () => {
            const signers = await ethers.getSigners();
            nft = await nft.connect(signers[1]);
            await nft.mint(4);
            nft = await nft.connect(signers[0]);

            await expect(
                marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Token is not owned by sender");
        });
        it("Fails if token is already listed", async () => {
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));
            await expect(
                marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Token is already listed");
        });
    });
});
