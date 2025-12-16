import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTestMode } from '../context/TestModeContext';

type RootStackParamList = {
  MainMenu: undefined;
  TestMode: undefined;
  TestResults: undefined;
  ScamCall: { scenario: string; mode: string };
  Message: { scenario: string; mode: string; initialConversationId?: string };
  Gmail: { scenario: string; mode: string };
};

type TestModeNavigationProp = StackNavigationProp<RootStackParamList, 'TestMode'>;

export default function TestModeScreen() {
  const navigation = useNavigation<TestModeNavigationProp>();
  const { state, startTestMode, getCurrentScam, startScam } = useTestMode();

  // Start test mode when screen loads
  useEffect(() => {
    if (!state.isActive) {
      startTestMode();
    }
  }, []);

  const handleStartNextScam = () => {
    const currentScam = getCurrentScam();
    if (!currentScam) {
      // All scams completed, go to results
      navigation.replace('TestResults');
      return;
    }

    startScam();
    
    // Navigate to the appropriate scam screen
    navigation.navigate(currentScam.navigateTo as any, currentScam.params);
  };

  const handleExit = () => {
    navigation.replace('MainMenu');
  };

  const currentScam = getCurrentScam();
  const progress = state.currentScamIndex;
  const total = state.scamsToShow.length;

  // If test completed, show completion UI
  if (!currentScam && state.isActive && state.results.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#059669" />
          <Text style={styles.completedTitle}>Test Complete!</Text>
          <Text style={styles.completedSubtitle}>You've finished all 5 scenarios</Text>
          <TouchableOpacity style={styles.resultsButton} onPress={() => navigation.replace('TestResults')}>
            <Text style={styles.resultsButtonText}>View Your Results</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scam Test</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            {[...Array(total)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index < progress && styles.progressDotCompleted,
                  index === progress && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>
            Scenario {progress + 1} of {total}
          </Text>
        </View>

        {/* Current Scam Info */}
        {currentScam && (
          <View style={styles.scamInfoCard}>
            <View style={styles.scamTypeContainer}>
              <Ionicons 
                name={
                  currentScam.category === 'call' ? 'call' :
                  currentScam.category === 'text' ? 'chatbubble' :
                  currentScam.category === 'email' ? 'mail' : 'globe'
                } 
                size={32} 
                color="#2563EB" 
              />
              <View style={styles.scamTypeInfo}>
                <Text style={styles.scamTypeBadge}>
                  {currentScam.category.toUpperCase()} SCENARIO
                </Text>
                <Text style={styles.scamDifficulty}>
                  Difficulty: {'★'.repeat(currentScam.difficulty)}{'☆'.repeat(5 - currentScam.difficulty)}
                </Text>
              </View>
            </View>

            <View style={styles.instructionsBox}>
              <Ionicons name="information-circle" size={24} color="#D97706" />
              <Text style={styles.instructionsText}>
                {currentScam.category === 'call' 
                  ? 'You will receive a phone call. Respond as you normally would. Your call handling will be evaluated.'
                  : currentScam.category === 'text'
                  ? 'You will see a text message. Decide how to respond. Your actions will be tracked.'
                  : 'You will receive an email. Review it carefully and decide what to do.'}
              </Text>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Remember</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.tipText}>Respond naturally, as you would in real life</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.tipText}>Trust your instincts - if something feels wrong, it probably is</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.tipText}>There's no penalty for being cautious</Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartNextScam}>
          <Text style={styles.startButtonText}>
            {progress === 0 ? 'Begin Test' : 'Start Scenario'}
          </Text>
          <Ionicons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  exitButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerPlaceholder: {
    width: 40,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  progressDot: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotCompleted: {
    backgroundColor: '#059669',
  },
  progressDotCurrent: {
    backgroundColor: '#2563EB',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scamInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scamTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  scamTypeInfo: {
    flex: 1,
  },
  scamTypeBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scamDifficulty: {
    fontSize: 14,
    color: '#D97706',
  },
  instructionsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 30,
  },
  resultsButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  resultsButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
