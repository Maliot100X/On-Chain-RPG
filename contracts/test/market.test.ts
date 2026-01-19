import { expect } from "chai";
import { ethers } from "hardhat";

describe("GameMarket", () => {
  it("handles ERC721 listings and purchases with royalties", async () => {
    const [owner, seller, buyer, royaltyReceiver] = await ethers.getSigners();

    const Character = await ethers.getContractFactory("CharacterERC721");
    const character = await Character.deploy(
      "RPG Character",
      "RPGC",
      "https://example.com/meta/",
      royaltyReceiver.address,
      500,
      owner.address
    );

    const Market = await ethers.getContractFactory("GameMarket");
    const market = await Market.deploy();

    const price = ethers.parseEther("1");

    const mintSigHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256", "address", "uint256"],
      [seller.address, price, 1, 1, await character.getAddress(), 31337]
    );
    const signature = await owner.signMessage(ethers.getBytes(mintSigHash));

    await character
      .connect(seller)
      .mintCharacter(
        1,
        1,
        ethers.ZeroHash,
        ethers.ZeroHash,
        price,
        1,
        1,
        signature,
        { value: price }
      );

    await character
      .connect(seller)
      .approve(await market.getAddress(), 1);

    const listingTx = await market
      .connect(seller)
      .createListing721(await character.getAddress(), 1, price);
    const listingReceipt = await listingTx.wait();
    const listingId = listingReceipt?.logs[0]
      ? (listingReceipt.logs[0] as any).args.listingId
      : 1n;

    const sellerBalanceBefore = await ethers.provider.getBalance(
      seller.address
    );
    const royaltyBalanceBefore = await ethers.provider.getBalance(
      royaltyReceiver.address
    );

    const buyTx = await market
      .connect(buyer)
      .buy(listingId, { value: price });
    const buyReceipt = await buyTx.wait();
    const gasUsed =
      buyReceipt && buyReceipt.gasUsed
        ? buyReceipt.gasUsed * buyReceipt.gasPrice!
        : 0n;

    const sellerBalanceAfter = await ethers.provider.getBalance(
      seller.address
    );
    const royaltyBalanceAfter = await ethers.provider.getBalance(
      royaltyReceiver.address
    );

    expect(await character.ownerOf(1)).to.equal(buyer.address);
    expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
    expect(royaltyBalanceAfter).to.be.gt(royaltyBalanceBefore);
  });
});

