const { ethers } = require("hardhat");

async function main() {
    const Psychonautz = await ethers.getContractFactory("Psychonautz");
    const payees = [ '<payee1>' ];
    const shares = [ 100 ];
    const psychonautz = await Psychonautz.deploy(payees, shares);
    console.log("Psychonautz deployed to:", psychonautz.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });