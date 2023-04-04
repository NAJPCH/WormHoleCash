//import React, { useState } from 'react';
//import WHC from '../../contracts/WormHoleCash.json';
//import { Button, ButtonGroup } from '@chakra-ui/react'

//import React, { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { Button } from '@chakra-ui/react'

function StepFunctions() {
  //const [whc, setWhc] = useState(null);
  const {
    state: { contract, accounts },
  } = useEth();

  const RESET = async e => { await contract.methods.RESET().send({ from: accounts[0] }); };
  const Selection = async e => { await contract.methods.Selection("0x326C977E6efc84E512bB9C30f76E30c160eD06FB").send({ from: accounts[0] }); };
  const Settings = async e => { await contract.methods.Settings("0x326C977E6efc84E512bB9C30f76E30c160eD06FB").send({ from: accounts[0] });  };
  const Swap = async e => { await contract.methods.Swap().send({ from: accounts[0] }); };
  const DepositMixer = async e => { await contract.methods.DepositMixer().send({ from: accounts[0] }); };
  const WithdrawMixer = async e => { await contract.methods.WithdrawMixer().send({ from: accounts[0] }); };
  const FeesServices = async e => { await contract.methods.FeesServices().send({ from: accounts[0] }); };
  const SwapBack = async e => { await contract.methods.SwapBack().send({ from: accounts[0] }); };
  const Done = async e => { await contract.methods.Done().send({ from: accounts[0] }); };
  

  return (
    <>
      <Button colorScheme='blue' onClick={RESET}>RESET</Button>
      <Button colorScheme='blue' onClick={Selection}>Selection</Button>
      <Button colorScheme='blue' onClick={Settings}>Settings</Button>
      <Button colorScheme='blue' onClick={Swap}>Swap</Button>
      <Button colorScheme='blue' onClick={DepositMixer}>DepositMixer</Button>
      <Button colorScheme='blue' onClick={WithdrawMixer}>WithdrawMixer</Button>
      <Button colorScheme='blue' onClick={FeesServices}>FeesServices</Button>
      <Button colorScheme='blue' onClick={SwapBack}>SwapBack</Button>
      <Button colorScheme='blue' onClick={Done}>Done</Button>
    </>
  );
}

export default StepFunctions;
