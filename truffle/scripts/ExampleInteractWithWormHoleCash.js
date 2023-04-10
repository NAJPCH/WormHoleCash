const WormHoleCash = artifacts.require("WormHoleCash");

module.exports = async function (callback) {
  try {
    // Chargement du smart contract WormHoleCash déployé
    const WHCInstance = await WormHoleCash.deployed();

    // Obtenir les comptes disponibles
    const accounts = await web3.eth.getAccounts();
    const user1 = accounts[0];
    const user2 = accounts[1];
    const LINK = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

    // Interactions avec le smart contract

    console.log("FIRST INTERACTIONS STEP: RESET");
    const txReset = await WHCInstance.reset({ from: user1 });
    console.log("User1 succes to Reset his process on Tx:", txReset.tx);

    const txReset2 = await WHCInstance.reset({ from: user2 });
    console.log("User2 succes to Reset his process on Tx:", txReset2.tx);


    console.log("SWITCH TO USER 1");
    const txSelection = await WHCInstance.Selection(LINK, { from: user1 });
    console.log("User1 succes to Select LINK Token on Tx:", txSelection.tx);

    const currentStep = await WHCInstance.getCurrentStep({ from: user1 });
    console.log("Current step for user1:", user1, "is:", currentStep.toString());

    const txSettings = await WHCInstance.Settings(user1, {from: user1});
    console.log("User1 succes to set Settings on Tx:", txSettings.tx);

    const currentStep2 = await WHCInstance.getCurrentStep({ from: user1 });
    console.log("Current step for user1:", user1, "is:", currentStep2.toString());


    console.log("SWITCH TO USER 2");
    const txSelection2 = await WHCInstance.Selection(LINK, { from: user2 });
    console.log("User2 succes to Select LINK Token on Tx:", txSelection2.tx);

    const currentStep3 = await WHCInstance.getCurrentStep({ from: user2 });
    console.log("Current step for user2:", user2, "is:", currentStep3.toString());

  } catch (error) {
    console.error(error);
  }

  callback();
};
