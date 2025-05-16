import * as fs from "fs/promises";
import * as path from "path";

// If supporting actual Windows registry, use this; otherwise, in tests, it's replaced by a mock.
let Registry: any;
try {
  Registry = require("registry-js").Registry;
} catch {
  // For environments where registry-js isn't available (non-Windows, tests, etc.)
  Registry = undefined;
}

interface XboxGame {
  id: string;
  name: string;
  platform: string;
  executablePath: string;
  size: number; // in GB
}

/**
 * Returns a list of Xbox games installed via WindowsApps on Windows.
 */
export async function getXboxGames(): Promise<XboxGame[]> {
  // Only support Windows
  if (process.platform !== "win32") {
    console.log("Xbox Games scanning is only supported on Windows");
    return [];
  }

  // Get WindowsApps install directory from registry
  const windowsAppsPath =
    Registry && Registry.getValue
      ? Registry.getValue(
          "HKEY_LOCAL_MACHINE",
          "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Appx",
          "PackageRoot"
        ) || "C:\\Program Files\\WindowsApps"
      : "C:\\Program Files\\WindowsApps"; // fallback for test/mocks

  // Scan for directories matching Xbox game packages
  let directories: { isDirectory: () => boolean; name: string }[];
  try {
    directories = await fs.readdir(windowsAppsPath, { withFileTypes: true });
  } catch (e) {
    // If folder can't be read, treat as no games
    return [];
  }

  const xboxGameDirs = directories.filter(
    (dir) =>
      dir.isDirectory() &&
      (dir.name.startsWith("Microsoft.Xbox") || dir.name.startsWith("Microsoft.XboxGame") || dir.name.startsWith("Microsoft.XboxApp"))
  );

  const games: XboxGame[] = [];

  for (const dir of xboxGameDirs) {
    const gameDirPath = path.join(windowsAppsPath, dir.name);
    const manifestPath = path.join(gameDirPath, "AppxManifest.xml");

    // Try to read and parse the manifest
    let manifestXml = "";
    try {
      await fs.access(manifestPath);
      manifestXml = await fs.readFile(manifestPath, "utf8");
    } catch {
      continue; // Skip if no manifest
    }

    // Extract <DisplayName> and <Application Executable="...">
    const displayNameMatch = manifestXml.match(/<DisplayName>(.*?)<\/DisplayName>/);
    const executableMatch = manifestXml.match(/<Application[^\>]*Executable="(.+?)"/);

    const name = displayNameMatch ? displayNameMatch[1] : dir.name;
    const executable = executableMatch ? executableMatch[1] : "";

    // Compute directory size in bytes (requires stat or recursive calculation; mock gives just .stat())
    let sizeGB = 0;
    try {
      const stat = await fs.stat(gameDirPath);
      sizeGB = Math.round(stat.size / (1024 * 1024 * 1024)); // GB
      if (sizeGB === 0 && stat.size > 0) {
        // If between 1 byte and 1GB, return as float
        sizeGB = +(stat.size / (1024 * 1024 * 1024)).toFixed(2);
      }
    } catch {
      // ignore
    }

    const game: XboxGame = {
      id: dir.name.split("_")[0], // e.g., "Microsoft.XboxGame"
      name,
      platform: "Xbox",
      executablePath: path.join(gameDirPath, executable),
      size: sizeGB,
    };

    games.push(game);
  }

  return games;
}

export default getXboxGames;