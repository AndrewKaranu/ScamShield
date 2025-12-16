import React, {useMemo, useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons'; // Standard icon library in Expo

type RootStackParamList = {
  Home: undefined;
  Phone: undefined;
  ScamCall: { scenario: string; mode?: 'practice' | 'guide' };
  Gmail: { scenario?: string; mode?: 'practice' | 'guide' } | undefined;
  Message: { scenario?: string; mode?: 'practice' | 'guide'; initialConversationId?: string } | undefined;
  HydroQuebec: undefined;
  CanadaPostPayment: { mode?: 'practice' | 'guide' } | undefined;
  TDBank: { mode?: 'practice' | 'guide' } | undefined;
  LotoQuebec: { mode?: 'practice' | 'guide' } | undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

// List of safety tips for rotation
const SAFETY_TIPS = [
  "Banks will never ask for your PIN or password over the phone.",
  "If a deal sounds too good to be true, it probably is.",
  "Don't click on links in texts from numbers you don't recognize.",
  "Scammers often create a sense of urgency to make you act fast.",
  "Verify a caller's identity by hanging up and calling the official number.",
  "Government agencies (like the IRS) will never demand payment via gift cards.",
  "Check the sender's email address carefully for slight misspellings.",
  "Never share your 2-factor authentication code with anyone.",
  "Tech support will never call you unexpectedly to fix a computer problem."
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const tipOfTheDay = useMemo(() => {
    // Get the number of days since Jan 1, 1970
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    // Use modulo operator (%) to cycle through the array indefinitely
    return SAFETY_TIPS[daysSinceEpoch % SAFETY_TIPS.length];
  }, []);

  const handleScenarioPress = (scenario: string) => {
    setSelectedScenario(scenario);
    setModalVisible(true);
  };

  const startSimulation = (mode: 'practice' | 'guide') => {
    setModalVisible(false);
    if (selectedScenario === 'canada-post') {
        navigation.navigate('Message', { scenario: 'canada-post', mode });
    } else if (selectedScenario === 'hydro-quebec') {
        navigation.navigate('Message', { scenario: 'hydro-quebec', mode });
    } else if (selectedScenario === 'td-bank') {
        navigation.navigate('Message', { scenario: 'td-bank', mode });
    } else if (selectedScenario === 'loto-quebec') {
        // Loto-Quebec starts with a phishing email in Gmail
        navigation.navigate('Gmail', { scenario: 'loto-quebec', mode });
    } else if (selectedScenario === 'grandchild-scam') {
        // Grandchild scam - phone call scenario
        navigation.navigate('ScamCall', { scenario: 'grandchild', mode });
    } else if (selectedScenario === 'bank-security-scam') {
        // Bank security scam - phone call scenario
        navigation.navigate('ScamCall', { scenario: 'bankSecurity', mode });
    } else if (selectedScenario === 'hydro-quebec-scam') {
        // Hydro-Québec technician scam - phone call scenario
        navigation.navigate('ScamCall', { scenario: 'hydroQuebec', mode });
    }
    // Legitimate scenarios - text messages
    else if (selectedScenario === 'legit-canada-post') {
        navigation.navigate('Message', { scenario: 'legit-canada-post', mode });
    } else if (selectedScenario === 'legit-clinic') {
        navigation.navigate('Message', { scenario: 'legit-clinic', mode });
    } else if (selectedScenario === 'legit-saaq') {
        navigation.navigate('Message', { scenario: 'legit-saaq', mode });
    }
    // Legitimate scenarios - emails
    else if (selectedScenario === 'legit-google-security') {
        navigation.navigate('Gmail', { scenario: 'legit-google-security', mode });
    } else if (selectedScenario === 'legit-cra') {
        navigation.navigate('Gmail', { scenario: 'legit-cra', mode });
    } else if (selectedScenario === 'legit-desjardins') {
        navigation.navigate('Gmail', { scenario: 'legit-desjardins', mode });
    }
  };

  // Reusable Card Component for consistency and cleaner code
  const MenuCard = ({ title, subtitle, iconName, color, onPress }: any) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={iconName} size={32} color="white" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
    </TouchableOpacity>
  );

 // ...existing code...
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Mode Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Choose Mode</Text>
                <Text style={styles.modalSubtitle}>How would you like to experience this simulation?</Text>
                
                <TouchableOpacity 
                    style={[styles.modeButton, { backgroundColor: '#007AFF' }]}
                    onPress={() => startSimulation('practice')}
                >
                    <Ionicons name="game-controller" size={24} color="white" style={{ marginRight: 10 }} />
                    <View>
                        <Text style={styles.modeButtonTitle}>Practice Mode</Text>
                        <Text style={styles.modeButtonDesc}>Try to spot the scam yourself</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.modeButton, { backgroundColor: '#34C759' }]}
                    onPress={() => startSimulation('guide')}
                >
                    <Ionicons name="school" size={24} color="white" style={{ marginRight: 10 }} />
                    <View>
                        <Text style={styles.modeButtonTitle}>Guide Mode</Text>
                        <Text style={styles.modeButtonDesc}>Step-by-step explanation</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Learner</Text>
        <Text style={styles.title}>Scam Prevention Training</Text>
      </View>

      {/* Daily Tip Section - Adds value immediately */}
      <View style={styles.tipContainer}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb" size={24} color="#D97706" />
          <Text style={styles.tipTitle}>Tip of the Day</Text>
        </View>
        <Text style={styles.tipText}>
          {tipOfTheDay}
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Practice Simulations</Text>

      {/* Navigation Cards */}
      <MenuCard 
        title="Phone Calls" 
        subtitle="Learn to spot fake callers"
        iconName="call" 
        color="#059669" // Emerald Green - Calming but high contrast
        onPress={() => navigation.navigate('Phone')} 
      />

      <MenuCard 
        title="Email & Gmail" 
        subtitle="Identify phishing emails"
        iconName="mail" 
        color="#DC2626" // Deep Red - High visibility for caution
        onPress={() => navigation.navigate('Gmail')} 
      />

      <MenuCard 
        title="Text Messages" 
        subtitle="Spot fake delivery texts"
        iconName="chatbubble" 
        color="#2563EB" // Royal Blue - Clear tech association
        onPress={() => navigation.navigate('Message')} 
      />

      <MenuCard 
        title="Login Scam" 
        subtitle="Spot fake Hydro Québec logins"
        iconName="globe" 
        color="#005F9E" // Hydro Blue
        onPress={() => handleScenarioPress('hydro-quebec')} 
      />

      <MenuCard 
        title="Payment Scam" 
        subtitle="Spot fake Canada Post payments"
        iconName="card" 
        color="#E31837" // Canada Post Red
        onPress={() => handleScenarioPress('canada-post')} 
      />

      <MenuCard 
        title="Bank Security Scam" 
        subtitle="Spot fake TD Bank security updates"
        iconName="shield-checkmark" 
        color="#008a00" // TD Green
        onPress={() => handleScenarioPress('td-bank')} 
      />

      <MenuCard 
        title="Lottery Win Scam" 
        subtitle="Spot fake Loto-Québec prize claims"
        iconName="trophy" 
        color="#FFD700" // Gold
        onPress={() => handleScenarioPress('loto-quebec')} 
      />

      <MenuCard 
        title="Grandchild in Crisis" 
        subtitle="Spot fake emergency calls from 'family'"
        iconName="people" 
        color="#8B5CF6" // Purple
        onPress={() => handleScenarioPress('grandchild-scam')} 
      />

      <MenuCard 
        title="Bank Security Alert" 
        subtitle="Spot fake fraud prevention calls"
        iconName="shield" 
        color="#DC2626" // Red - bank/security color
        onPress={() => handleScenarioPress('bank-security-scam')} 
      />

      <MenuCard 
        title="Hydro-Québec Emergency" 
        subtitle="Spot fake utility technician calls"
        iconName="flash" 
        color="#0EA5E9" // Sky blue - utility/electric color
        onPress={() => handleScenarioPress('hydro-quebec-scam')} 
      />

      {/* Legitimate Scenarios Section */}
      <Text style={styles.sectionHeader}>Legitimate Examples</Text>
      <Text style={styles.sectionSubheader}>Learn to recognize real messages too</Text>

      {/* Legitimate Text Messages */}
      <MenuCard 
        title="Canada Post Delivery" 
        subtitle="Real delivery notification"
        iconName="cube" 
        color="#E31837" // Canada Post Red
        onPress={() => handleScenarioPress('legit-canada-post')} 
      />

      <MenuCard 
        title="Medical Clinic Reminder" 
        subtitle="Real appointment reminder"
        iconName="medkit" 
        color="#3B82F6" // Blue - medical/healthcare
        onPress={() => handleScenarioPress('legit-clinic')} 
      />

      <MenuCard 
        title="SAAQ Notice" 
        subtitle="Real driver's licence renewal"
        iconName="car" 
        color="#1D4ED8" // Quebec blue
        onPress={() => handleScenarioPress('legit-saaq')} 
      />

      {/* Legitimate Emails */}
      <MenuCard 
        title="Google Security Code" 
        subtitle="Real verification code email"
        iconName="lock-closed" 
        color="#4285f4" // Google blue
        onPress={() => handleScenarioPress('legit-google-security')} 
      />

      <MenuCard 
        title="CRA Account Update" 
        subtitle="Real direct deposit notification"
        iconName="document-text" 
        color="#26374A" // CRA dark blue
        onPress={() => handleScenarioPress('legit-cra')} 
      />

      <MenuCard 
        title="Desjardins Activity Alert" 
        subtitle="Real fraud prevention alert"
        iconName="alert-circle" 
        color="#00874e" // Desjardins green
        onPress={() => handleScenarioPress('legit-desjardins')} 
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Off-white/Light Grey - Reduces glare compared to pure white
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60, // Extra space for status bar
  },
  header: {
    marginBottom: 25,
  },
  greeting: {
    fontSize: 18, // Larger for readability
    color: '#4B5563', // Dark Grey
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 30, // Larger title
    fontWeight: '800',
    color: '#111827', // Near Black for maximum contrast
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937', // Dark Grey
    marginBottom: 8,
    marginTop: 10,
  },
  sectionSubheader: {
    fontSize: 16,
    color: '#6B7280', // Medium Grey
    marginBottom: 15,
  },
  // Tip Box Styles
  tipContainer: {
    backgroundColor: '#FFFBEB', // Very light amber/yellow background
    padding: 20, // Increased padding for touch targets
    borderRadius: 12,
    marginBottom: 25,
    borderLeftWidth: 6,
    borderLeftColor: '#D97706', // Amber accent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E', // Darker amber for text readability
    marginLeft: 10,
  },
  tipText: {
    fontSize: 18, // Larger body text
    color: '#374151', // Dark grey
    lineHeight: 26, // Increased line height for readability
  },
  // Card Styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20, // Larger touch area
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20, // Larger
    fontWeight: 'bold',
    color: '#111827', // Near Black
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 16, // Larger
    color: '#6B7280', // Medium Grey
  },
  // Modal Styles
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  modeButtonTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modeButtonDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
