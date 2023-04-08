import { useEffect, useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import { Button, Center, Card, CardBody, Stack, StackDivider, Box, Heading, InputGroup, InputLeftAddon, Input, Text } from '@chakra-ui/react';


  const ERC20_ABI = [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_spender",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
  ];
  const SwaptoETH = ({ userData }) => {
    const { state: { contract , accounts, web3} } = useEth();
    const [amount, setAmount] = useState('');
    const [Price, setPrice] = useState('');
    const [isApproved, setIsApproved] = useState(false);

    const approveToken = async (tokenAddress, amountInWei) => {
      const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
      await tokenContract.methods.approve(contract.options.address, amountInWei).send({ from: accounts[0] });
    };

    useEffect(() => {
      getLatestPrice();
    }, []);

    const Swap = async e => { 
      const newAmountInWei = web3.utils.toWei(amount, 'ether'); //Will be soon replace by Chainlink getDecimals function
      await contract.methods.Swap(newAmountInWei, userData.tokenList[0].Token).send({ from: accounts[0] }); }; // For Demo purposes only

    const getLatestPrice = async () => {
        try {
            const currentPrice = await contract.methods.getLatestPrice().call({ from: accounts[0] });
            setPrice(currentPrice);
        } catch (error) {
            console.error('Erreur lors de la récupération du dernier prix:', error);
        }
    };

    const handleAmountChange = (e) => {
        setAmount(e.target.value);
        getLatestPrice();
    }
      const Steps = {
    0: "TokenSelection", 
    1: "Settings", 
    2: "Swap", 
    3: "DepositMixer", 
    4: "WithdrawMixer", 
    5: "SwapBack", 
    6: "Done",
  };

    return (
        <Center><Card maxW='md' minW='500px'>
            <CardBody>
                <Stack divider={<StackDivider />} spacing='2'>
                <Box>
                    <Heading size='xs' textTransform='uppercase'>Swap to ETH</Heading>
                    <Stack spacing={4}>
                    <InputGroup size='sm'>
                        <InputLeftAddon width='60px' children='LINK' />
                        <Input  type='F' onChange={handleAmountChange} placeholder='' />
                    </InputGroup>
                    {/**isDisabled={isApproved} */}
                    <InputGroup size='sm'>
                        <InputLeftAddon width='60px' children='ETH' />
                        <Input isDisabled  placeholder='' value={ amount * Price/10**18 }/>
                    </InputGroup>
                    </Stack>
                    <Text textAlign="right" as="i" pt="2" fontSize="sm" fontFamily="sans-serif">
                      {Price} / ETH
                    </Text>
                </Box>
                <Box>
                    <Center>
                        { isApproved ? (
                            <Button colorScheme='green' onClick={Swap}>Swap</Button>
                        ) : (
                            <Button colorScheme='blue' onClick={async () => {
                                const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
                                await approveToken(userData.tokenList[0].Token, amountInWei);
                                setIsApproved(true); // ici remplacer par un event qui change l'etat
                              }} > Approve
                            </Button>
                        )}
                    </Center>
                </Box>
                <Box>
                    {/*userData && (
                        <div>
                          <p>Solde : {userData.tokenBalance} LINK</p>
                          <p>Output Address: {userData.outputAddress}</p>
                          <p>Deposit Start Time: {userData.depositStartTime}</p>
                          <p>Step: {Steps[userData.step]}</p>
                            {userData.tokenList.map((token, index) => (
                              <p key={index}> Token: {token.Token} | State: {token.State} </p>
                            ))}
                        </div>
                      )*/}
                </Box>

                </Stack>
            </CardBody>
        </Card></Center>
    );
};

export default SwaptoETH;


