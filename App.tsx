import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import PhoneScreen from './src/screens/PhoneScreen';
import GmailScreen from './src/screens/GmailScreen';
import MessageScreen from './src/screens/MessageScreen';
import HydroQuebecScreen from './src/screens/HydroQuebec';
import CanadaPostPaymentScreen from './src/screens/CanadaPostPaymentScreen';
import TDBankScreen from './src/screens/TDBankScreen';
import LotoQuebecScreen from './src/screens/LotoQuebecScreen';

export type RootStackParamList = {
  Home: undefined;
  Phone: undefined;
  Gmail: { scenario?: string; mode?: 'practice' | 'guide' } | undefined;
  Message: { scenario?: string; mode?: 'practice' | 'guide' } | undefined;
  HydroQuebec: { mode?: 'practice' | 'guide' } | undefined;
  CanadaPostPayment: { mode?: 'practice' | 'guide' } | undefined;
  TDBank: { mode?: 'practice' | 'guide' } | undefined;
  LotoQuebec: { mode?: 'practice' | 'guide' } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Scam Prevention', headerShown: false }} 
        />
        <Stack.Screen 
          name="Phone" 
          component={PhoneScreen} 
          options={{ title: 'Phone Call', headerShown: false }} 
        />
        <Stack.Screen 
          name="Gmail" 
          component={GmailScreen} 
          options={{ title: 'Gmail', headerShown: false }} 
        />
        <Stack.Screen 
          name="Message" 
          component={MessageScreen} 
          options={{ title: 'Messages', headerShown: false }} 
        />
        <Stack.Screen 
          name="HydroQuebec" 
          component={HydroQuebecScreen} 
          options={{ title: 'Website Simulation' }} 
        />
        <Stack.Screen 
          name="CanadaPostPayment" 
          component={CanadaPostPaymentScreen} 
          options={{ title: 'Canada Post Payment', headerShown: false }} 
        />
        <Stack.Screen 
          name="TDBank" 
          component={TDBankScreen} 
          options={{ title: 'TD Bank Security', headerShown: false }} 
        />
        <Stack.Screen 
          name="LotoQuebec" 
          component={LotoQuebecScreen} 
          options={{ title: 'Loto-Québec', headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
