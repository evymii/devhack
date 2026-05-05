const uniq = require("lodash/uniq");
const { imageHash } = require("image-hash");
const path = require("path");

async function getUniqHashes(amountImages) {
  const hashes = [];

  for (let i = 1; i <= amountImages; i += 1) {
    const imagePath = path.join(
      "C:/Users/my_user/Downloads",
      `${i}.jpg`,
    );

    // Promisify imageHash callback so loop can await each hash.
    const hash = await new Promise((resolve, reject) => {
      imageHash(imagePath, 8, true, (error, data) => {
        if (error) return reject(error);
        resolve(data);
      });
    });

    hashes.push(hash);
  }

  console.log(
    `${hashes.length} total hashes, ${uniq(hashes).length} uniq hashes`,
  );

  return hashes;
}

getUniqHashes(17).catch((error) => {
  console.error("Hash compute failed:", error.message);
  process.exitCode = 1;
});
