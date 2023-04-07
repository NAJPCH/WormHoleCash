import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import useEth from "../../contexts/EthContext/useEth";
import { Input, Stack, InputGroup, InputLeftAddon, ListItem, UnorderedList, Switch, Center } from '@chakra-ui/react';
import { Card, CardBody, Heading, Box, Text, StackDivider, Button  } from '@chakra-ui/react'
import useToastManager from "./useToastManager"; 

const TOKEN_ADDRESSES = {
  '0x326c977e6efc84e512bb9c30f76e30c160ed06fb': 'LINK',
  '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844': 'DAI',
  '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6': 'WETH',
};

const Settings = ({account, selectedValues, setSelectedValues}) => {
  const [web3, setWeb3] = useState(null);
  //const [account, setAccount] = useState('');
  const [tokenBalances, setTokenBalances] = useState({});
  //const { state: { contract , accounts, txhash, web3} } = useEth();
  const [tokenListedEvents, setTokenListedEvents] = useState([]);

  const [destinationAddress, setDestinationAddress] = useState('');
  const [Amount, setAmount] = useState('');

  const {
    state: { contract, accounts },
  } = useEth();

  const { showToast, showToastForTransaction } = useToastManager();

  const Settings = async () => {
    const transactionPromise = contract.methods.Settings(destinationAddress).send({ from: accounts[0] });
    //showToastForTransaction(transactionPromise, (result) => { console.log("TX OK"); }, (error) => { console.log("TX KO"); });
    showToastForTransaction(transactionPromise, (result) => {}, (error) => {});
  };

  const handleChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedValues([...selectedValues, value]);
    } else {
      setSelectedValues(selectedValues.filter((item) => item !== value));
    }
  };

  const handleDestinationAddressChange = (e) => {
    setDestinationAddress(e.target.value);
  };

  const handleAmountChange = (e) => {   //pas utilisé ?
    setAmount(e.target.value); 
  };

  //Mutual useEffect    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  
  return (
      <Center>
      <Card maxW='md' minW='500px'>
        <CardBody>
          
          <Stack divider={<StackDivider />} spacing='2'>
            <Box>
              <Heading size='xs' textTransform='uppercase'>Settings</Heading>
              <Stack spacing={4}>
                <InputGroup size='sm'>
                  <InputLeftAddon width='60px' children='From' />
                  <Input type='F' isDisabled placeholder={account} />
                </InputGroup>
                {/* If you add the size prop to `InputGroup`, it'll pass it to all its children. */}
                <InputGroup size='sm'>
                  <InputLeftAddon width='60px' children=' To' />
                  <Input type='F'onChange={handleDestinationAddressChange}  placeholder='Put your destination address here' />
                </InputGroup>
              </Stack>
              <Text as='i' color='tomato' pt='2' fontSize='sm'>Must be out of any link from your current address</Text>
            </Box>
            <Box>
            <p>ici le temps min de mix</p>
            </Box>
            <Box>
            <Center><Button onClick={Settings}>Settings Done</Button></Center>
            </Box>

          </Stack>
        </CardBody>
      </Card>
    </Center>
  );
};

export default Settings;