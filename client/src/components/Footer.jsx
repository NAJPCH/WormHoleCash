import { Flex, Spacer, Text, Stack  } from '@chakra-ui/react'
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
        <Stack spacing={0}>
          <Link uri={"https://github.com/NAJPCH/WormHoleCash"} text={"GitHub"} />
          <Link uri={"https://whc-1.gitbook.io/whc1/overview/comment-sa-fonctionne"} text={"DOCS"} />
        </Stack>
        <Spacer />
        <Stack spacing={0}>
        <Text fontSize='sm' as='samp'>Donation </Text>
        <Text fontSize='sm' as='samp'>{contractAddress}</Text>
        </Stack>
        <Spacer />
        <Link uri={"https://www.alyra.fr/formations/decouvrir-la-formation-developpeur-blockchain-alyra"} text={"Projet de formation Alyra"} />
        <Spacer />
        <Link uri={"https://discord.gg/kBmrEy4r"} text={"Discord"} />
      </Flex>
    </footer >
  );
}

export default Footer;
