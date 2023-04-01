import { Flex, Spacer, Heading, Box, Image,  } from '@chakra-ui/react'
import { SunIcon, MoonIcon } from '@chakra-ui/icons'
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';



function Header(connected) {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
  
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
  


  return (
  <Flex h='10'>
    <Box boxSize='200px'>
      <Image src='../client/public/WHC_W.jpeg' alt='WHC' />
    </Box>
    <Spacer />
    <Box><Heading>Worm Hole Cash</Heading></Box>
    <Spacer />
    <Box><SunIcon/><MoonIcon/><p>{account && `${account.substring(0, 5)}...${account.slice(-3)}`}</p></Box>
  </Flex>
  );

}

export default Header;
