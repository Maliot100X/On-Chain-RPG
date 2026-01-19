import { expect } from "chai";
import { ethers } from "hardhat";

describe("ItemERC1155", () => {
  it("enforces max supply and soulbound rules", async () => {
    const [owner, user] = await ethers.getSigners();

    const Item = await ethers.getContractFactory("ItemERC1155");
    const item = await Item.deploy("https://example.com/items/{id}.json");

    await item.connect(owner).setMaxSupply(1, 10);
    await item.connect(owner).mint(user.address, 1, 5, "0x");

    await expect(
      item.connect(owner).mint(user.address, 1, 6, "0x")
    ).to.be.revertedWithCustomError(item, "MaxSupplyExceeded");

    await item.connect(owner).setSoulbound(1, true);

    await expect(
      item
        .connect(user)
        .safeTransferFrom(user.address, owner.address, 1, 1, "0x")
    ).to.be.revertedWithCustomError(item, "SoulboundToken");
  });
});

