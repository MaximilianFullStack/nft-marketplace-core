import { Marketplace, NFT } from "../../typechain-types";
import { deployments, ethers, waffle } from "hardhat";
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

    describe("constructor", async () => {
        it("sets variables", async () => {
            const signers = await ethers.getSigners();
            const owner = await marketplace.i_owner();
            const fee = await marketplace.i_adminFee();

            assert.equal(owner, signers[0].address);
            assert.equal(fee.toString(), "50");
        });
    });

    describe("listItem", async () => {
        it("Fails if the caller does not own the nft", async () => {
            const signers = await ethers.getSigners();
            nft = await nft.connect(signers[1]);
            await nft.mint(4);
            nft = await nft.connect(signers[0]);

            await expect(
                marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Token is not owned by sender");
        });

        it("Fails if token is already listed by user", async () => {
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));
            await expect(
                marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Token is already listed by msg sender");
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

    describe("buyItem", async () => {
        it("Fails if token is not listed", async () => {
            const signers = await ethers.getSigners();

            await nft.mint(1);
            marketplace = await marketplace.connect(signers[1]);

            expect(marketplace.buyItem(nft.address, 0, { value: 1 })).to.be.revertedWith(
                "Token is not listed"
            );
        });

        it("Fails if token seller tries to buy their item", async () => {
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            expect(
                marketplace.buyItem(nft.address, 0, { value: ethers.utils.parseEther("1") })
            ).to.be.revertedWith("Token seller cannot buy their token");
        });

        it("Fails if msg value does not match listing price", async () => {
            const signers = await ethers.getSigners();
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            marketplace = await marketplace.connect(signers[1]);
            expect(
                marketplace.buyItem(nft.address, 0, { value: ethers.utils.parseEther("0.5") })
            ).to.be.revertedWith("Msg value does not match listing price");
        });

        it("Takes fee, pays seller, and transfers nft to buyer", async () => {
            const signers = await ethers.getSigners();
            const provider = waffle.provider;
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            const sellBalE = await provider.getBalance(signers[0].address);

            marketplace = await marketplace.connect(signers[1]);
            await marketplace.buyItem(nft.address, 0, { value: ethers.utils.parseEther("1") });

            const buyBalT = await nft.balanceOf(signers[1].address);
            const sellBalE2 = await provider.getBalance(signers[0].address);
            const marketBal = await provider.getBalance(marketplace.address);

            assert.equal(buyBalT.toString(), "1");
            assert.equal(
                sellBalE2.sub(sellBalE.toString()).toString(),
                ethers.utils
                    .parseEther("1")
                    .sub(ethers.utils.parseEther("1").div(50).toString())
                    .toString()
            );
            assert.equal(marketBal.toString(), ethers.utils.parseEther("1").div(50).toString());
        });

        it("Emits event with correct data and deletes listing varibles", async () => {
            const signers = await ethers.getSigners();
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            marketplace = await marketplace.connect(signers[1]);
            const tx = await marketplace.buyItem(nft.address, 0, {
                value: ethers.utils.parseEther("1"),
            });
            const transactionReceipt: ContractReceipt = await tx.wait();

            const lister = await marketplace.listings(nft.address, 0);
            const price = await marketplace.listingPrice(nft.address, 0);

            assert.equal(transactionReceipt.events![2].args?.seller, signers[0].address);
            assert.equal(transactionReceipt.events![2].args?.buyer, signers[1].address);
            assert.equal(transactionReceipt.events![2].args?.erc721, nft.address);
            assert.equal(transactionReceipt.events![2].args?.tokenId, 0);
            assert.equal(
                transactionReceipt.events![2].args?.salePrice,
                ethers.utils.parseEther("1").toString()
            );

            assert.equal(lister, "0x0000000000000000000000000000000000000000");
            assert.equal(price.toString(), "0");
        });
    });

    describe("cancelListing", async () => {
        it("Fails if user tries to cancel someone else's listing", async () => {
            const signers = await ethers.getSigners();
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            marketplace = await marketplace.connect(signers[1]);

            expect(marketplace.cancelListing(nft.address, 0)).to.be.revertedWith(
                "Only lister can cancel their listing"
            );
        });

        it("Deletes listing variables", async () => {
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            await marketplace.cancelListing(nft.address, 0);

            const lister = await marketplace.listings(nft.address, 0);
            const price = await marketplace.listingPrice(nft.address, 0);

            assert.equal(lister, "0x0000000000000000000000000000000000000000");
            assert.equal(price.toString(), "0");
        });
    });

    describe("updateListing", async () => {
        it("Fails if user tries to update someone else's listing", async () => {
            const signers = await ethers.getSigners();
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            marketplace = await marketplace.connect(signers[1]);

            expect(
                marketplace.updateListing(nft.address, 0, ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Only lister can update their listing");
        });

        it("Fails if old listing price is the same as new", async () => {
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            expect(
                marketplace.updateListing(nft.address, 0, ethers.utils.parseEther("1"))
            ).to.be.revertedWith("Old price cannot be the same as the new");
        });

        it("Updates listing price", async () => {
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));

            await marketplace.updateListing(nft.address, 0, ethers.utils.parseEther("0.5"));
            const price = await marketplace.listingPrice(nft.address, 0);

            assert.equal(price.toString(), ethers.utils.parseEther("0.5").toString());
        });
    });

    describe("withdrawlAdminFees", async () => {
        it("Fails if contract has not generated any fees", async () => {
            expect(marketplace.withdrawlAdminFees()).to.be.revertedWith(
                "Contract balance is zero"
            );
        });

        it("Transfers fees to contract owner", async () => {
            const signers = await ethers.getSigners();
            const provider = waffle.provider;
            nft = await nft.connect(signers[1]);
            marketplace = await marketplace.connect(signers[1]);
            await nft.mint(1);
            await nft.setApprovalForAll(marketplace.address, true);
            await marketplace.listItem(nft.address, 0, ethers.utils.parseEther("1"));
            marketplace = await marketplace.connect(signers[2]);
            await marketplace.buyItem(nft.address, 0, { value: ethers.utils.parseEther("1") });

            const bal = await provider.getBalance(signers[0].address);
            await marketplace.withdrawlAdminFees();
            const bal2 = await provider.getBalance(signers[0].address);
            const mrktBal = await provider.getBalance(marketplace.address);

            assert.equal(
                bal2.sub(bal).toString(),
                ethers.utils.parseEther("1").div(50).toString()
            );
            assert.equal(mrktBal.toString(), "0");
        });
    });
});
