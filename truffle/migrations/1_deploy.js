const WormHoleCash = artifacts.require("WormHoleCash");

module.exports = async function (deployer) {

  const swapRouterV3Address = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const weth9Address = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
  const daiAddress = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  const priceFeedAddress = "0xb4c4a493AB6356497713A78FFA6c60FB53517c63"; 

  await deployer.deploy(
    WormHoleCash,
    swapRouterV3Address,
    weth9Address,
    daiAddress,
    linkAddress,
    priceFeedAddress
  );
};


/**const WormHoleCash = artifacts.require("WormHoleCash");
module.exports = function (deployer) {
  deployer.deploy(WormHoleCash);
};
 */