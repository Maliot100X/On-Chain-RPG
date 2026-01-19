import { ethers } from "hardhat";
import { saveDeployment } from "./deployment-utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const royaltyReceiver = process.env.ROYALTY_RECEIVER || deployer.address;
  const royaltyFee = Number(process.env.ROYALTY_FEE_BPS || "500");
  const signer = process.env.MINT_SIGNER || deployer.address;

  const Character = await ethers.getContractFactory("CharacterERC721");
  const character = await Character.deploy(
    "RPG Character",
    "RPGC",
    process.env.CHARACTER_BASE_URI || "https://example.com/meta/",
    royaltyReceiver,
    royaltyFee,
    signer
  );

  const Item = await ethers.getContractFactory("ItemERC1155");
  const item = await Item.deploy(
    process.env.ITEM_BASE_URI || "https://example.com/items/{id}.json"
  );

  const Market = await ethers.getContractFactory("GameMarket");
  const market = await Market.deploy();

  await saveDeployment("baseMainnet", {
    CharacterERC721: await character.getAddress(),
    ItemERC1155: await item.getAddress(),
    GameMarket: await market.getAddress()
  });

  console.log("Deployed on Base Mainnet");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

