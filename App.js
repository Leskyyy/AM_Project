import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View, Image, Dimensions, PixelRatio, Alert, PanResponder, MaskedViewBase, Button, Pressable } from 'react-native';
import Keyboard from './src/components/Keyboard'
import { useEffect, useState } from 'react';
import { colors } from './src/constants';

const NUMBER_OF_TRIES = 6;

const copyArray = (arr) => {
  return [...arr]
}

export default function App() {

  const [row, setRow] = useState(new Array(NUMBER_OF_TRIES).fill(''));
  const [distance, setDistance] = useState(new Array(NUMBER_OF_TRIES).fill(''))
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGamesState] = useState('playing');
  const [targetCountry, setTargetCountry] = useState('');
  const [currentPath, setCurrentPath] = useState('')

  var routes = require("./assets/remove_bg");

  function getRandomProperty(obj) {
    const keys = Object.keys(obj);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  useEffect(() => {
      let randomCountry = getRandomProperty(routes);
      console.log('Random country: ' + randomCountry);
      setCurrentPath(routes[randomCountry]);
      setTargetCountry(randomCountry);
  },[])

  useEffect(() => {
    if (currentRow > 0){
      checkGameState();
      calculateDistance();
    }
  }, [currentRow]);


  function resetGame(){
    setRow(new Array(NUMBER_OF_TRIES).fill(''));
    setDistance(new Array(NUMBER_OF_TRIES).fill(''));
    setCurrentRow(0);
    setGamesState('playing');

    let randomCountry = getRandomProperty(routes);
    console.log('Random country: ' + randomCountry);
    setCurrentPath(routes[randomCountry]);
    setTargetCountry(randomCountry);
  }

  const Direction = {
    North : 'N',
    South : 'S',
    East : 'E',
    West : 'W',
    Northeast : 'NE',
    Northwest : 'NW',
    Southeast : 'SE',
    Southwest : 'SW',
    Underfined : 'Undefined'
  }
  
  function my_function(point_start, point_end) {
  
    let tan_Pi_div_8 = Math.sqrt(2.0) - 1.0;
  
    let dx = point_end.X - point_start.X;
    let dy = point_end.Y - point_start.Y;
  
    if(Math.abs(dx) > Math.abs(dy)){
      if(Math.abs(dy / dx) <= tan_Pi_div_8){
        return dx > 0 ? Direction.East : Direction.West;
      }else if(dx > 0){
        return dy > 0 ? Direction.Northeast : Direction.Southeast;
      }else{
        return dy > 0 ? Direction.Northwest : Direction.Southwest;
      }
    }
    else if (Math.abs(dy) > 0)
      {
        if (Math.abs(dx / dy) <= tan_Pi_div_8)
        {
          return dy > 0 ? Direction.North : Direction.South;
        }
        else if (dy > 0)
        {
          return dx > 0 ? Direction.Northeast : Direction.Northwest;
        }
        else 
        {
          return dx > 0 ? Direction.Southeast : Direction.Southwest;
        }
      }
      else 
      {
        return Direction.Underfined;
      }
  }

  async function calcDistBetweenTwoPoints(source, target) {
    const response = await fetch('https://www.dystans.org/route.json?stops=' + source + '|' + target);
    try {
      const data = await response.json();
      console.log('The distance between ' + source + ' and ' + target + ' is ' + data.distance);
      console.log('First country latitude: ', data.stops[0].latitude)
      let source_country = {
        Y: data.stops[0].latitude,
        X: data.stops[0].longitude
      }
      let target_country = {
        Y: data.stops[1].latitude,
        X: data.stops[1].longitude
      }
      return [data.distance, source_country, target_country];
    } catch (err) {
      console.log(err);
    }
}

  const calculateDistance = async() => {
    const tempRow = copyArray(row);
    const tempDistances = copyArray(distance);
    console.log('to niezly current distance', tempDistances);
    console.log('to niezly current row: ', tempRow);
    let data = await calcDistBetweenTwoPoints(tempRow[currentRow - 1], targetCountry);
    console.log(data)
    if(data[0].toString() == '0'){
      tempDistances[currentRow - 1] = 'YOU WON!';
    }else{
      tempDistances[currentRow - 1] = data[0].toString() + ' ' + my_function(data[1], data[2]).toString();
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>GUESS</Text>
        {gameState != 'playing' && <Pressable style={styles.button} onPress={resetGame}>
          <Text style={styles.text}>Reset</Text>
        </Pressable>}
      </View>

      <View style={styles.mapContainer} >
        <Image source={currentPath} style={styles.map}></Image>
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
            <Text style={styles.distance} >{distance[2]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[3]}</Text>
            <Text style={styles.distance} >{distance[3]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[4]}</Text>
            <Text style={styles.distance} >{distance[4]}</Text>
          </View>
          <View style={styles.asnwerView} >
            <Text style={styles.answer} >{row[5]}</Text>
            <Text style={styles.distance} >{distance[5]}</Text>
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
    marginTop: 30,
    width: 300,
    height: 225,
    backgroundColor: '#0c044d',
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
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'black',
    marginTop: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-start',
  }
});
