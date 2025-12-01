import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

export default function HydroQuebecScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = () => {
    // Simulation feedback
    Alert.alert(
      "Simulation Paused",
      "In a real scam, clicking 'Log in' on a fake site sends your password directly to the scammer. Always check the website URL (address bar) before entering credentials.",
      [{ text: "Back to Home", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header / Logo Area */}
      <View style={styles.header}>
        {/* Text representation of the logo */}
        <Ionicons name="menu" size={32} color="#1224B8" />
        <Image 
          source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1DzUgokJvoOc3IMBB2eb2P_dOviwSY5AOCQ&s' }}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* Invisible View on the Right (same width as icon) to balance layout */}
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        {/* New Information Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#1224B8" />
          <Text style={styles.infoText}>
            We have updated the login interface to improve your online experience.
          </Text>
        </View>
        <Text style={styles.title}>Connect to Your Customer Space</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Forgot your password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
            <Text style={styles.orText}>or </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Create my Hydro-Québec login</Text>
            </TouchableOpacity>
        </View>
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Hydro-Quebec',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey',
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 32,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#005F9E', // Official-looking Hydro Blue
    fontStyle: 'italic',
  },
  content: {
    padding: 24,
  },
    infoBox: {
    backgroundColor: '#E8F0FE', // Very light blue background
    padding: 10,
    borderRadius: 8,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start', // Aligns icon with top line of text
    borderWidth: 2,
    borderColor: '#1224B8'
  },
  infoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161616', // Dark blue text
    marginLeft: 12,
    flex: 1, // Ensures text wraps properly
    lineHeight: 22,
    fontFamily: 'OpenSans',
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: 'black',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
  },
  loginButton: {
    backgroundColor: '#1224B8', // Hydro Blue
    paddingVertical: 21,
    borderRadius: 26,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,

  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Arial'
  },
  linkButton: {
    marginBottom: 16,
  },
  signupRow: {
    flexDirection: 'row', // This aligns items horizontally
    alignItems: 'center',
    marginBottom: 16,
  },
  orText: {
    fontSize: 16,
    color: '#000',
    marginRight: 6, // Adds space between "or" and the link
  },
  linkText: {
    color: '#1224B8',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  educationBanner: {
    backgroundColor: '#FFF3CD', // Yellow warning background
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEEBA',
  },
  educationText: {
    color: '#856404', // Dark yellow/brown text
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});