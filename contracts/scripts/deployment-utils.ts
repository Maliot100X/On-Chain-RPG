import * as fs from "fs";
import * as path from "path";

export type DeploymentMap = Record<string, string>;

export async function saveDeployment(
  network: string,
  deployment: DeploymentMap
) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, `${network}.json`);
  const existing = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf8"))
    : {};

  const merged = { ...existing, ...deployment };
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf8");
}

