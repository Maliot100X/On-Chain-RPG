import { expect } from "chai";
import { ethers } from "hardhat";

describe("CharacterERC721", () => {
  it("mints with valid signature and enforces limits", async () => {
    const [owner, signer, user] = await ethers.getSigners();

    const Character = await ethers.getContractFactory("CharacterERC721");
    const contract = await Character.deploy(
      "RPG Character",
      "RPGC",
      "https://example.com/meta/",
      owner.address,
      500,
      signer.address
    );

    const price = ethers.parseEther("0.1");
    const maxMints = 1;
    const saleId = 1;

    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "uint256", "address", "uint256"],
      [user.address, price, maxMints, saleId, await contract.getAddress(), 31337]
    );

    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    const tx = await contract
      .connect(user)
      .mintCharacter(
        1,
        1,
        ethers.ZeroHash,
        ethers.ZeroHash,
        price,
        maxMints,
        saleId,
        signature,
        { value: price }
      );
    await tx.wait();

    const character = await contract.getCharacter(1);
    expect(character.level).to.equal(1);

    await expect(
      contract
        .connect(user)
        .mintCharacter(
          1,
          1,
          ethers.ZeroHash,
          ethers.ZeroHash,
          price,
          maxMints,
          saleId,
          signature,
          { value: price }
        )
    ).to.be.revertedWithCustomError(contract, "MintLimitExceeded");
  });
});
