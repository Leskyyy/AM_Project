import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View, Image, Dimensions, PixelRatio, Alert, PanResponder, MaskedViewBase } from 'react-native';
import Keyboard from './src/components/Keyboard'
import { useEffect, useState } from 'react';
import { colors } from './src/constants';

const NUMBER_OF_TRIES = 6;

const copyArray = (arr) => {
  return [...arr]
}

function getRandomCountry() {
  let names = fetch('https://restcountries.com/v3.1/all', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then((response) => response.json())
  .then((data) => {
    var randomnumber = Math.floor(Math.random() * (250 - 0 + 1)) + 0;
    const names = data.map(country => country.name.common)
    return names[randomnumber];
    
  })
  .catch((error) => {
    console.error('Error:', error);
  });
  return names;
}


export default function App() {

  const [row, setRow] = useState(new Array(NUMBER_OF_TRIES).fill(''));
  const [distance, setDistance] = useState(new Array(NUMBER_OF_TRIES).fill(''))
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGamesState] = useState('playing');
  const [targetCountry, setTargetCountry] = useState('');
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    getRandomCountry().then(response => {
      setTargetCountry(response)
      // let path = require('./assets/countriesMaps/' + response.toLowerCase().replace(/\s/g, '').toString() + '.png');
      // setCurrentPath(path);
      console.log(response);
      // console.log(currentPath);
    }).catch(error => console.log(error))
  },[]);

  useEffect(() => {
    if (currentRow > 0){
      checkGameState();
      calculateDistance();
    }
  }, [currentRow])

  const calcDistBetweenTwoPoints = (source, target) => {
    console.log("Obliczam odlegosc pomiedzy " + source + ' a ' + target);
    return 50;
  }

  const calculateDistance = () => {
    const tempRow = copyArray(row);
    const tempDistances = copyArray(distance);
    console.log('to niezly current distance', tempDistances);
    console.log('to niezly current row: ', tempRow);
    let dist = calcDistBetweenTwoPoints(tempRow[currentRow - 1], targetCountry);
    tempDistances[currentRow - 1] = dist.toString();
    setDistance(tempDistances)
  }

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
    return newRow.replace(/\s/g, '').toLowerCase() == targetCountry.toLowerCase()
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
    }else if(key == '␣'){
      tempRow[currentRow] = tempRow[currentRow] + ' ';
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
        <Image source={require('./assets/countriesMaps/afghanistan.png')} style={styles.map}></Image>
      </View>

      <View style={styles.answersContainer}>
        <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[0]}</Text>
            <Text style={styles.distance} >{distance[0]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[1]}</Text>
            <Text style={styles.distance} >{distance[1]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[2]}</Text>
            <Text style={styles.distance} >12222 NE</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[3]}</Text>
            <Text style={styles.distance} >12222 NE</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[4]}</Text>
            <Text style={styles.distance} >12222 NE</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[5]}</Text>
            <Text style={styles.distance} >12222 NE</Text>
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
    fontSize: 19
  },
  answersContainer: {
    marginTop: 30,
    width: Dimensions.get('window').width * 0.9,
    backgroundColor: '#0c044d',
  },
  asnwerView: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 25,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#738a94',
  },
  distance: {
    marginLeft: 20,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 19,
    paddingRight: 10
  }
});
