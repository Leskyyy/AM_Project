import * as React from 'react';
import MapView from 'react-native-maps';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
// import { useNavigation } from '@react-navigation/core'
import { useRoute } from '@react-navigation/native'

export default function MapScreen() {
  // const navigation = useNavigation()
  const route = useRoute();
  // console.log('current coordinates [MapScreen]:', navigation.latitude, navigation.longitude);

  // const [region, setRegion] = React.useState({
  //   latitude: 51.5079145,
  //   longitude: -0.0899163,
  //   latitudeDelta: 0.01,
  //   longitudeDelta: 0.01,
  //   latitude: 37.78825,
  //     longitude: -122.4324,
  //     latitudeDelta: 0.0922,
  //     longitudeDelta: 0.0421,
  // });


  const initial_region = {
    // latitude: 51.5079145,
    // longitude: -0.0899163,
    // latitudeDelta: 0.01,
    // longitudeDelta: 0.01,
    latitude: route.params.latitude,
    longitude: route.params.longitude,
    // latitude: 53.042,
    // longitude: 16.4624,
    latitudeDelta: 5,
    longitudeDelta: 5,
  }
  
  // function onRegionChange(region) {
  //   setState({ region });
  // }
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={initial_region} //{state.region}
        // onRegionChange={onRegionChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});