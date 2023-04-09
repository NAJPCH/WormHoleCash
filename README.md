# Worm Hole Cash

# Sommaire
- [Info](#Info)
- [Dapp](#Dapp)
- [Demo](#Demo)
- [Stack](#Stack)
- [Coverage](#Coverage)
- [Discord](#Protection-contre-une-Reentrance)


## Info
Worm Hole Cash is decentralized application for a graduation project of the Blockchain Developer training at ALYARA for the 2023 Satoshi Session.
Application only deployed on the Ethereum Goerli test network.
Please use it on your own risk.

## Dapp
https://worm-hole-cash.vercel.app/

## Demo
Public de Développeur https://www.loom.com/share/9d057ad778664589af88a648f780dab7
Public de Consulatant https://loom.com/share/68753af63efd46739157c4c9be1a5945

## Stack
  ```sh
React Truffle Box https://trufflesuite.com/boxes/react/
Web3.js https://web3js.readthedocs.io/
Chakra UI https://chakra-ui.com/
```

## Coverage
This project is based on the Truffle Box React architecture. There is no coverage possible.
However, a solution exists but has not yet been implemented. 
(https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-truffle5)

  Contract: WormHoleCash.sol
    // ::::::::::::: WORM HOLE CACH TESTS ::::::::::::: //
      Change step Revert Wrong step
        ✔ Should fail change step to SwapBack (837ms)
        ✔ Should fail change step to WithdrawMixer (394ms)
        ✔ Should fail change step to DepositMixer (169ms)
        ✔ Should fail change step to Swap (174ms)
        ✔ Should fail change step to Settings (165ms)
        ✔ Should fail change step to Selection (966ms)
      Selection tests
        ✔ getCurrentStep =0 (206ms)
        ✔ Should fail to set a null address (184ms)
        ✔ Should event StepChanged (1130ms)
        ✔ Should event TokenListed (1321ms)
      Settings tests
        ✔ getCurrentStep =2 (508ms)
        ✔ Should fail to set a null address
        ✔ Should event StepChanged (768ms)
        ✔ Should event OutputAddressSet (414ms)
      Swap tests
        ✔ Should fail to set a null address
        ✔ Should fail to set a null amount
        X Should event StepChanged // Not passed, Blocked by approve 



## Discord
https://discord.gg/kBmrEy4r
