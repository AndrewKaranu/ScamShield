import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, Dimensions, ScrollView, Linking } from 'react-native';
import { useMachine } from '@xstate/react';
import { mailMachine, Email } from '../machines/mailMachine';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { GuideOverlay } from '../components/GuideOverlay';

const { width, height } = Dimensions.get('window');

// Pulse Component
const PulseView = ({ children, style, id }: any) => {
  const scale = useSharedValue(1);

  const pulse = () => {
    scale.value = withSequence(withTiming(1.1, { duration: 150 }), withTiming(1, { duration: 150 }));
  };

  // Expose pulse method via ref or context if needed, but for now we'll just use a local trigger
  // Actually, we can just wrap the TouchableOpacity and handle the press
  
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {React.cloneElement(children, { onPress: (e: any) => {
          if (children.props.onPress) children.props.onPress(e);
          else pulse();
      }})}
    </Animated.View>
  );
};

import { useTestMode } from '../context/TestModeContext';

export default function GmailScreen() {
  const [state, send] = useMachine(mailMachine);
  const { emails, selectedEmails, currentEmailId, isSideMenuOpen, isAccountModalOpen, snackbarMessage } = state.context;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [guideStep, setGuideStep] = useState(0);
  const mode = (route.params as any)?.mode || 'practice';
  const scenario = (route.params as any)?.scenario;
  const { isTestMode, recordMetrics, completeCurrentScam } = useTestMode();
  
  // Check if current scenario is legitimate
  const isLegitScenario = scenario?.startsWith('legit-');

  // Load scenario on mount
  useEffect(() => {
    if (scenario) {
      send({ type: 'LOAD_SCENARIO', scenario });
    }
  }, [scenario]);

  const handleScamLink = (scamType: string) => {
    // Record metrics for test mode
    if (isTestMode) {
      recordMetrics({ clickedScamLink: true });
    }
    
    if (scamType === 'loto-quebec') {
      navigation.navigate('LotoQuebec', { mode });
    }
  };
  
  const handleLegitLink = () => {
    // Record metrics for clicking legitimate links in test mode
    if (isTestMode && isLegitScenario) {
      recordMetrics({ clickedLegitLink: true, trustedCorrectly: true });
    }
  };

  // Render email body with clickable links
  const renderEmailBody = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <Text style={styles.detailBody}>
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            return (
              <Text
                key={index}
                style={{ color: '#1a73e8', textDecorationLine: 'underline' }}
                onPress={() => {
                  if (mode !== 'guide') {
                    // Check if it's a scam link that should navigate in-app
                    if (part.includes('loto-quebec')) {
                      handleScamLink('loto-quebec');
                    } else if (part.includes('hydro-quebec')) {
                      // Handle hydro-quebec links if any
                      navigation.navigate('HydroQuebec', { mode: isTestMode ? 'test' : mode });
                    } else if (part.includes('canada') && part.includes('post')) {
                      // Handle canada post links if any  
                      navigation.navigate('CanadaPostPayment', { mode: isTestMode ? 'test' : mode });
                    } else if (part.includes('td') && (part.includes('bank') || part.includes('security'))) {
                      // Handle TD bank links if any
                      navigation.navigate('TDBank', { mode: isTestMode ? 'test' : mode });
                    } else {
                      // For legitimate links, open in browser
                      Linking.openURL(part);
                    }
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

  // Snackbar Auto-Dismiss
  useEffect(() => {
    if (snackbarMessage) {
      const timer = setTimeout(() => send({ type: 'DISMISS_SNACKBAR' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbarMessage]);

  const renderEmailItem = ({ item }: { item: Email }) => {
    const isSelected = selectedEmails.includes(item.id);
    const isSelectionMode = state.matches({ inbox: 'selection' });

    const handlePress = () => {
      if (isSelectionMode) {
        send({ type: 'TOGGLE_SELECTION', id: item.id });
      } else {
        if (item.isNew) {
          send({ type: 'OPEN_EMAIL', id: item.id });
        } else {
          // Pulse effect handled by PulseView wrapper if we implemented it that way, 
          // but here we need to trigger it manually or use a specific component.
          // Let's just use a local animation for non-functional items.
          // For simplicity in this port, we'll just ignore non-functional clicks or maybe add a visual cue later.
        }
      }
    };

    const handleLongPress = () => {
      if (!isSelectionMode) {
        send({ type: 'LONG_PRESS_EMAIL', id: item.id });
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.emailItem, isSelected && styles.selectedEmailItem]} 
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={[styles.avatar, { backgroundColor: isSelected ? '#1a73e8' : item.avatarColor }]}>
          {isSelected ? (
            <MaterialIcons name="check" size={24} color="white" />
          ) : (
            <Text style={styles.avatarText}>{item.avatarText}</Text>
          )}
        </View>
        <View style={styles.emailContent}>
          <View style={styles.emailHeader}>
            <Text style={[styles.sender, item.unread && styles.unreadText]}>{item.sender}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Text style={[styles.subject, item.unread && styles.unreadText]} numberOfLines={1}>{item.subject}</Text>
          <Text style={styles.preview} numberOfLines={1}>{item.preview}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInbox = () => (
    <View style={styles.container}>
      {/* Header */}
      {state.matches({ inbox: 'selection' }) ? (
        <View style={styles.headerSelection}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => send({ type: 'CANCEL_SELECTION' })}>
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.selectionCount}>{selectedEmails.length}</Text>
          </View>
          <TouchableOpacity onPress={() => send({ type: 'DELETE_SELECTED' })}>
            <MaterialIcons name="delete" size={24} color="black" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => send({ type: 'OPEN_MENU' })} style={styles.menuBtn} disabled={mode === 'guide'}>
            <MaterialIcons name="menu" size={24} color="#5f6368" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color="#5f6368" />
            <Text style={styles.searchText}>Search in mail</Text>
            <TouchableOpacity onPress={() => send({ type: 'OPEN_ACCOUNT' })} disabled={mode === 'guide'}>
               <View style={[styles.avatarSmall, { backgroundColor: '#5f6368' }]}>
                 <Text style={styles.avatarTextSmall}>A</Text>
               </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Inbox</Text>
      <FlatList
        data={emails}
        keyExtractor={(item) => item.id}
        renderItem={renderEmailItem}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.composeBtn} disabled={mode === 'guide'}>
        <MaterialIcons name="edit" size={24} color="#c04b37" />
        <Text style={styles.composeText}>Compose</Text>
      </TouchableOpacity>

      {/* Guide overlay for inbox */}
      {mode === 'guide' && guideStep === 0 && scenario === 'loto-quebec' && (
        <GuideOverlay 
          text="Scammers send phishing emails that look legitimate. Notice this 'Loto-Québec' email promising you won money - a classic lottery scam!"
          onNext={() => {
            setGuideStep(1);
            send({ type: 'OPEN_EMAIL', id: 'loto-quebec' });
          }}
          position="top"
        />
      )}
    </View>
  );

  const renderDetail = () => {
    const email = emails.find(e => e.id === currentEmailId);
    if (!email) return null;

    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => send({ type: 'BACK_TO_INBOX' })} disabled={mode === 'guide'}>
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.detailActions}>
            <TouchableOpacity onPress={() => send({ type: 'DELETE_EMAIL' })} disabled={mode === 'guide'}>
              <MaterialIcons name="delete" size={24} color="black" />
            </TouchableOpacity>
            <MaterialIcons name="mail" size={24} color="black" style={{ marginLeft: 20 }} />
            <MaterialIcons name="more-vert" size={24} color="black" style={{ marginLeft: 20 }} />
          </View>
        </View>

        <ScrollView style={styles.detailScrollContent}>
          <View style={styles.detailSubjectRow}>
            <Text style={styles.detailSubject}>{email.subject}</Text>
            <MaterialIcons name="star-border" size={24} color="#5f6368" />
          </View>
          
          <View style={styles.detailSenderRow}>
            <View style={[styles.avatar, { backgroundColor: email.avatarColor }]}>
              <Text style={styles.avatarText}>{email.avatarText}</Text>
            </View>
            <View style={styles.detailSenderInfo}>
              <View style={styles.senderNameRow}>
                <Text style={styles.detailSenderName}>{email.sender}</Text>
                <Text style={styles.detailTime}>{email.time}</Text>
              </View>
              {email.senderEmail && (
                <Text style={styles.senderEmail}>{email.senderEmail}</Text>
              )}
            </View>
          </View>

          {/* Email Body */}
          {renderEmailBody(email.body || email.preview)}

          {/* Scam CTA Button */}
          {email.isScam && (
            <TouchableOpacity 
              style={styles.scamCtaButton} 
              onPress={() => {
                if (mode !== 'guide') {
                  handleScamLink(email.scamType || '');
                }
              }}
            >
              <Text style={styles.scamCtaText}>🎁 CLAIM YOUR PRIZE NOW! 🎁</Text>
            </TouchableOpacity>
          )}

          {!email.isScam && (
            <View style={styles.replyContainer}>
              <TouchableOpacity style={styles.replyBtn} onPress={() => send({ type: 'REPLY' })}>
                <MaterialIcons name="reply" size={20} color="#5f6368" />
                <Text style={styles.replyBtnText}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.replyBtn}>
                <MaterialIcons name="reply-all" size={20} color="#5f6368" />
                <Text style={styles.replyBtnText}>Reply all</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.replyBtn}>
                <MaterialIcons name="forward" size={20} color="#5f6368" />
                <Text style={styles.replyBtnText}>Forward</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Guide overlay for email detail */}
        {mode === 'guide' && guideStep === 1 && email.isScam && (
          <GuideOverlay 
            text="Notice the RED FLAGS: 1) Urgency ('LAST CHANCE', '24 HOURS'). 2) Spelling error ('choosen'). 3) Suspicious sender email domain. 4) You never entered this lottery!"
            onNext={() => setGuideStep(2)}
            position="top"
          />
        )}

        {mode === 'guide' && guideStep === 2 && email.isScam && (
          <GuideOverlay 
            text="The link goes to 'loto-quebec-winners.com' - NOT the real 'lotoquebec.com'. Scammers use similar-looking domains to trick you."
            onNext={() => {
              setGuideStep(3);
              handleScamLink(email.scamType || '');
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

  const renderCompose = () => (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => send({ type: 'BACK_FROM_COMPOSE' })}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compose</Text>
        <View style={styles.detailActions}>
          <TouchableOpacity onPress={() => send({ type: 'SEND_REPLY' })}>
            <MaterialIcons name="send" size={24} color="#1a73e8" />
          </TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color="black" style={{ marginLeft: 20 }} />
        </View>
      </View>
      <View style={styles.composeForm}>
        <View style={styles.composeRow}>
          <Text style={styles.composeLabel}>From</Text>
          <Text style={styles.composeValue}>me@example.com</Text>
        </View>
        <View style={styles.composeRow}>
          <Text style={styles.composeLabel}>To</Text>
          <Text style={styles.composeValue}>Google Community Team</Text>
        </View>
        <View style={styles.composeRow}>
          <TextInput placeholder="Subject" style={styles.composeInput} />
        </View>
        <TextInput 
          placeholder="Compose email" 
          style={styles.composeBody} 
          multiline 
          autoFocus
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {state.matches('inbox') && renderInbox()}
      {state.matches('detail') && renderDetail()}
      {state.matches('compose') && renderCompose()}

      {/* Side Menu Modal */}
      <Modal visible={isSideMenuOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => send({ type: 'CLOSE_MENU' })} />
          <View style={styles.sideMenu}>
            <View style={styles.sideMenuHeader}>
              <Image source={require('../../assets/gmail-seeklogo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.sideMenuItem}>
              <MaterialIcons name="inbox" size={24} color="#d93025" />
              <Text style={[styles.sideMenuText, { color: '#d93025', fontWeight: 'bold' }]}>Primary</Text>
              <Text style={styles.sideMenuCount}>1</Text>
            </View>
            <View style={styles.sideMenuItem}>
              <MaterialIcons name="local-offer" size={24} color="#5f6368" />
              <Text style={styles.sideMenuText}>Promotions</Text>
              <View style={[styles.badge, { backgroundColor: '#188038' }]}>
                <Text style={styles.badgeText}>3 new</Text>
              </View>
            </View>
            <View style={styles.sideMenuItem}>
              <MaterialIcons name="people" size={24} color="#5f6368" />
              <Text style={styles.sideMenuText}>Social</Text>
              <View style={[styles.badge, { backgroundColor: '#1a73e8' }]}>
                <Text style={styles.badgeText}>1 new</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal visible={isAccountModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => send({ type: 'CLOSE_ACCOUNT' })} />
          <View style={styles.accountModal}>
            <TouchableOpacity style={styles.closeAccountBtn} onPress={() => send({ type: 'CLOSE_ACCOUNT' })}>
              <MaterialIcons name="close" size={24} color="#5f6368" />
            </TouchableOpacity>
            <View style={styles.accountInfo}>
              <View style={[styles.avatarLarge, { backgroundColor: '#5f6368' }]}>
                <Text style={styles.avatarTextLarge}>A</Text>
              </View>
              <Text style={styles.accountName}>Andre</Text>
              <Text style={styles.accountEmail}>andre@example.com</Text>
              <TouchableOpacity style={styles.manageBtn}>
                <Text style={styles.manageBtnText}>Manage your Google Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Snackbar */}
      {snackbarMessage && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
  },
  menuBtn: {
    padding: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    padding: 10,
    marginLeft: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    color: '#5f6368',
    fontSize: 16,
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5f6368',
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  listContent: {
    paddingBottom: 80,
  },
  emailItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  selectedEmailItem: {
    backgroundColor: '#e8f0fe',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emailContent: {
    flex: 1,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sender: {
    fontSize: 16,
    color: '#202124',
  },
  unreadText: {
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#5f6368',
  },
  subject: {
    fontSize: 14,
    color: '#202124',
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    color: '#5f6368',
  },
  composeBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  composeText: {
    color: '#c04b37',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  headerSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContent: {
    padding: 16,
  },
  detailScrollContent: {
    flex: 1,
    padding: 16,
  },
  detailSubjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailSubject: {
    fontSize: 22,
    flex: 1,
    marginRight: 10,
  },
  detailSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailSenderInfo: {
    flex: 1,
  },
  detailSenderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailTime: {
    fontSize: 12,
    color: '#5f6368',
  },
  detailBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#202124',
  },
  replyContainer: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-between',
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 0.3,
    justifyContent: 'center',
  },
  replyBtnText: {
    marginLeft: 5,
    color: '#5f6368',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  composeForm: {
    padding: 16,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
  },
  composeLabel: {
    color: '#5f6368',
    width: 50,
  },
  composeValue: {
    fontSize: 16,
  },
  composeInput: {
    fontSize: 16,
    flex: 1,
  },
  composeBody: {
    fontSize: 16,
    marginTop: 20,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sideMenu: {
    width: '80%',
    backgroundColor: 'white',
    height: '100%',
    paddingTop: 50,
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  logo: {
    height: 24,
    width: 100,
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sideMenuText: {
    marginLeft: 20,
    fontSize: 16,
    color: '#202124',
    flex: 1,
  },
  sideMenuCount: {
    fontSize: 14,
    color: '#5f6368',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  accountModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 100,
    marginLeft: '5%',
    padding: 20,
    alignItems: 'center',
  },
  closeAccountBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  accountInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarTextLarge: {
    color: 'white',
    fontSize: 40,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountEmail: {
    color: '#5f6368',
    marginBottom: 20,
  },
  manageBtn: {
    borderWidth: 1,
    borderColor: '#dadce0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  manageBtnText: {
    fontWeight: 'bold',
    color: '#5f6368',
  },
  snackbar: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#323232',
    padding: 14,
    borderRadius: 4,
    elevation: 6,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
  },
  senderNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderEmail: {
    fontSize: 12,
    color: '#5f6368',
    marginTop: 2,
  },
  scamCtaButton: {
    backgroundColor: '#d93025',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scamCtaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
    bottom: 20,
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
