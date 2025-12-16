import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Switch, Platform, KeyboardAvoidingView, Image, Modal, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GuideOverlay } from '../components/GuideOverlay';
import { useTestMode } from '../context/TestModeContext';

export default function CanadaPostPaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [showScamAlert, setShowScamAlert] = useState(false);
  
  const mode = (route.params as any)?.mode || 'practice';
  const [guideStep, setGuideStep] = useState(2); // Start at 2 because 0 and 1 are in MessageScreen
  const { isTestMode, recordMetrics, completeCurrentScam } = useTestMode();
  const [hasRecordedMetrics, setHasRecordedMetrics] = useState(false);

  // Record that user clicked scam link when they arrive at this screen in test mode
  useEffect(() => {
    if (isTestMode && !hasRecordedMetrics) {
      recordMetrics({ clickedScamLink: true });
      setHasRecordedMetrics(true);
    }
  }, [isTestMode, hasRecordedMetrics]);

  const validateCard = () => {
    // Basic validation
    if (name.length < 3) {
        Alert.alert('Error', 'Please enter a valid cardholder name.');
        return false;
    }
    if (cardNumber.replace(/\s/g, '').length < 15) {
        Alert.alert('Error', 'Please enter a valid card number.');
        return false;
    }
    if (!expiry.match(/^\d{2}\/\d{2}$/)) {
        Alert.alert('Error', 'Please enter a valid expiry date (MM/YY).');
        return false;
    }
    if (cvv.length < 3) {
        Alert.alert('Error', 'Please enter a valid CVV.');
        return false;
    }
    return true;
  };

  const handlePay = () => {
    if (validateCard()) {
        if (isTestMode) {
          recordMetrics({ enteredCredentials: true, sharedSensitiveInfo: true });
        }
        setShowScamAlert(true);
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
    <SafeAreaView style={styles.container}>
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
                    You just fell for a <Text style={{fontWeight: 'bold'}}>Smishing (SMS Phishing)</Text> scam.
                </Text>
                <Text style={styles.modalText}>
                    1. <Text style={{fontWeight: 'bold'}}>The Text:</Text> Scammers send fake delivery notifications to create urgency.
                </Text>
                <Text style={styles.modalText}>
                    2. <Text style={{fontWeight: 'bold'}}>The Link:</Text> The URL was <Text style={{fontStyle: 'italic'}}>canadapost-pay.com</Text>, not <Text style={{fontStyle: 'italic'}}>canadapost.ca</Text>. Always check the domain!
                </Text>
                <Text style={styles.modalText}>
                    3. <Text style={{fontWeight: 'bold'}}>The Goal:</Text> They want your credit card info to steal your money.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleFinishSimulation}>
                    <Text style={styles.modalButtonText}>I Understand</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {mode === 'guide' && guideStep === 2 && (
        <GuideOverlay 
            text="Check the URL bar (if this were a real browser). The address 'canadapost-pay.com' is fake. Real Canada Post links end in .ca."
            onNext={() => setGuideStep(3)}
            position="top"
        />
      )}

      {mode === 'guide' && guideStep === 3 && (
        <GuideOverlay 
            text="Look at the 'Order Summary'. Scammers add random fees like 'Handling Fee' to justify the charge. They are usually small amounts to make you less suspicious."
            onNext={() => setGuideStep(4)}
            position="center"
        />
      )}

      {mode === 'guide' && guideStep === 4 && (
        <GuideOverlay 
            text="This is the goal: stealing your credit card info. Never enter payment details unless you are 100% sure of the website."
            onNext={() => setGuideStep(5)}
            position="bottom"
        />
      )}

      {mode === 'guide' && guideStep === 5 && (
        <GuideOverlay 
            text="You've completed the guide! Remember: Check the sender, check the link, and never pay fees for unexpected deliveries."
            onNext={() => navigation.navigate('Home' as never)}
            position="center"
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
            <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={[styles.menuButton, mode === 'guide' && { opacity: 0.5 }]}
                disabled={mode === 'guide'}
            >
                <Text style={styles.menuText}>Menu</Text>
            </TouchableOpacity>
            
            {/* Logo Placeholder - Canada Post Logo is typically a red winged envelope */}
            <View style={styles.logoContainer}>
                <Image 
                    source={require('../../assets/canadapost.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={24} color="#333" />
            </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
            
            <Text style={styles.pageTitle}>Secure Payment</Text>

            <View style={styles.orderSummary}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Customs Duty & Taxes</Text>
                    <Text style={styles.summaryValue}>$14.50</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Handling Fee</Text>
                    <Text style={styles.summaryValue}>$9.95</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total to Pay</Text>
                    <Text style={styles.totalValue}>$24.45</Text>
                </View>
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.sectionHeader}>Payment Details</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Cardholder Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder=""
                        editable={mode !== 'guide'}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Card Number</Text>
                    <View style={styles.cardInputContainer}>
                        <TextInput
                            style={[styles.input, styles.cardInput]}
                            value={cardNumber}
                            onChangeText={setCardNumber}
                            placeholder=""
                            keyboardType="numeric"
                            editable={mode !== 'guide'}
                        />
                        <MaterialIcons name="credit-card" size={24} color="#666" style={styles.cardIcon} />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Expiry Date (MM/YY)</Text>
                        <TextInput
                            style={styles.input}
                            value={expiry}
                            onChangeText={(text) => {
                                // Auto-add slash
                                if (text.length === 2 && expiry.length === 1) {
                                    setExpiry(text + '/');
                                } else {
                                    setExpiry(text);
                                }
                            }}
                            placeholder="MM/YY"
                            keyboardType="numeric"
                            maxLength={5}
                            editable={mode !== 'guide'}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>CVV</Text>
                        <View style={styles.cvvContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={cvv}
                                onChangeText={setCvv}
                                placeholder="123"
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry
                                editable={mode !== 'guide'}
                            />
                            <Ionicons name="help-circle-outline" size={20} color="#007AFF" style={{ marginLeft: 8 }} />
                        </View>
                    </View>
                </View>

                <View style={styles.checkboxContainer}>
                    <Switch
                        value={saveCard}
                        onValueChange={setSaveCard}
                        trackColor={{ false: "#767577", true: "#007AFF" }}
                        thumbColor={saveCard ? "#fff" : "#f4f3f4"}
                        disabled={mode === 'guide'}
                    />
                    <Text style={styles.checkboxLabel}>Save this card for future payments</Text>
                </View>

                <TouchableOpacity 
                    style={[styles.payButton, mode === 'guide' && { opacity: 0.6 }]} 
                    onPress={handlePay}
                    disabled={mode === 'guide'}
                >
                    <Text style={styles.payButtonText}>Pay $24.45</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.cancelButton, mode === 'guide' && { opacity: 0.6 }]} 
                    onPress={() => navigation.goBack()}
                    disabled={mode === 'guide'}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.secureText}>
                    <MaterialIcons name="lock" size={14} color="#666" />
                    {' '}Payments are processed securely.
                </Text>
            </View>

            {/* Footer Links similar to screenshot */}
            <View style={styles.footer}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
                <Text style={styles.footerSeparator}>|</Text>
                <Text style={styles.footerLink}>Terms of Service</Text>
            </View>

            {/* Test Mode Continue Button */}
            {isTestMode && (
              <TouchableOpacity style={styles.testCompleteButton} onPress={handleContinueTest}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.testCompleteButtonText}>I'm Done - Continue Test</Text>
              </TouchableOpacity>
            )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
  },
  menuButton: {
    padding: 5,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  searchButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#333',
    marginBottom: 25,
    marginTop: 10,
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#555',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E31837',
  },
  formContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 50,
  },
  cardInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  cardInput: {
    paddingRight: 40,
  },
  cardIcon: {
    position: 'absolute',
    right: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cvvContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  payButton: {
    backgroundColor: '#007AFF', // Canada Post Blue-ish
    paddingVertical: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 15,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  secureText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerLink: {
    color: '#007AFF',
    fontSize: 14,
    marginHorizontal: 10,
  },
  footerSeparator: {
    color: '#ccc',
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
