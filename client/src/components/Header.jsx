import { Flex, Spacer, Heading, Box, Image } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

function Header(connected) {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [ethBalance, setEthBalance] = useState('');

  useEffect(() => {
    const connectMetaMask = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
          const balance = await web3Instance.eth.getBalance(accounts[0]);
          setEthBalance(Number(web3Instance.utils.fromWei(balance, 'ether')).toFixed(2));
        } catch (err) {
          console.error('User denied account access', err);
        }
      } else {
        console.error('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    };

    connectMetaMask();
  }, []);

  return (
    <Flex h='10'>
      <Box boxSize='40px'>
        <Image src='https://i.postimg.cc/xTfX6hh4/WHC-W.png' />
      </Box>
      <Spacer />
      <Box>
        <Heading>Worm Hole Cash</Heading>
      </Box>
      <Spacer />
      <Box>
        <p>{account && `${account.substring(0, 5)}...${account.slice(-3)}`}</p>
        <p>{ethBalance && `${ethBalance} ETH`}</p>
      </Box>
    </Flex>
  );
}

export default Header;
