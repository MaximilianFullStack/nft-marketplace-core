import { Marketplace, NFT } from "../../typechain-types";
import { deployments, ethers } from "hardhat";
import { expect, assert } from "chai";
import { ContractReceipt } from "ethers";

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

        it("Fails if the user does not approve the marketplace", async () => {
            await nft.mint(1);
            await expect(
                marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Marketplace has no approval");
        });

        it("Updates listing varibles", async () => {
            const signers = await ethers.getSigners();

            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            const lister = await marketplace.listings(nft.address, 0);
            const price = await marketplace.listingPrice(nft.address, 0);

            assert.equal(lister, signers[0].address);
            assert.equal(price.toString(), ethers.utils.parseEther("1").toString());
        });

        it("Emits an event with correct data", async () => {
            const signers = await ethers.getSigners();

            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            const tx = await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));
            const transactionReceipt: ContractReceipt = await tx.wait();

            assert.equal(signers[0].address, transactionReceipt.events![0].args?.lister);
            assert.equal(nft.address, transactionReceipt.events![0].args?.erc721);
            assert.equal(0, transactionReceipt.events![0].args?.tokenId);
            assert.equal(
                ethers.utils.parseEther("1").toString(),
                transactionReceipt.events![0].args?.price.toString()
            );
        });
    });
});
