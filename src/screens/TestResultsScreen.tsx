import React from 'react';
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
};

type TestResultsNavigationProp = StackNavigationProp<RootStackParamList, 'TestResults'>;

export default function TestResultsScreen() {
  const navigation = useNavigation<TestResultsNavigationProp>();
  const { state, getOverallScore, endTestMode } = useTestMode();
  
  const { score, grade } = getOverallScore();

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'A': return '#059669';
      case 'B': return '#10B981';
      case 'C': return '#F59E0B';
      case 'D': return '#EF4444';
      case 'F': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getGradeMessage = (g: string) => {
    switch (g) {
      case 'A': return 'Excellent! You have strong scam detection skills.';
      case 'B': return 'Good job! You recognized most scams but there\'s room to improve.';
      case 'C': return 'Decent awareness, but scammers could still trick you.';
      case 'D': return 'You need more practice spotting scam tactics.';
      case 'F': return 'High risk! We recommend reviewing all training materials.';
      default: return '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'call': return 'call';
      case 'text': return 'chatbubble';
      case 'email': return 'mail';
      default: return 'globe';
    }
  };

  const handleFinish = () => {
    endTestMode();
    navigation.replace('MainMenu');
  };

  const handleRetry = () => {
    navigation.replace('TestMode');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Results</Text>
        </View>

        {/* Overall Score Card */}
        <View style={styles.scoreCard}>
          <View style={[styles.gradeCircle, { backgroundColor: getGradeColor(grade) }]}>
            <Text style={styles.gradeText}>{grade}</Text>
          </View>
          <Text style={styles.scoreValue}>{score}%</Text>
          <Text style={styles.scoreLabel}>Overall Score</Text>
          <Text style={styles.gradeMessage}>{getGradeMessage(grade)}</Text>
        </View>

        {/* Individual Results */}
        <Text style={styles.sectionTitle}>Scenario Breakdown</Text>
        
        {state.results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIconContainer}>
                <Ionicons 
                  name={getCategoryIcon(result.scam.category)} 
                  size={24} 
                  color="#6B7280" 
                />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{result.scam.name}</Text>
                <Text style={styles.resultCategory}>
                  {result.scam.category.charAt(0).toUpperCase() + result.scam.category.slice(1)} Scam
                </Text>
              </View>
              <View style={[styles.resultGradeBadge, { backgroundColor: getGradeColor(result.grade) }]}>
                <Text style={styles.resultGradeText}>{result.grade}</Text>
              </View>
            </View>
            
            <View style={styles.resultScoreBar}>
              <View style={[styles.resultScoreFill, { width: `${result.score}%`, backgroundColor: getGradeColor(result.grade) }]} />
            </View>
            
            <Text style={styles.resultFeedback}>{result.feedback}</Text>
            
            {/* Metrics Summary */}
            <View style={styles.metricsContainer}>
              {result.scam.category === 'call' && result.metrics.callDuration && (
                <View style={styles.metricBadge}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.metricText}>{result.metrics.callDuration}s on call</Text>
                </View>
              )}
              {result.metrics.sharedSensitiveInfo && (
                <View style={[styles.metricBadge, styles.metricBadgeDanger]}>
                  <Ionicons name="warning" size={14} color="#DC2626" />
                  <Text style={[styles.metricText, { color: '#DC2626' }]}>Shared info</Text>
                </View>
              )}
              {result.metrics.showedSuspicion && (
                <View style={[styles.metricBadge, styles.metricBadgeSuccess]}>
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                  <Text style={[styles.metricText, { color: '#059669' }]}>Showed suspicion</Text>
                </View>
              )}
              {result.metrics.clickedScamLink && (
                <View style={[styles.metricBadge, styles.metricBadgeDanger]}>
                  <Ionicons name="link" size={14} color="#DC2626" />
                  <Text style={[styles.metricText, { color: '#DC2626' }]}>Clicked link</Text>
                </View>
              )}
              {result.metrics.enteredCredentials && (
                <View style={[styles.metricBadge, styles.metricBadgeDanger]}>
                  <Ionicons name="key" size={14} color="#DC2626" />
                  <Text style={[styles.metricText, { color: '#DC2626' }]}>Entered credentials</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#059669" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Finish</Text>
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  gradeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gradeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  gradeMessage: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  resultGradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultGradeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  resultScoreBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  resultScoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  resultFeedback: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  metricBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  metricBadgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  metricText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 20,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#059669',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  finishButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
