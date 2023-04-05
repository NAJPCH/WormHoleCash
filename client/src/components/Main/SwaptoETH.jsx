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

const SwaptoETH = ({selectedValues, setSelectedValues}) => {
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

    const Swap = async e => { await contract.methods.Swap(amount,selectedValues.join(', ')).send({ from: accounts[0] }); };

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

    return (
        <Center><Card maxW='md' minW='500px'>
            <CardBody>
                <Stack divider={<StackDivider />} spacing='2'>
                <Box>
                    <Heading size='xs' textTransform='uppercase'>Swap to ETH</Heading>
                    <Stack spacing={4}>
                    <InputGroup size='sm'>
                        <InputLeftAddon width='60px' children='LINK' />
                        <Input type='F' onChange={handleAmountChange} placeholder='' />
                    </InputGroup>
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
                        {/*<Button onClick={getLatestPrice}>Rafraîchir</Button>*/}
                        { isApproved ? (
                            <Button onClick={Swap}>Swap</Button>
                        ) : (
                            <Button onClick={async () => {
                                    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
                                    await approveToken(selectedValues[0], amountInWei);
                                    setIsApproved(true); // ici remplacer par un event qui change ça
                                }} > Approve
                            </Button>
                        )}
                    </Center>
                </Box>
                <Box>
                    <p>Debug: approveToken({selectedValues[0]}, );</p>
                </Box>

                </Stack>
            </CardBody>
        </Card></Center>
    );
};

export default SwaptoETH;
