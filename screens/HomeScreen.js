import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View, Image, Dimensions, PixelRatio, Alert, PanResponder, MaskedViewBase, Button, Pressable, TouchableOpacity } from 'react-native';
import Keyboard from '../src/components/Keyboard'
import { useEffect, useState } from 'react';
import 'expo-dev-client';
import { auth } from '../firebase'
import { useNavigation } from '@react-navigation/core'
import * as SQLite from 'expo-sqlite';
import { openDatabase } from 'expo-sqlite';


const NUMBER_OF_TRIES = 6;

const copyArray = (arr) => {
  return [...arr]
}

export default function HomeScreen() {

  const navigation = useNavigation()

  const handleSignOut = () => {
      auth
        .signOut()
        .then(() => {
            navigation.replace('Login')
        })
        .catch(error => alert(error.message))
  }

  const navigateToMap = () => {
    navigation
      .navigate('Map', {latitude: currentLatitude, longitude: currentLongitude})
  }

  const [row, setRow] = useState(new Array(NUMBER_OF_TRIES).fill(''))
  const [distance, setDistance] = useState(new Array(NUMBER_OF_TRIES).fill(''))
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGamesState] = useState('playing')
  const [targetCountry, setTargetCountry] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [currentLatitude, setCurrentLatitude] = useState(0)
  const [currentLongitude, setCurrentLongitude] = useState(0)
  const [streaks, setStreaks] = useState(null);

  var routes = require("../assets/remove_bg");
  // console.log(routes);

  function getRandomProperty(obj) {
    const keys = Object.keys(obj);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  useEffect(() => {
      let randomCountry = getRandomProperty(routes);
      console.log('Target country: ' + randomCountry);
      setCurrentPath(routes[randomCountry]);
      setTargetCountry(randomCountry);
  },[])

  useEffect(() => {
    if (currentRow > 0){
      checkGameState();
      calculateDistance();
    }
  }, [currentRow]);

  function connectToDB() {
    const db = SQLite.openDatabase('db.db');
    
    console.log('connected to db')
    return db;
  }
  
  function createTable(db) {
    return new Promise((resolve, reject) => {
      db.transaction(
          function (tx) {
              tx.executeSql(" CREATE TABLE IF NOT EXISTS `streaks` (`username` VARCHAR(255),`streak` INT);");
          },
          function (error) {
              reject(error.message);
          },
          function () {
              resolve(true);
              console.log('Created database OK');
          }
    );
  });
  }
  
  function insertNewUser(db, username) {
    return new Promise((resolve, reject) => {
      db.transaction(
          function (tx) {
              tx.executeSql("INSERT INTO streaks VALUES ('" + username + "', 0)"),
              [username];
          },
          function (error) {
              reject(error.message);
          },
          function () {
              resolve(true);
              console.log('Inserted new user');
          }
    );
  });
  }

  function increaseUserStreak(db, username) {
    return new Promise((resolve, reject) => {
      db.transaction(
          function (tx) {
              tx.executeSql("UPDATE streaks set streak = streak + 1 where username='" + username + "'"),
              [username];
          },
          function (error) {
              reject(error.message);
          },
          function () {
              resolve(true);
              console.log('Increased user streak');
          }
    );
  });
  }

  function decreaseUserStreak(db, username) {
    return new Promise((resolve, reject) => {
      db.transaction(
          function (tx) {
              tx.executeSql("UPDATE streaks set streak = 0 where username='" + username + "'"),
              [username];
          },
          function (error) {
              reject(error.message);
          },
          function () {
              resolve(true);
              console.log('Decreased user streak');
          }
    );
  });
  }
  
  function fetchUserData(db, name) {
    return new Promise((resolve, reject) => {
      db.transaction(
          function (tx) {
              tx.executeSql(
                  'SELECT * FROM streaks WHERE username=?;',
                  [name],
                  function (tx, resultSet) {
                      let data = [];
                      for (let i = 0, c = resultSet.rows.length;i < c;i++) {
                          data.push(resultSet.rows.item(i));
                      }
                      console.log('Retrieved data: ', data)
                      resolve(data);
                  },
                  function (tx, error) {
                      reject(error.message);
                  }
              );
          },
          function (error) {
              reject(error.message);
          }
      );
  });
  }


  function resetGame(){
    setRow(new Array(NUMBER_OF_TRIES).fill(''));
    setDistance(new Array(NUMBER_OF_TRIES).fill(''));
    setCurrentRow(0);
    setGamesState('playing');

    let randomCountry = getRandomProperty(routes);
    console.log('Target country: ' + randomCountry);
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
    Undefined : 'N/A'
  }
  
  function calculateDirection(point_start, point_end) {
  
    let tan_Pi_div_8 = Math.sqrt(2.0) - 1.0;
  
    let dx = point_end.X - point_start.X;
    let dy = point_end.Y - point_start.Y;
  
    if(Math.abs(dx) > Math.abs(dy)){
      if(Math.abs(dy / dx) <= tan_Pi_div_8){
        return dx > 0 ? Direction.East : Direction.West;
      } else if(dx > 0){
        return dy > 0 ? Direction.Northeast : Direction.Southeast;
      } else {
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
        return Direction.Undefined;
      }
  }

  async function calcDistBetweenTwoPoints(source, target) {
    source = source.replace(/\s/g, '').toLowerCase()
    target = target.replace(/\s/g, '').toLowerCase()
    
    // mappings = {
    //   'americansamoa': 'american%20samoa',
    //   'antiguaandbarbuda': 'antigua%20and%20barbuda',
    //   'bosniandherzegovina': 'bosnia%20and%20herzegovina',
    //   'britishvirginislands': 'british%20virgin%20islands',
    //   'britishindianoceanterritory': 'british%20indian%20ocean%20territory',
    //   'capeverde': 'cape%20verde',
    //   'burkinafaso': 'burkina%20faso',
    //   'caymanislands': 'cayman%20islands',
    //   'centralafricanrepublic': 'central%20african%20republic',
    //   'democraticrepublicofthecongo': 'democratic%20republic%20of%20the%20congo',
    //   'republicofthecongo': 'republika%20kongo',
    //   'czechrepublic': 'czech%20republic',
    //   'easttimor': 'east%20timor',
    //   'equatorialguinea': 'equatorial%20guinea',
    //   'frenchpolynesia': 'french%20polynesia',
      
    // }

    if(source === 'americansamoa') {
      source = 'american%20samoa';
    } else if(source === 'antiguaandbarbuda') {
      source = 'antigua%20and%20barbuda';
    } else if(source === 'bosniaandherzegovina') {
      source = 'bosnia%20and%20herzegovina';
    } else if(source === 'britishindianoceanterritory') {
      source = 'british%20indian%20ocean%20territory';
    } else if(source === 'britishvirginislands') {
      source = 'british%20virgin%20islands';
    } else if(source === 'capeverde') {
      source = 'cape%20verde';
    } else if(source === 'burkinafaso') {
      source = 'burkina%20faso';
    } else if(source === 'caymanislands') {
      source = 'cayman%20islands';
    } else if(source === 'centralafricanrepublic') {
      source = 'central%20african%20republic';
    } else if(source === 'democraticrepublicofthecongo') {
      source = 'democratic%20republic%20of%20the%20congo';
    } else if(source === 'republicofthecongo') {
      source = 'republika%20kongo';
    } else if(source === 'cookislands') {
      source = 'cook%20islands';
    } else if(source === 'cotedivoire') {
      source = 'wybrzeże%20kości%20słoniowej';
    } else if(source === 'czechrepublic') {
      source = 'republika%20czeska';
    } else if(source === 'equatorialguinea') {
      source = 'gwinea%20równikowa';
    } else if(source === 'falklandislands') {
      source = 'falklandy';
    } else if(source === 'frenchguiana') {
      source = 'guyana%20francuska';
    } else if(source === 'frenchpolynesia') {
      source = 'polinezja%20francuska';
    } else if(source === 'frenchsouthernterritories') {
      source = 'francuskie%20terytoria%20południowe';
    } else if(source === 'heardislandandmcdonaldislands') {
      source = 'heard%20island%20and%20mcdonald%20islands';
    } else if(source === 'centralafricanrepublic') {
      source = 'central%20african%20republic';
    } else if(source === 'dominicanrepublic') {
      source = 'dominican%20republic';
    } else if(source === 'easttimor') {
      source = 'east%20timor';
    } else if(source === 'federatedstatesofmicronesia') {
      source = 'federated%20states%20of%20micronesia';
    } else if(source === 'unitedarabemirates') {
      source = 'united%20arab%20emirates';
    } else if(source === 'unitedkingdom') {
      source = 'united%20kingdom';
    } else if(source === 'unitedstatesofamerica') {
      source = 'united%20states%20of%20america';
    } else if(source === 'wallisandfutunaislands') {
      source = 'wallis%20and%20futuna';
    } else if(source === 'westernsahara') {
      source = 'western%20sahara';
    } else if(source === 'turksandcaicosislands') {
      source = 'turks%20and%20caicosis%20lands';
    } else if(source === 'usvirginislands') {
      source = 'virgin%20islands';
    } else if(source === 'trinidadandtobago') {
      source = 'trinidad%20and%20tobago';
    } else if(source === 'greatbritain') {
      source = 'united%20kingdom';
    } else if(source === 'ivorycoast') {
      source = 'wybrzeże%20kości%20słoniowej';
    } else if(source === 'southkorea') {
      source = 'korea%20południowa';
    } else if(source === 'northkorea') {
      source = 'korea%20północna';
    } else if(source === 'southsudan') {
      source = 'południowy%20sudan';
    } else if(source === 'saintkittsandnevis') {
      source = 'saint%20kitts%20and%20nevis';
    } else if(source === 'saintlucia') {
      source = 'saint%20lucia';
    } else if(source === 'saintpierreandmiquelon') {
      source = 'saint%20pierre%20and%20miquelon';
    } else if(source === 'saintvincentandthegrenadines') {
      source = 'saint%20vincent%20and%20the%20grenadines';
    } else if(source === 'sainthelena') {
      source = 'saint%20helena';
    } else if(source === 'saintmartin') {
      source = 'saint%20martin';
    } else if(source === 'saintbarthelemy') {
      source = 'saint%20barthelemy';
    } else if(source === 'saotomeandprincipe') {
      source = 'sao%20tome%20and%20principe';
    } else if(source === 'solomonislands') {
      source = 'solomon%20islands';
    } else if(source === 'svalbardandjanmayen') {
      source = 'svalbard%20and%20jan%20mayen';
    } else if(source === 'sierraleone') {
      source = 'sierra%20leone';
    } else if(source === 'sintmaarten') {
      source = 'sint%20maarten';
    }

    if(target === 'americansamoa') {
      target = 'american%20samoa';
    } else if(target === 'antiguaandbarbuda') {
      target = 'antigua%20and%20barbuda';
    } else if(target === 'bosniaandherzegovina') {
      target = 'bosnia%20and%20herzegovina';
    } else if(target === 'britishindianoceanterritory') {
      target = 'british%20indian%20ocean%20territory';
    } else if(target === 'britishvirginislands') {
      target = 'british%20virgin%20islands';
    } else if(target === 'capeverde') {
      target = 'cape%20verde';
    } else if(target === 'burkinafaso') {
      target = 'burkina%20faso';
    } else if(target === 'caymanislands') {
      target = 'cayman%20islands';
    } else if(target === 'centralafricanrepublic') {
      target = 'central%20african%20republic';
    } else if(target === 'democraticrepublicofthecongo') {
      target = 'democratic%20republic%20of%20the%20congo';
    } else if(target === 'republicofthecongo') {
      target = 'republika%20kongo';
    } else if(target === 'cookislands') {
      target = 'cook%20islands';
    } else if(target === 'cotedivoire') {
      target = 'wybrzeże%20kości%20słoniowej';
    } else if(target === 'czechrepublic') {
      target = 'republika%20czeska';
    } else if(target === 'equatorialguinea') {
      target = 'gwinea%20równikowa';
    } else if(target === 'falklandislands') {
      target = 'falklandy';
    } else if(target === 'frenchguiana') {
      target = 'guyana%20francuska';
    } else if(target === 'frenchpolynesia') {
      target = 'polinezja%20francuska';
    } else if(target === 'frenchsouthernterritories') {
      target = 'francuskie%20terytoria%20południowe';
    } else if(target === 'heardislandandmcdonaldislands') {
      target = 'heard%20island%20and%20mcdonald%20islands';
    } else if(target === 'centralafricanrepublic') {
      target = 'central%20african%20republic';
    } else if(target === 'dominicanrepublic') {
      target = 'dominican%20republic';
    } else if(target === 'easttimor') {
      target = 'east%20timor';
    } else if(target === 'federatedstatesofmicronesia') {
      target = 'federated%20states%20of%20micronesia';
    } else if(target === 'unitedarabemirates') {
      target = 'united%20arab%20emirates';
    } else if(target === 'unitedkingdom') {
      target = 'united%20kingdom';
    } else if(target === 'unitedstatesofamerica') {
      target = 'united%20states%20of%20america';
    } else if(target === 'wallisandfutunaislands') {
      target = 'wallis%20and%20futuna';
    } else if(target === 'westernsahara') {
      target = 'western%20sahara';
    } else if(target === 'turksandcaicosislands') {
      target = 'turks%20and%20caicosis%20lands';
    } else if(target === 'usvirginislands') {
      target = 'virgin%20islands';
    } else if(target === 'trinidadandtobago') {
      target = 'trinidad%20and%20tobago';
    } else if(target === 'greatbritain') {
      target = 'united%20kingdom';
    } else if(target === 'ivorycoast') {
      target = 'wybrzeże%20kości%20słoniowej';
    } else if(target === 'southkorea') {
      target = 'korea%20południowa';
    } else if(target === 'northkorea') {
      target = 'korea%20północna';
    } else if(target === 'southsudan') {
      target = 'południowy%20sudan';
    } else if(target === 'saintkittsandnevis') {
      target = 'saint%20kitts%20and%20nevis';
    } else if(target === 'saintlucia') {
      target = 'saint%20lucia';
    } else if(target === 'saintpierreandmiquelon') {
      target = 'saint%20pierre%20and%20miquelon';
    } else if(target === 'saintvincentandthegrenadines') {
      target = 'saint%20vincent%20and%20the%20grenadines';
    } else if(target === 'sainthelena') {
      target = 'saint%20helena';
    } else if(target === 'saintmartin') {
      target = 'saint%20martin';
    } else if(target === 'saintbarthelemy') {
      target = 'saint%20barthelemy';
    } else if(target === 'saotomeandprincipe') {
      target = 'sao%20tome%20and%20principe';
    } else if(target === 'solomonislands') {
      target = 'solomon%20islands';
    } else if(target === 'svalbardandjanmayen') {
      target = 'svalbard%20and%20jan%20mayen';
    } else if(target === 'sierraleone') {
      target = 'sierra%20leone';
    } else if(target === 'sintmaarten') {
      target = 'sint%20maarten';
    }
    
    let guess = false;
    if (source === target) {
      guess = true;
    }
    
    const response = await fetch('https://www.dystans.org/route.json?stops=' + source + '|' + target);
    try {
      const data = await response.json();
      console.log('The distance between ' + source + ' and ' + target + ' is ' + data.distance);
      // console.log('First country latitude: ', data.stops[0].latitude)
      let source_country = {
        Y: data.stops[0].latitude,
        X: data.stops[0].longitude
      }
      let target_country = {
        Y: data.stops[1].latitude,
        X: data.stops[1].longitude
      }

      setCurrentLatitude(data.stops[1].latitude);
      setCurrentLongitude(data.stops[1].longitude);
      console.log('current coordinates [HomeScreen]:', currentLatitude, currentLongitude);

      return [data.distance, source_country, target_country, guess];
    } catch (err) {
      console.log("calcDistBetweenTwoPoints error:", err);
    }
}

  const calculateDistance = async() => {
    const tempRow = copyArray(row);
    const tempDistances = copyArray(distance);
    // console.log('Current distances array:', tempDistances);
    // console.log('Current row array: ', tempRow);
    if(Object.keys(routes).includes(tempRow[currentRow - 1].replace(/\s/g, '').toLowerCase())){
      let data = await calcDistBetweenTwoPoints(tempRow[currentRow - 1], targetCountry);
      console.log('Distance:', data[0], 'Guess:', data[3]);
      if(data[0].toString() == '0' && data[3] == true) {
        tempDistances[currentRow - 1] = 'YOU WON!';
      } else {
        tempDistances[currentRow - 1] = data[0].toString() + ' KM, ' + calculateDirection(data[1], data[2]).toString();
      }
      setDistance(tempDistances)
    } else {
      Alert.alert('Invalid country name.');
    }
    
  }

  const checkGameState = () => {
    let db = connectToDB();
    createTable(db);
    console.log('Your name: ', auth.currentUser.email)
    if(checkIfWon()){
      setGamesState('won');
      // let mydata = fetchUserData(db, auth.currentUser.email)

      fetchUserData(db, auth.currentUser.email)
      .then((response) => {
        if(response.length == 0){
          console.log('Thats a new user, inserting into database');
          insertNewUser(db, auth.currentUser.email).then( function() {
            fetchUserData(db, auth.currentUser.email)
            .then((response) => {
              console.log('Checking if inserted: ', response);
            })
            .catch((err) => {
              console.log(err);
            });
          });
        }

        increaseUserStreak(db, auth.currentUser.email)
        .then((response) => {
          fetchUserData(db, auth.currentUser.email)
          .then((response) => {
            console.log('Checking if updated: ', response[0]["streak"]);
            Alert.alert("Congratulations, you won! The target country was " + targetCountry.slice(0, 1).toUpperCase() + targetCountry.slice(1) + ". Your current streak is equal to " + response[0]["streak"]);

          })
          .catch((err) => {
            console.log(err);
          });
        })
      })
      .catch((err) => {
        console.log(err);
      });
    } else if(checkIfLost()){
      setGamesState('lost');
      fetchUserData(db, auth.currentUser.email)
      .then((response) => {
        if(response.length == 0){
          console.log('Thats a new user, inserting into database');
          insertNewUser(db, auth.currentUser.email).then( function() {
            fetchUserData(db, auth.currentUser.email)
            .then((response) => {
              console.log('Checking if inserted: ', response);
            })
            .catch((err) => {
              console.log(err);
            });
          });
        }

        decreaseUserStreak(db, auth.currentUser.email)
        .then((response) => {
          fetchUserData(db, auth.currentUser.email)
          .then((response) => {
            console.log('Checking if updated: ', response[0]["streak"]);
            Alert.alert("You lost! The target country was " + targetCountry.slice(0, 1).toUpperCase() + targetCountry.slice(1) + '. Your streak has been cleared.');

          })
          .catch((err) => {
            console.log(err);
          });
        })
      })
      .catch((err) => {
        console.log(err);
      });
    }
  }

  const checkIfWon = () => {
    const newRow = row[currentRow - 1];
    console.log("player typed:", newRow.replace(/\s/g, '').toLowerCase())
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
    if (key == 'CLEAR'){
      tempRow[currentRow] = tempRow[currentRow].slice(0, -1)
    } else if(key == 'ENTER') {
      setCurrentRow(currentRow + 1);
    } else if(key == '␣') {
      tempRow[currentRow] = tempRow[currentRow] + ' ';
    } else {
      tempRow[currentRow] = tempRow[currentRow] + key.toUpperCase();
    }
    setRow(tempRow);
  }

  return (
    <View style={styles.container}>
      {/* <StatusBar style="light" /> */}
      <View style={styles.header}>
        <Text style={styles.title}>Worldle</Text>
      </View>

      <View style={styles.mapContainer} >
        <Image source={currentPath} style={styles.map}></Image>
      </View>

      <View style={styles.answersContainer}>
        <View style={styles.answerView} >
            <Text style={styles.answer} >{row[0]}</Text>
            <Text style={styles.distance} >{distance[0]}</Text>
          </View>
          <View style={styles.answerView} >
            <Text style={styles.answer} >{row[1]}</Text>
            <Text style={styles.distance} >{distance[1]}</Text>
          </View>
          <View style={styles.answerView} >
            <Text style={styles.answer} >{row[2]}</Text>
            <Text style={styles.distance} >{distance[2]}</Text>
          </View>
          <View style={styles.answerView} >
            <Text style={styles.answer} >{row[3]}</Text>
            <Text style={styles.distance} >{distance[3]}</Text>
          </View>
          <View style={styles.answerView} >
            <Text style={styles.answer} >{row[4]}</Text>
            <Text style={styles.distance} >{distance[4]}</Text>
          </View>
          <View style={styles.answerView} >
            <Text style={styles.answer} >{row[5]}</Text>
            <Text style={styles.distance} >{distance[5]}</Text>
        </View>
      </View>

      {gameState != 'playing' && <Pressable style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>}

      <View style={styles.navigationButtonsContainer}>
        {gameState != 'playing' && <TouchableOpacity style={styles.button} onPress={navigateToMap}>
          <Text style={styles.buttonText}>Open map</Text>
        </TouchableOpacity>}

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Keyboard style={styles.keyboard} onKeyPressed={onKeyPressed}/>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04293A',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    alignItems: 'center',
    letterSpacing: 7
  },
  mapContainer: {
    marginTop: 10,
    width: 300,
    height: 200,
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
    marginBottom: 30
  },
  answerView: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 25,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#738a94',
    borderRadius: 10,
  },
  distance: {
    marginLeft: 20,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 19,
    paddingRight: 10
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: 'white',
    width: Dimensions.get('window').width * 0.5,
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
  },
  keyboard: {
    marginBottom: 20,
  },
  resetText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'black',
  },
  button: {
    backgroundColor: '#0782F9',
    padding: 7,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 10,
  },
  buttonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16
  },
  navigationButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 175,
  }
});
