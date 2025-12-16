import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 
import { GuideOverlay } from '../components/GuideOverlay';
import { useTestMode } from '../context/TestModeContext';

export default function HydroQuebecScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showScamAlert, setShowScamAlert] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  const mode = (route.params as any)?.mode || 'practice';
  const [guideStep, setGuideStep] = useState(2); // Start at 2 because 0 and 1 are in MessageScreen
  const { isTestMode, recordMetrics, completeCurrentScam } = useTestMode();
  const [hasRecordedMetrics, setHasRecordedMetrics] = useState(false);

  // Record that user entered credentials when they arrive at this screen in test mode
  useEffect(() => {
    if (isTestMode && !hasRecordedMetrics) {
      recordMetrics({ enteredCredentials: true, clickedScamLink: true });
      setHasRecordedMetrics(true);
    }
  }, [isTestMode, hasRecordedMetrics]);

  const handleLogin = () => {
    if (email.length > 0 && password.length > 0) {
        if (isTestMode) {
          recordMetrics({ sharedSensitiveInfo: true });
        }
        setShowScamAlert(true);
    } else {
        Alert.alert('Error', 'Please enter your email and password.');
    }
  };

  const handleFinishSimulation = () => {
    setShowScamAlert(false);
    if (isTestMode) {
      completeCurrentScam();
      navigation.navigate('TestMode' as never);
    } else {
      navigation.navigate('Home' as never);
    }
  };

  const handleContinueTest = () => {
    completeCurrentScam();
    navigation.navigate('TestMode' as never);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Scam Alert Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showScamAlert}
        onRequestClose={handleFinishSimulation}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Ionicons name="warning" size={40} color="#E31837" />
                    <Text style={styles.modalTitle}>Scam Detected!</Text>
                </View>
                <Text style={styles.modalText}>
                    You just fell for a <Text style={{fontWeight: 'bold'}}>Phishing</Text> scam.
                </Text>
                <Text style={styles.modalText}>
                    1. <Text style={{fontWeight: 'bold'}}>The Text:</Text> Scammers promise refunds to get you to act quickly without thinking.
                </Text>
                <Text style={styles.modalText}>
                    2. <Text style={{fontWeight: 'bold'}}>The Link:</Text> The URL was <Text style={{fontStyle: 'italic'}}>hydro-quebec-refund.com</Text>, not <Text style={{fontStyle: 'italic'}}>hydroquebec.com</Text>.
                </Text>
                <Text style={styles.modalText}>
                    3. <Text style={{fontWeight: 'bold'}}>The Goal:</Text> They want your login credentials to steal your identity or access your account.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleFinishSimulation}>
                    <Text style={styles.modalButtonText}>I Understand</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {mode === 'guide' && guideStep === 2 && (
        <GuideOverlay 
            text="Check the URL bar (if this were a real browser). The address 'hydro-quebec-refund.com' is fake. Real Hydro-Québec links end in .com and start with hydroquebec."
            onNext={() => setGuideStep(3)}
            position="top"
        />
      )}

      {mode === 'guide' && guideStep === 3 && (
        <GuideOverlay 
            text="Notice the 'Information' box. Scammers often add fake notices about 'updates' or 'security' to make the site look more legitimate."
            onNext={() => setGuideStep(4)}
            position="top"
        />
      )}

      {mode === 'guide' && guideStep === 4 && (
        <GuideOverlay 
            text="This is the trap. If you enter your email and password here, you are sending them directly to the scammer."
            onNext={() => setGuideStep(5)}
            position="center"
        />
      )}

      {mode === 'guide' && guideStep === 5 && (
        <GuideOverlay 
            text="You've completed the guide! Remember: Always verify the URL before entering any personal information."
            onNext={() => navigation.navigate('Home' as never)}
            position="center"
        />
      )}

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
            editable={mode !== 'guide'}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={mode !== 'guide'}
          />
        </View>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Forgot your password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.loginButton, mode === 'guide' && { opacity: 0.6 }]} 
            onPress={handleLogin}
            disabled={mode === 'guide'}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
            <Text style={styles.orText}>or </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Create my Hydro-Québec login</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* Test Mode Continue Button */}
      {isTestMode && (
        <TouchableOpacity style={styles.testCompleteButton} onPress={handleContinueTest}>
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.testCompleteButtonText}>I'm Done - Continue Test</Text>
        </TouchableOpacity>
      )}
      
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E31837',
    marginTop: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'left',
    width: '100%',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#E31837',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testCompleteButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testCompleteButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});