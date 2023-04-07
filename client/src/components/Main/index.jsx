import React, { useState, useEffect } from 'react';
//import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Step from "./Step";
import NoticeNoArtifact from "./NoticeNoArtifact";
import NoticeWrongNetwork from "./NoticeWrongNetwork";
import Selection from "./Selection";
import Settings from "./Settings";
import SwaptoETH from "./SwaptoETH"
import DepositMixer from "./DepositMixer";
import WithdrawMixer from "./WithdrawMixer";


import { Center, Card, CardBody, Heading, Box  } from '@chakra-ui/react'

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
        const userData = await contract.methods.getUserData(account).call();
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
            <Center>
              <Card maxW='md' minW='800px' bg='gray'>
                <CardBody>
                    <Box>
                      <Heading size="xs" >USER DATA</Heading>
                      {userData && (
                        <div>
                          <p>Output Address: {userData.outputAddress}</p>
                          <p>Deposit Start Time: {userData.depositStartTime}</p>
                          <p>Step: {Steps[userData.step]}</p>
                            {userData.tokenList.map((token, index) => (
                              <p key={index}> Token: {token.Token} | State: {token.State} </p>
                            ))}
                        </div>
                      )}
                    </Box>
                </CardBody>
          </Card>
        </Center>
        
        <Selection account={account} setAccount={setAccount} step={step} setStep={setStep} selectedValues={selectedValues} setSelectedValues={setSelectedValues} />
        {step === "1"  && ( <Settings account={account} setAccount={setAccount} selectedValues={selectedValues} setSelectedValues={setSelectedValues} /> )}
        {step === "2"  && ( <SwaptoETH userData={userData} selectedValues={selectedValues} setSelectedValues={setSelectedValues}/> )}
        {step === "3"  && ( <DepositMixer/> )}
        {step === "4"  && ( <WithdrawMixer/> )}
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

