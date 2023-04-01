import { EthProvider } from "./contexts/EthContext";
import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";
import { Grid, GridItem } from '@chakra-ui/react'
import React from "react";


function App(){

//backgroundImage="url('https://images.typeform.com/images/U9fg8PdXKZz4/background/large')"
  return (
    
    <EthProvider >
      <Grid templateAreas={`"header" " main" " footer"`} 
            wrap="wrap"
            bgGradient='linear(to-r, gray.800, blackAlpha.900, gray.800)'
            color="white"
            width={{ base: "100%", md: "auto" }}>
        <GridItem p='2' bg='RGBA(0, 0, 0, 0.16)'  area={'header'}>
          <Header/>
        </GridItem>
        <GridItem p='2' area={'main'}>
          <Main />
        </GridItem>
        <GridItem p='2' bg='RGBA(0, 0, 0, 0.16)' area={'footer'}>
          <Footer />
        </GridItem>
      </Grid>

    </EthProvider>
  );
}

export default App;