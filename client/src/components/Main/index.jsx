import React, { useState, useEffect } from 'react';
import useEth from "../../contexts/EthContext/useEth";
import Step from "./Step";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import Selection from "./Selection";
import Settings from "./Settings";
import SwaptoETH from "./SwaptoETH"
import DepositMixer from "./DepositMixer";
import WithdrawMixer from "./WithdrawMixer";
import SwaptoToken from "./SwaptoToken"
import Done from "./Done"



function Main() {
  const { state } = useEth();
  //const [value, setValue] = useState("?");
  const [step, setStep] = useState("");
  const [selectedValues, setSelectedValues] = useState([]);
  const [account, setAccount] = useState(""); 
  const [userData, setUserData] = useState(null);

  const {
    state: { contract, accounts },
  } = useEth();

  const Steps = {
    0: "TokenSelection",
    1: "Settings",
    2: "Swap",
    3: "DepositMixer",
    4: "WithdrawMixer",
    5: "SwapBack",
    6: "Done",
  };
  
  
  const fetchUserData = async () => {
    if (contract && account) {
      try {
        const userData = await contract.methods.getUserData(account).call({ from: accounts[0] });
        setUserData(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  useEffect(() => {
    if (contract && account) {
        fetchUserData();
    }
  }, ); // [contract, account]

  const main =
          <div>
            <Step step={step} setStep={setStep} />
            <Selection account={account} setAccount={setAccount} step={step} setStep={setStep} userData={userData} setUserData={setUserData} selectedValues={selectedValues} setSelectedValues={setSelectedValues} />
            {step === "1"  && ( <Settings userData={userData} account={account} setAccount={setAccount} /> )}
            {step === "2"  && ( <SwaptoETH userData={userData} /> )}
            {step === "3"  && ( <DepositMixer/> )}
            {step === "4"  && ( <WithdrawMixer/> )}
            {step === "5"  && ( <SwaptoToken userData={userData} /> )}
            {step === "6"  && ( <Done/> )}
          </div>;


  return (
    <div className="main">
      {
        !state.artifact ? <NoticeNoArtifact /> :
          !state.contract ? <NoticeWrongNetwork /> :
            main
      }
    </div>
  );
}

export default Main;

