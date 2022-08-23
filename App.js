import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View, Image, Dimensions, PixelRatio, Alert, PanResponder } from 'react-native';
import Keyboard from './src/components/Keyboard'
import { useEffect, useState } from 'react';
import { colors } from './src/constants';

const NUMBER_OF_TRIES = 6;

const copyArray = (arr) => {
  return [...arr]
}

const getAllCountires = () => {
  fetch('https://restcountries.com/v3.1/all', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then((response) => response.json())
  .then((data) => {
    const names = data.map(country => country.name.common)
    console.log('Success:', data[0].name.common);
    console.log('Lista nazw: ', names.length)
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}


export default function App() {

  const countryToGuess = "poland";
  getAllCountires();

  const [row, setRow] = useState(new Array(NUMBER_OF_TRIES).fill(''));
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGamesState] = useState('playing');

  useEffect(() => {
    if (currentRow > 0){
      checkGameState();
    }
  }, [currentRow])

  const checkGameState = () => {
    if(checkIfWon()){
      Alert.alert("ESSSSSSA");
      setGamesState('won');
    } else if(checkIfLost()){
      Alert.alert("BRAK ESSY")
      setGamesState('lost');
    }
  }

  const checkIfWon = () => {
    const newRow = row[currentRow - 1];
    console.log("NEW ROW: ", newRow)
    return newRow.toLowerCase() == countryToGuess.toLowerCase()
  }

  const checkIfLost = () => {
    return currentRow == row.length;
  }

  const onKeyPressed = (key) => {
    if(gameState != 'playing'){
      return;
    }
    const tempRow = copyArray(row);
    console.log(tempRow);
    if (key == 'CLEAR'){
      tempRow[currentRow] = tempRow[currentRow].slice(0, -1)
    }else if(key == 'ENTER'){
      setCurrentRow(currentRow + 1);
    }else{
      tempRow[currentRow] = tempRow[currentRow] + key.toUpperCase();
    }
    setRow(tempRow);
  }
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Wordle</Text>

      <View style={styles.mapContainer} >
        <Image source={require('./assets/countriesMaps/AF-EPS-01-0001.png')} style={styles.map}></Image>
      </View>

      <View style={styles.answersContainer}>
        <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[0]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[1]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[2]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[3]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[4]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[5]}</Text>
        </View>
      </View>

      <Keyboard onKeyPressed={onKeyPressed}/>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c044d',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    alignItems: 'center',
    letterSpacing: 7
  },
  mapContainer: {
    marginTop: 50,
    width: 300,
    height: 225,
    backgroundColor: 'red',
  },
  map: {
    flex: 1,
    height: undefined,
    width: undefined
  },
  answer: {
    paddingLeft: 10,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 20
  },
  answersContainer: {
    marginTop: 30,
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: '#0c044d',
  },
  asnwerView: {
    height: 25,
    margin: 5,
    backgroundColor: '#738a94',
  }
});
