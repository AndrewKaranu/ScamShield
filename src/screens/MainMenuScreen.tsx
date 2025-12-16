import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  MainMenu: undefined;
  Home: undefined;
  TestMode: undefined;
};

type MainMenuNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

export default function MainMenuScreen() {
  const navigation = useNavigation<MainMenuNavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Scam Shield</Text>
          <Text style={styles.subtitle}>Learn to protect yourself from scams</Text>
        </View>

        {/* Test Mode Card */}
        <TouchableOpacity 
          style={styles.mainCard}
          onPress={() => navigation.navigate('TestMode')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#059669', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="trophy" size={48} color="white" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Test Your Skills</Text>
              <Text style={styles.cardDescription}>
                Face 6 random scenarios - both scams and legitimate messages. Can you tell the difference? Get scored on your responses.
              </Text>
              <View style={styles.cardBadges}>
                <View style={styles.badge}>
                  <Ionicons name="time" size={14} color="white" />
                  <Text style={styles.badgeText}>~10 min</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="bar-chart" size={14} color="white" />
                  <Text style={styles.badgeText}>Scored</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="shuffle" size={14} color="white" />
                  <Text style={styles.badgeText}>Random</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={28} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Practice Mode Card */}
        <TouchableOpacity 
          style={styles.secondaryCard}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.9}
        >
          <View style={styles.secondaryCardContent}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="school" size={40} color="#2563EB" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.secondaryCardTitle}>Practice Mode</Text>
              <Text style={styles.secondaryCardDescription}>
                Explore individual scam scenarios at your own pace. Learn the warning signs with guided tutorials.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How Testing Works</Text>
          
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="shuffle" size={20} color="#D97706" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoItemTitle}>Random Selection</Text>
              <Text style={styles.infoItemDesc}>5 diverse scams from calls, texts, and emails</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="analytics" size={20} color="#2563EB" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoItemTitle}>Smart Scoring</Text>
              <Text style={styles.infoItemDesc}>Your actions are tracked and scored fairly</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="school" size={20} color="#059669" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoItemTitle}>Learn As You Go</Text>
              <Text style={styles.infoItemDesc}>Get feedback after each scenario</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  mainCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  cardIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginRight: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  secondaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  secondaryCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  secondaryCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoText: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  infoItemDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
});
