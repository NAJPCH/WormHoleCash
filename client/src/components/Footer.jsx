import { Flex, Spacer, Text } from '@chakra-ui/react'
import useEth from "../contexts/EthContext/useEth";

function Link({ uri, text }) {
  return <a href={uri} target="_blank" rel="noreferrer">{text}</a>;
}

function Footer() {
  const { state: { contract } } = useEth();
  const contractAddress = contract ? contract.options.address : '';

  return (
    <footer>
      <Flex h='10'>
        <Link uri={"https://github.com/NAJPCH/WormHoleCash"} text={"GitHub"} />
        <Spacer />
        <Text as='samp'>Donation: {contractAddress}</Text>
        <Spacer />
        <Link uri={"https://www.alyra.fr/formations/decouvrir-la-formation-developpeur-blockchain-alyra"} text={"Projet de formation Alyra"} />
        <Spacer />
        <Link uri={"https://discord.gg/kBmrEy4r"} text={"Discord"} />
      </Flex>
    </footer >
  );
}

export default Footer;
