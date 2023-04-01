const WormHoleCash = artifacts.require("WormHoleCash");

module.exports = function (deployer) {
  deployer.deploy(WormHoleCash);
};
