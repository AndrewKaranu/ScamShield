import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import PhoneScreen from './src/screens/PhoneScreen';
import ScamCallScreen from './src/screens/ScamCallScreen';
import GmailScreen from './src/screens/GmailScreen';
import MessageScreen from './src/screens/MessageScreen';
import HydroQuebecScreen from './src/screens/HydroQuebec';
import CanadaPostPaymentScreen from './src/screens/CanadaPostPaymentScreen';
import TDBankScreen from './src/screens/TDBankScreen';
import LotoQuebecScreen from './src/screens/LotoQuebecScreen';
import MainMenuScreen from './src/screens/MainMenuScreen';
import TestModeScreen from './src/screens/TestModeScreen';
import TestResultsScreen from './src/screens/TestResultsScreen';
import { ScamType } from './src/config/scamScenarios';
import { TestModeProvider } from './src/context/TestModeContext';

export type RootStackParamList = {
  MainMenu: undefined;
  Home: undefined;
  Phone: undefined;
  ScamCall: { scenario: ScamType; mode?: 'practice' | 'guide' | 'test' };
  Gmail: { scenario?: string; mode?: 'practice' | 'guide' | 'test' } | undefined;
  Message: { scenario?: string; mode?: 'practice' | 'guide' | 'test'; initialConversationId?: string } | undefined;
  HydroQuebec: { mode?: 'practice' | 'guide' | 'test' } | undefined;
  CanadaPostPayment: { mode?: 'practice' | 'guide' | 'test' } | undefined;
  TDBank: { mode?: 'practice' | 'guide' | 'test' } | undefined;
  LotoQuebec: { mode?: 'practice' | 'guide' | 'test' } | undefined;
  TestMode: undefined;
  TestResults: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <TestModeProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="MainMenu">
          <Stack.Screen 
            name="MainMenu" 
            component={MainMenuScreen} 
            options={{ title: 'Scam Prevention', headerShown: false }} 
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Practice Mode', headerShown: false }} 
          />
          <Stack.Screen 
            name="TestMode" 
            component={TestModeScreen} 
            options={{ title: 'Test Mode', headerShown: false }} 
          />
          <Stack.Screen 
            name="TestResults" 
            component={TestResultsScreen} 
            options={{ title: 'Test Results', headerShown: false }} 
          />
          <Stack.Screen 
            name="Phone" 
            component={PhoneScreen} 
            options={{ title: 'Phone Call', headerShown: false }} 
          />
          <Stack.Screen 
            name="ScamCall" 
            component={ScamCallScreen} 
            options={{ title: 'Scam Call Simulation', headerShown: false }} 
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
    </TestModeProvider>
  );
}
