import { Flex, Spacer } from '@chakra-ui/react'

function Link({ uri, text }) {
  return <a href={uri} target="_blank" rel="noreferrer">{text}</a>;
}

function Footer() {
  return (
    <footer>
      <Flex h='10'>
      <Link uri={"https://github.com/NAJPCH/Project3_PNI_MJO"} text={"GitHub"} />
      <Spacer />
      <Link uri={"https://www.alyra.fr/formations/decouvrir-la-formation-developpeur-blockchain-alyra"} text={"Projet de formation Alyra"} />
      <Spacer />
      <Link uri={"https://https://www.google.fr/"} text={"Présentation Loom"} />
      </Flex>
    </footer >
  );
}

export default Footer;
