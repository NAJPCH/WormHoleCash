import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import useEth from "../../contexts/EthContext/useEth";
import { Input, Stack, InputGroup, InputLeftAddon, CheckboxGroup, Checkbox, Center } from '@chakra-ui/react';
import { Card, CardBody, Heading, Box, Text, StackDivider, Button  } from '@chakra-ui/react'

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

const TOKEN_ADDRESSES = {
  '0x326c977e6efc84e512bb9c30f76e30c160ed06fb': 'LINK',
  '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844': 'DAI',
  '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6': 'WETH',
};

const ConnectWallet = ({step, setStep, selectedValues, setSelectedValues}) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [tokenBalances, setTokenBalances] = useState({});
  //const { state: { contract , accounts, txhash, web3} } = useEth();

  const [destinationAddress, setDestinationAddress] = useState('');
  const [Amount, setAmount] = useState('');

  const {
    state: { contract, accounts },
  } = useEth();

  const Selection = async e => { await contract.methods.Selection(selectedValues.join(', ')).send({ from: accounts[0] }); };
  const Settings = async e => { await contract.methods.Settings(destinationAddress).send({ from: accounts[0] });  };
  //const Swap = async e => { await contract.methods.Swap(100).send({ from: accounts[0] }); };
  //const getLatestPrice = async e => { await contract.methods.getLatestPrice().call({ from: accounts[0] }); };

  useEffect(() => {
    const connectMetaMask = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
        } catch (err) {
          console.error('User denied account access', err);
        }
      } else {
        console.error('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    };

    connectMetaMask();
  }, []);

  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (web3 && account) {
        const balances = {};

        for (const [address, name] of Object.entries(TOKEN_ADDRESSES)) {
          const tokenContract = new web3.eth.Contract(ERC20_ABI, address);
          const balanceInWei = await tokenContract.methods.balanceOf(account).call();
          const balance = web3.utils.fromWei(balanceInWei, 'ether');
          balances[address] = { name, balance };
        }

        setTokenBalances(balances);
      }
    };

    fetchTokenBalances();
  }, [web3, account]);

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

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };


  return (
    <div>
      {/*account && ( <p> <strong>Connected with:</strong> {account} </p> )*/}
      {step === "0"  && (  
        <Center>
        <Card maxW='md' minW='500px'>
        <CardBody>
          
          <Stack divider={<StackDivider />} spacing='2'>
            <Box><Heading size='md'>Setings</Heading></Box>
            <Box>
              <Heading size='xs' textTransform='uppercase'>Tokens</Heading>
              <CheckboxGroup colorScheme='green'>
                <Stack spacing={[1, 1]} direction={['row', 'column']}>
                  {Object.entries(tokenBalances).map(([address, { name, balance }]) => (
                    <Checkbox onChange={handleChange}  value={address}>
                      <Text as='b'>{/*address*/name }</Text>
                      <Text as='i'>{' (' + parseFloat(balance).toFixed(2) + ')'}</Text>
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </Box>
            <Box>
              {/*<p>Éléments sélectionnés : {selectedValues.join(', ')}</p>*/}
              <Center><Button onClick={Selection}>Selection</Button></Center>
            </Box>

          </Stack>
        </CardBody>
      </Card>
      </Center>
    )}
    {step === "1"  && (   
      <Center>
      <Card maxW='md' minW='500px'>
        <CardBody>
          
          <Stack divider={<StackDivider />} spacing='2'>
            <Box>
              <Heading size='xs' textTransform='uppercase'>Adresses </Heading>
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
            <Center><Button onClick={Settings}>Settings</Button></Center>
            </Box>

          </Stack>
        </CardBody>
      </Card></Center>
    )}

    </div>
  );
};

export default ConnectWallet;