const { ethers } = require("hardhat");

async function main() {
    const Psychonautz = await ethers.getContractFactory("Psychonautz");
    const psychonautz = await Psychonautz.deploy();
    console.log("Psychonautz deployed to:", psychonautz.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });