import React, {useMemo} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons'; // Standard icon library in Expo

type RootStackParamList = {
  Home: undefined;
  Phone: undefined;
  Gmail: undefined;
  Message: undefined;
  HydroQuebec: undefined;
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

  const tipOfTheDay = useMemo(() => {
    // Get the number of days since Jan 1, 1970
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    // Use modulo operator (%) to cycle through the array indefinitely
    return SAFETY_TIPS[daysSinceEpoch % SAFETY_TIPS.length];
  }, []);

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
        title="Fake Websites" 
        subtitle="Spot fake Hydro Québec logins"
        iconName="globe" 
        color="#005F9E" // Hydro Blue
        onPress={() => navigation.navigate('HydroQuebec')} 
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
    marginBottom: 15,
    marginTop: 10,
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
});