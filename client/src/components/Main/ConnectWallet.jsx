import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

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

const TOKEN_ADDRESSES = [
  "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844"
];

const ConnectWallet = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [tokenBalances, setTokenBalances] = useState({});

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

        for (const tokenAddress of TOKEN_ADDRESSES) {
          const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
          const balance = await tokenContract.methods.balanceOf(account).call();
          const formattedBalance = web3.utils.fromWei(balance, 'ether');
          balances[tokenAddress] = formattedBalance;
        }

        setTokenBalances(balances);
      }
    };

    fetchTokenBalances();
  }, [web3, account]);

  return (
    <div>
      <h1>Token Balances</h1>
      {account && (
        <p>
          <strong>Account:</strong> {account}
        </p>
      )}
      <ul>
        {Object.entries(tokenBalances).map(([address, balance]) => (
          <li key={address}>
            Token: {address}, Balance: {balance}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectWallet;