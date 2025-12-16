import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useMachine } from '@xstate/react';
import { messageMachine, Conversation } from '../machines/messageMachine';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GuideOverlay } from '../components/GuideOverlay';
import { useTestMode } from '../context/TestModeContext';

// Pulse Component
const PulseView = ({ children, style, disabled }: any) => {
  const scale = useSharedValue(1);

  const pulse = () => {
    scale.value = withSequence(withTiming(1.1, { duration: 150 }), withTiming(1, { duration: 150 }));
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, animatedStyle, { justifyContent: 'center' }]}>
      <TouchableOpacity 
        activeOpacity={disabled ? 1 : 0.7}
        onPress={() => {
            if (disabled) pulse();
            else if (children.props.onPress) children.props.onPress();
        }}
        style={{ width: '100%' }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MessageScreen() {
  const [state, send] = useMachine(messageMachine);
  const { conversations, activeConversationId, isDarkMode, replyText } = state.context;
  const navigation = useNavigation();
  const route = useRoute();
  const [guideStep, setGuideStep] = React.useState(0);
  const mode = (route.params as any)?.mode || 'practice';
  const { isTestMode, recordMetrics, completeCurrentScam } = useTestMode();

  useEffect(() => {
    if (route.params) {
        const params = route.params as any;
        if (params.scenario) {
            send({ type: 'LOAD_SCENARIO', scenario: params.scenario });
        }
        if (params.initialConversationId) {
            // Small delay to ensure scenario is loaded first if needed, though XState handles sync actions well
            setTimeout(() => {
                send({ type: 'OPEN_CONVERSATION', id: params.initialConversationId });
            }, 10);
        }
    }
  }, [route.params]);

  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Check if current scenario is legitimate
  const scenario = (route.params as any)?.scenario || '';
  const isLegitScenario = scenario.startsWith('legit-');

  const handleLinkPress = (url: string) => {
    // Record metrics for test mode when clicking a scam link
    const isScamLink = url.includes('canadapost-pay.com') || 
                       url.includes('hydro-quebec-refund.com') || 
                       url.includes('td-security-update.com');
    
    if (isTestMode && isScamLink) {
      recordMetrics({ clickedScamLink: true });
    }
    
    // Record metrics for clicking legitimate links in test mode
    if (isTestMode && isLegitScenario) {
      recordMetrics({ clickedLegitLink: true, trustedCorrectly: true });
    }
    
    if (url.includes('canadapost-pay.com')) {
        (navigation as any).navigate('CanadaPostPayment', { mode });
    } else if (url.includes('hydro-quebec-refund.com')) {
        (navigation as any).navigate('HydroQuebec', { mode });
    } else if (url.includes('td-security-update.com')) {
        (navigation as any).navigate('TDBank', { mode });
    } else {
        Linking.openURL(url);
    }
  };

  const renderMessageText = (text: string, isSent: boolean) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <Text style={[
            styles.messageText, 
            isSent ? { color: 'white' } : { color: theme.text }
        ]}>
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return (
                        <Text 
                            key={index} 
                            style={{ textDecorationLine: 'underline', color: isSent ? 'white' : '#007AFF' }}
                            onPress={() => {
                                if (mode !== 'guide') {
                                    handleLinkPress(part);
                                }
                            }}
                        >
                            {part}
                        </Text>
                    );
                }
                return part;
            })}
        </Text>
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]} 
      onPress={() => send({ type: 'OPEN_CONVERSATION', id: item.id })}
      disabled={mode === 'guide'}
    >
      {item.unread && <View style={styles.unreadDot} />}
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.avatarText}</Text>
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.senderName, { color: theme.text }]}>{item.sender}</Text>
          <Text style={[styles.timestamp, { color: theme.secondaryText }]}>{item.time}</Text>
        </View>
        <Text style={[styles.preview, { color: theme.secondaryText }]} numberOfLines={2}>{item.preview}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  const renderList = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity>
            <Text style={styles.headerLink}>Filters</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => send({ type: 'TOGGLE_THEME' })}>
                <MaterialIcons name={isDarkMode ? "light-mode" : "dark-mode"} size={24} color="#007AFF" />
            </TouchableOpacity>
            <MaterialIcons name="edit-square" size={24} color="#007AFF" style={{ marginLeft: 15 }} />
        </View>
      </View>
      
      <View style={[styles.searchBar, { backgroundColor: theme.searchBg }]}>
        <MaterialIcons name="search" size={20} color={theme.secondaryText} />
        <Text style={[styles.searchText, { color: theme.secondaryText }]}>Search</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderConversationItem}
      />
      
      {mode === 'guide' && guideStep === 0 && (
        <GuideOverlay 
            text={
                (route.params as any)?.scenario === 'hydro-quebec' 
                ? "Scammers often impersonate utility companies like Hydro-Québec. They promise a 'refund' to get you excited and lower your guard."
                : (route.params as any)?.scenario === 'td-bank'
                ? "Scammers often impersonate banks to create panic. They claim there is 'unauthorized access' to make you act fast."
                : "Scammers often use official-looking names like 'Canada Post' to gain your trust. Notice the 'Unpaid fees' subject line designed to create urgency."
            }
            onNext={() => {
                setGuideStep(1);
                send({ type: 'OPEN_CONVERSATION', id: (route.params as any)?.scenario || 'canada-post' });
            }}
            position="top"
        />
      )}
    </View>
  );

  const renderConversation = () => {
    const conversation = conversations.find(c => c.id === activeConversationId);
    if (!conversation) return null;

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.backBtn, { zIndex: 1 }, mode === 'guide' && { opacity: 0.5 }]} 
            onPress={() => send({ type: 'BACK' })}
            disabled={mode === 'guide'}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="#007AFF" />
            <Text style={styles.headerLink}>Messages</Text>
          </TouchableOpacity>
          <View style={styles.contactInfo} pointerEvents="none">
            <View style={[styles.avatarSmall, { backgroundColor: conversation.avatarColor }]}>
                <Text style={styles.avatarTextSmall}>{conversation.avatarText}</Text>
            </View>
            <Text style={[styles.contactName, { color: theme.secondaryText }]}>{conversation.sender}</Text>
          </View>
          <MaterialIcons name="info-outline" size={24} color="#007AFF" style={{ zIndex: 1 }} />
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <FlatList
            data={conversation.messages}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.messageList}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={[
                styles.bubble, 
                item.type === 'sent' ? styles.bubbleSent : [styles.bubbleReceived, { backgroundColor: theme.bubbleReceived }]
              ]}>
                {renderMessageText(item.text, item.type === 'sent')}
              </View>
            )}
          />

          <View style={[styles.inputArea, { backgroundColor: theme.headerBg, borderTopColor: theme.border }]}>
            <MaterialIcons name="add-circle" size={28} color="#007AFF" />
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, opacity: conversation.active ? 1 : 0.7 }]}>
                {conversation.active ? (
                    <TextInput 
                        style={[styles.input, { color: theme.text }]}
                        placeholder="iMessage"
                        placeholderTextColor={theme.secondaryText}
                        value={replyText}
                        onChangeText={(text) => send({ type: 'TYPE_REPLY', text })}
                        editable={mode !== 'guide'}
                    />
                ) : (
                    <PulseView disabled={true} style={{ width: '100%' }}>
                        <Text style={[styles.inputPlaceholder, { color: theme.secondaryText }]}>Text Message</Text>
                    </PulseView>
                )}
            </View>
            {replyText.trim().length > 0 ? (
                <TouchableOpacity onPress={() => send({ type: 'SEND_REPLY' })}>
                    <MaterialIcons name="arrow-upward" size={24} color="white" style={styles.sendBtn} />
                </TouchableOpacity>
            ) : (
                <MaterialIcons name="mic" size={28} color={theme.secondaryText} />
            )}
          </View>
        </KeyboardAvoidingView>

        {mode === 'guide' && guideStep === 1 && (
            <GuideOverlay 
                text={
                    (route.params as any)?.scenario === 'hydro-quebec'
                    ? "They include a link to a fake website. 'hydro-quebec-refund.com' is NOT the real 'hydroquebec.com'. Always verify the URL!"
                    : (route.params as any)?.scenario === 'td-bank'
                    ? "They include a link to a fake website. 'td-security-update.com' is NOT the real 'td.com'. Banks don't use separate domains for updates."
                    : "They include a link to a fake website. The URL 'canadapost-pay.com' is NOT the official 'canadapost.ca'. Always check the domain carefully!"
                }
                onNext={() => {
                    setGuideStep(2);
                    if ((route.params as any)?.scenario === 'hydro-quebec') {
                        handleLinkPress('https://hydro-quebec-refund.com/claim');
                    } else if ((route.params as any)?.scenario === 'td-bank') {
                        handleLinkPress('https://td-security-update.com/v4');
                    } else {
                        handleLinkPress('https://canadapost-pay.com/track/CA892341');
                    }
                }}
                position="center"
            />
        )}
        
        {/* Test Mode Buttons */}
        {isTestMode && (
          <View style={styles.testButtonsContainer}>
            {isLegitScenario ? (
              <>
                <TouchableOpacity 
                  style={styles.testTrustButton}
                  onPress={() => {
                    recordMetrics({ trustedCorrectly: true });
                    completeCurrentScam();
                    navigation.navigate('TestMode' as never);
                  }}
                >
                  <Ionicons name="shield-checkmark" size={20} color="white" />
                  <Text style={styles.testCompleteButtonText}>This Looks Legitimate</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.testReportButton}
                  onPress={() => {
                    recordMetrics({ reportedAsScam: true });
                    completeCurrentScam();
                    navigation.navigate('TestMode' as never);
                  }}
                >
                  <Ionicons name="warning" size={20} color="white" />
                  <Text style={styles.testCompleteButtonText}>Report as Scam</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.testCompleteButton}
                onPress={() => {
                  // User didn't click the scam link - that's good!
                  completeCurrentScam();
                  navigation.navigate('TestMode' as never);
                }}
              >
                <MaterialIcons name="check-circle" size={20} color="white" />
                <Text style={styles.testCompleteButtonText}>I'm Done - Continue Test</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {state.matches('list') ? renderList() : renderConversation()}
    </SafeAreaView>
  );
}

const darkTheme = {
  background: '#000',
  headerBg: '#1c1c1e',
  text: '#fff',
  secondaryText: '#8e8e93',
  border: '#3a3a3c',
  searchBg: '#2c2c2e',
  inputBg: '#2c2c2e',
  bubbleReceived: '#262626',
};

const lightTheme = {
  background: '#fff',
  headerBg: '#f2f2f7',
  text: '#000',
  secondaryText: '#8e8e93',
  border: '#c6c6c8',
  searchBg: '#e3e3e8',
  inputBg: '#fff',
  bubbleReceived: '#e5e5ea',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    minHeight: 65,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerLink: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    padding: 8,
    borderRadius: 10,
  },
  searchText: {
    marginLeft: 5,
    fontSize: 17,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginRight: 5,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 14,
  },
  preview: {
    fontSize: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatarTextSmall: {
    color: 'white',
    fontSize: 12,
  },
  contactName: {
    fontSize: 10,
  },
  messageList: {
    padding: 10,
  },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 18,
    marginBottom: 10,
  },
  bubbleReceived: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  bubbleSent: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    paddingHorizontal: 12,
    paddingVertical: 5,
    minHeight: 36,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
    padding: 0,
    margin: 0,
  },
  inputPlaceholder: {
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 2,
  },
  testCompleteButton: {
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
  testButtonsContainer: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    gap: 8,
    alignItems: 'flex-end',
  },
  testTrustButton: {
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
  testReportButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.75)',
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
});
