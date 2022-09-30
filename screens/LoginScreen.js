import { Alert, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import { useNavigation } from '@react-navigation/core'
import * as Network from 'expo-network';

const alertWithoutButtons = () => {
    const title = 'Error';
    const message = 'Turn on internet in order to use the app';
    const emptyArrayButtons = [];
    const alertOptions = {
      cancelable: false,
    };

    Alert.alert(title, message, emptyArrayButtons, alertOptions);
};

const ipAlert = async () => {
    const ip = await Network.getNetworkStateAsync()
    if(ip["isConnected"] == true){
        console.log("Your phone is connected");
    }else{
        console.log("Your phone is not connected");
        alertWithoutButtons();
    }
  };

const LoginScreen = () => {
    ipAlert();
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const navigation = useNavigation()

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                console.log('user logged in')
                navigation.replace('Home')
            } else {
                console.log('user not logged in')
            }
        })
        return unsubscribe
    } , [])

    const handleSignUp = () => {
        auth
            .createUserWithEmailAndPassword(email, password)
            .then(userCredentials => {
                const user = userCredentials.user;
                console.log('Registered in with:', user.email);

            })
            .catch(error => alert(error.message))
    }

    const handleLogin = () => {
        auth
            .signInWithEmailAndPassword(email, password)
            .then(userCredentials => {
                const user = userCredentials.user;
                console.log('Logged in with:', user.email);
            })
            .catch(error => alert(error.message))
    }
  
  return (
    <View
    style={styles.container}
    behavior="padding">
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={text => setEmail(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={text => setPassword(text)}
          style={styles.input}
          secureTextEntry
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
        onPress={handleLogin}
        style={styles.button}
        >
            <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
        onPress={handleSignUp}
        style={[styles.button, styles.buttonOutline]}
        >
            <Text style={styles.buttonOutlineText}>Register</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        width: '80%'
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 5
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40
    },
    button: {
        backgroundColor: '#0782F9',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        marginTop: 5
    },
    buttonOutline: {
        backgroundColor: 'white',
        marginTop: 5,
        borderColor: '#0782F9',
        borderWidth: 2
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        textAlign: 'center'
    },
    buttonOutlineText: {
        color: '#0782F9',
        fontWeight: '700',
        fontSize: 16,
        textAlign: 'center'
    }

})