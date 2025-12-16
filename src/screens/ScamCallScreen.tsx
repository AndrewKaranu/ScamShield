import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useMachine } from '@xstate/react';
import { phoneMachine } from '../machines/phoneMachine';
import { playAudio, playRingtone, enableRecordingMode, enablePlaybackMode } from '../services/aiService';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScamType } from '../config/scamScenarios';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTestMode } from '../context/TestModeContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  ScamCall: { scenario: ScamType; mode?: 'practice' | 'guide' | 'test' };
  Home: undefined;
  TestMode: undefined;
  TestResults: undefined;
};

type ScamCallRouteProp = RouteProp<RootStackParamList, 'ScamCall'>;

// Shake Button Component
const ShakeButton = ({ onPress, children, style }: any) => {
  const offset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const handlePress = () => {
    offset.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withRepeat(withTiming(5, { duration: 100 }), 3, true),
      withTiming(0, { duration: 50 })
    );
    if (onPress) onPress();
  };

  return (
    <Animated.View style={[style, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} style={styles.gridButtonInner}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ScamCallScreen() {
  const route = useRoute<ScamCallRouteProp>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { scenario: scenarioType, mode = 'practice' } = route.params;
  const { isTestMode, recordMetrics, completeCurrentScam } = useTestMode();
  
  const [state, send] = useMachine(phoneMachine);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showScamFeedback, setShowScamFeedback] = useState(false);
  const [hasRecordedOutcome, setHasRecordedOutcome] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const ringtonePlayerRef = useRef<any>(null);

  // Initialize with the specified scam scenario on mount
  useEffect(() => {
    send({ type: 'SET_SCENARIO', scenarioType });
  }, [scenarioType]);

  // Watch for scam outcome changes
  useEffect(() => {
    if (state.context.scamOutcome === 'victim_failed' || state.context.scamOutcome === 'victim_suspicious') {
      // Record metrics for test mode
      if (isTestMode && !hasRecordedOutcome) {
        setHasRecordedOutcome(true);
        recordMetrics({
          sharedSensitiveInfo: state.context.scamOutcome === 'victim_failed',
          showedSuspicion: state.context.scamOutcome === 'victim_suspicious',
          callDuration: state.context.duration,
        });
      }
      
      // Show feedback after a brief delay
      const timer = setTimeout(() => {
        setShowScamFeedback(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.context.scamOutcome]);

  // Get caller display info from scenario or use defaults
  const callerName = state.context.scenario?.callerName || 'Unknown Caller';
  const callerNumber = state.context.scenario?.callerNumber || '+1 (514) 555-0123';
  const scenarioName = state.context.scenario?.name || 'Phone Scam';

  // Function to stop ringtone
  const stopRingtone = () => {
    console.log('stopRingtone called, ref:', ringtonePlayerRef.current);
    if (ringtonePlayerRef.current) {
      ringtonePlayerRef.current.stop();
      ringtonePlayerRef.current = null;
    }
  };

  // Function to stop any playing audio
  const stopCurrentAudio = () => {
    if (currentPlayer) {
      console.log('Stopping current audio player');
      try {
        currentPlayer.pause();
        currentPlayer.remove();
      } catch (e) {
        console.log('Error stopping audio:', e);
      }
      setCurrentPlayer(null);
    }
  };

  // Handle end call - stops all audio and ends the call
  const handleEndCall = () => {
    stopRingtone();
    stopCurrentAudio();
    send({ type: 'END_CALL' });
  };

  // Request recording permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const result = await requestRecordingPermissionsAsync();
      console.log('Microphone permission status:', result.status, 'granted:', result.granted);
      if (!result.granted) {
        console.warn('Microphone permission not granted - recording may not work');
      }
    };
    checkPermissions();
    
    // Pre-initialize audio mode for immediate ringtone playback
    enablePlaybackMode();
  }, []);

  // Play ringtone when in incoming state
  const isIncoming = state.matches('incoming');
  useEffect(() => {
    let mounted = true;
    
    if (isIncoming) {
      playRingtone(require('../../assets/ringtone.mp3'))
        .then(result => {
          if (mounted) {
            ringtonePlayerRef.current = result;
          } else {
            result.stop();
          }
        })
        .catch(err => {
          console.log('No ringtone file found or error playing:', err);
        });
    } else {
      stopRingtone();
    }
    
    return () => {
      mounted = false;
      stopRingtone();
    };
  }, [isIncoming]);

  // Wrapper functions for accept/decline that ensure ringtone stops
  const handleAccept = () => {
    stopRingtone();
    send({ type: 'ACCEPT' });
  };

  const handleDecline = () => {
    stopRingtone();
    send({ type: 'DECLINE' });
  };

  // Handle audio playback for AI responses
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let safetyTimeout: NodeJS.Timeout | null = null;
    let startTimeout: NodeJS.Timeout | null = null;
    let playerRef: any = null;
    let isCancelled = false;
    
    if (state.context.lastAudio) {
        console.log('Starting audio playback for state:', JSON.stringify(state.value), 'agentState:', state.context.agentState);
        
        playAudio(state.context.lastAudio).then(result => {
            if (isCancelled) {
                // Component unmounted or lastAudio changed, clean up
                (result as any)._player?.remove();
                return;
            }
            
            playerRef = (result as any)._player;
            setCurrentPlayer(playerRef);
            console.log('Player set, isLoaded:', playerRef.isLoaded, 'playing:', playerRef.playing);
            
            // Start checking after a small delay to let playback begin
            startTimeout = setTimeout(() => {
                if (isCancelled) return;
                
                checkInterval = setInterval(() => {
                    if (isCancelled || !playerRef) return;
                    
                    console.log('Checking player status - playing:', playerRef.playing, 'isLoaded:', playerRef.isLoaded);
                    if (!playerRef.playing && playerRef.isLoaded) {
                        if (checkInterval) clearInterval(checkInterval);
                        if (safetyTimeout) clearTimeout(safetyTimeout);
                        console.log('Audio finished, sending AUDIO_FINISHED');
                        send({ type: 'AUDIO_FINISHED' });
                        setCurrentPlayer(null);
                        playerRef.remove();
                        playerRef = null;
                    }
                }, 200);
                
                // Safety timeout - force finish after 30 seconds
                safetyTimeout = setTimeout(() => {
                    if (isCancelled) return;
                    if (checkInterval) clearInterval(checkInterval);
                    if (playerRef) {
                        console.log('Safety timeout reached, forcing audio finish');
                        send({ type: 'AUDIO_FINISHED' });
                        setCurrentPlayer(null);
                        playerRef.remove();
                        playerRef = null;
                    }
                }, 30000);
            }, 500);
        }).catch(err => {
            console.error('Audio playback error:', err);
            if (!isCancelled) {
                send({ type: 'AUDIO_FINISHED' });
            }
        });
    }
    
    // Cleanup function - runs when lastAudio changes or component unmounts
    return () => {
        console.log('Audio useEffect cleanup');
        isCancelled = true;
        if (startTimeout) clearTimeout(startTimeout);
        if (checkInterval) clearInterval(checkInterval);
        if (safetyTimeout) clearTimeout(safetyTimeout);
        // Don't remove playerRef here - let it finish playing if still playing
    };
  }, [state.context.lastAudio]);

  const startRecording = async () => {
    // Prevent double-start
    if (isRecording) {
      console.log('Already recording, ignoring start request');
      return;
    }
    
    try {
      const permResult = await requestRecordingPermissionsAsync();
      if (!permResult.granted) {
        console.error('Microphone permission denied');
        return;
      }
      
      // Enable recording mode FIRST before anything else
      console.log('Enabling recording mode...');
      await enableRecordingMode();
      
      setIsRecording(true);
      send({ type: 'START_RECORDING' });
      
      console.log('Preparing to record...');
      await audioRecorder.prepareToRecordAsync();
      console.log('Starting recording...');
      audioRecorder.record();
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(false);
      // Try to restore playback mode on error
      enablePlaybackMode().catch(() => {});
    }
  };

  const stopRecording = async () => {
    try {
      // Get recording status before stopping
      const status = audioRecorder.getStatus();
      console.log('Recording status before stop:', JSON.stringify(status));
      console.log('Recording duration (ms):', status.durationMillis);
      
      await audioRecorder.stop();
      setIsRecording(false);
      const uri = audioRecorder.uri;
      console.log('Recording stopped, URI:', uri);
      
      // Restore playback mode for loudspeaker output
      await enablePlaybackMode();
      
      if (uri) {
        send({ type: 'STOP_RECORDING', uri });
      } else {
        console.warn('No recording URI available!');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
      // Try to restore playback mode even on error
      enablePlaybackMode().catch(() => {});
    }
  };

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const renderIncoming = () => (
    <View style={styles.screen}>
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioLabel}>SCAM SIMULATION</Text>
        <Text style={styles.scenarioName}>{scenarioName}</Text>
      </View>
      <View style={styles.callerInfo}>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callerLabel}>{callerNumber}</Text>
      </View>
      <View style={styles.callActions}>
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity onPress={handleDecline} style={styles.declineBtn}>
            <Image source={require('../../assets/decline-icon.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Decline</Text>
        </View>
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity onPress={handleAccept} style={styles.acceptBtn}>
            <Image source={require('../../assets/accept-icon.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Accept</Text>
        </View>
      </View>
    </View>
  );

  const renderActive = () => (
    <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: '100%' }}
    >
    <View style={styles.screen}>
      <View style={styles.callerInfo}>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.timer}>{formatTime(state.context.duration)}</Text>
        {state.context.agentState !== 'idle' && state.context.agentState !== 'listening' && (
            <Text style={styles.statusText}>
                {state.context.agentState === 'thinking' ? 'Thinking...' : 
                 state.context.agentState === 'speaking' ? 'Speaking...' : 
                 state.context.agentState === 'recording' ? 'Recording...' :
                 state.context.agentState === 'transcribing' ? 'Processing speech...' : 'Listening...'}
            </Text>
        )}
      </View>

      {/* Grid Actions */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <TouchableOpacity 
              style={[styles.gridButton, state.context.isMuted && styles.activeGridButton]} 
              onPress={() => send({ type: 'TOGGLE_MUTE' })}
            >
              <MaterialIcons name="mic-off" size={32} color={state.context.isMuted ? "black" : "white"} />
            </TouchableOpacity>
            <Text style={styles.gridLabel}>mute</Text>
          </View>
          <View style={styles.gridItem}>
            <TouchableOpacity 
              style={styles.gridButton} 
              onPress={() => send({ type: 'SHOW_KEYPAD' })}
            >
              <MaterialIcons name="dialpad" size={32} color="white" />
            </TouchableOpacity>
            <Text style={styles.gridLabel}>keypad</Text>
          </View>
          <View style={styles.gridItem}>
            <TouchableOpacity 
              style={[styles.gridButton, state.context.isSpeakerOn && styles.activeGridButton]} 
              onPress={() => send({ type: 'TOGGLE_SPEAKER' })}
            >
              <MaterialIcons name="volume-up" size={32} color={state.context.isSpeakerOn ? "black" : "white"} />
            </TouchableOpacity>
            <Text style={styles.gridLabel}>audio</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <ShakeButton style={styles.gridButton}>
              <MaterialIcons name="add" size={32} color="white" />
            </ShakeButton>
            <Text style={styles.gridLabel}>add call</Text>
          </View>
          <View style={styles.gridItem}>
            <ShakeButton style={styles.gridButton}>
              <MaterialIcons name="videocam" size={32} color="white" />
            </ShakeButton>
            <Text style={styles.gridLabel}>FaceTime</Text>
          </View>
          <View style={styles.gridItem}>
            <ShakeButton style={styles.gridButton}>
              <MaterialIcons name="account-circle" size={32} color="white" />
            </ShakeButton>
            <Text style={styles.gridLabel}>contacts</Text>
          </View>
        </View>
      </View>

      {/* Mic Button */}
      <View style={styles.micContainer}>
        <TouchableOpacity 
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={[
              styles.micButton, 
              isRecording && styles.micButtonActive,
              (state.context.agentState === 'thinking' || 
               state.context.agentState === 'speaking' || 
               state.context.agentState === 'transcribing') && styles.micButtonDisabled
            ]}
            disabled={
              state.context.agentState === 'thinking' || 
              state.context.agentState === 'speaking' || 
              state.context.agentState === 'transcribing'
            }
        >
            <MaterialIcons 
              name={isRecording ? "mic" : "mic-none"} 
              size={40} 
              color={isRecording ? "#FF3B30" : "white"} 
            />
        </TouchableOpacity>
        <Text style={styles.micHint}>
          {isRecording ? 'Release to send' : 'Hold to speak'}
        </Text>
      </View>

      <View style={styles.endCallContainer}>
        <TouchableOpacity onPress={handleEndCall} style={styles.declineBtn}>
           <Image source={require('../../assets/decline-icon.png')} style={styles.actionIcon} /> 
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAvoidingView>
  );

  const renderKeypad = () => (
    <View style={styles.screen}>
      <View style={styles.keypadDisplay}>
        <Text style={styles.keypadDisplayText}>{state.context.keypadValue}</Text>
      </View>
      <View style={styles.keypadGrid}>
        {[
          ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
          ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
          ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
          ['*', ''], ['0', '+'], ['#', '']
        ].map(([key, sub]) => (
          <TouchableOpacity 
            key={key} 
            style={styles.keypadKey} 
            onPress={() => send({ type: 'PRESS_KEY', key })}
          >
            <Text style={styles.keyNumber}>{key}</Text>
            {sub ? <Text style={styles.keySub}>{sub}</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => send({ type: 'HIDE_KEYPAD' })} style={styles.hideKeypadBtn}>
        <Text style={styles.hideKeypadText}>Hide</Text>
      </TouchableOpacity>
      <View style={styles.endCallContainer}>
        <TouchableOpacity onPress={handleEndCall} style={styles.declineBtn}>
           <Image source={require('../../assets/accept-icon.png')} style={styles.actionIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEnded = () => (
    <View style={styles.screen}>
      <Text style={styles.endedTitle}>Call Ended</Text>
      {state.context.scamOutcome && state.context.scamOutcome !== 'ongoing' && (
        <View style={styles.feedbackContainer}>
          {state.context.scamOutcome === 'victim_failed' && (
            <>
              <MaterialIcons name="warning" size={48} color="#FF3B30" />
              <Text style={styles.feedbackTitle}>⚠️ You fell for the scam!</Text>
              <Text style={styles.feedbackText}>
                You provided sensitive information to the scammer. In a real scenario, this could lead to financial loss or identity theft.
              </Text>
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Red Flags to Watch For:</Text>
                <Text style={styles.tipItem}>• Unexpected calls from "family" in crisis</Text>
                <Text style={styles.tipItem}>• Requests for secrecy ("Don't tell anyone")</Text>
                <Text style={styles.tipItem}>• Pressure to act immediately</Text>
                <Text style={styles.tipItem}>• Requests for gift cards or wire transfers</Text>
              </View>
            </>
          )}
          {state.context.scamOutcome === 'victim_suspicious' && (
            <>
              <MaterialIcons name="check-circle" size={48} color="#34C759" />
              <Text style={styles.feedbackTitleSuccess}>✅ Great job staying alert!</Text>
              <Text style={styles.feedbackText}>
                You showed healthy skepticism. Always verify a caller's identity by calling them back on a known number.
              </Text>
            </>
          )}
        </View>
      )}
      {(!state.context.scamOutcome || state.context.scamOutcome === 'ongoing') && (
        <Text style={styles.feedbackText}>The call ended without a clear outcome.</Text>
      )}
      <TouchableOpacity onPress={() => {
        setShowScamFeedback(false);
        setHasRecordedOutcome(false);
        send({ type: 'RESTART' });
      }} style={styles.restartBtn}>
        <Text style={styles.restartText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        if (isTestMode) {
          // Record final metrics and complete the scam
          if (!hasRecordedOutcome) {
            recordMetrics({
              endedCallEarly: state.context.scamOutcome === 'ongoing' || !state.context.scamOutcome,
              callDuration: state.context.duration,
            });
          }
          completeCurrentScam();
          navigation.navigate('TestMode');
        } else {
          navigation.goBack();
        }
      }} style={styles.homeBtn}>
        <Text style={styles.homeBtnText}>{isTestMode ? 'Continue Test' : 'Back to Home'}</Text>
      </TouchableOpacity>
    </View>
  );

  // Scam Feedback Modal (shown during call)
  const renderScamFeedbackModal = () => (
    <Modal
      visible={showScamFeedback}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {state.context.scamOutcome === 'victim_failed' && (
            <>
              <MaterialIcons name="error" size={64} color="#FF3B30" />
              <Text style={styles.modalTitle}>Scam Alert!</Text>
              <Text style={styles.modalText}>
                You just provided information that a scammer could use against you.
              </Text>
              <Text style={styles.modalTextSmall}>
                {state.context.toolCalls.length > 0 && 
                  `Detected: ${state.context.toolCalls[state.context.toolCalls.length - 1]?.arguments?.info_type?.replace(/_/g, ' ')}`
                }
              </Text>
            </>
          )}
          {state.context.scamOutcome === 'victim_suspicious' && (
            <>
              <MaterialIcons name="shield" size={64} color="#34C759" />
              <Text style={styles.modalTitleSuccess}>Great Instincts!</Text>
              <Text style={styles.modalText}>
                You showed signs of recognizing this scam. This is exactly what you should do!
              </Text>
            </>
          )}
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => {
              setShowScamFeedback(false);
              handleEndCall();
            }}
          >
            <Text style={styles.modalButtonText}>End Call & See Results</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalButtonSecondary} 
            onPress={() => setShowScamFeedback(false)}
          >
            <Text style={styles.modalButtonTextSecondary}>Continue Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderScamFeedbackModal()}
      {state.matches('incoming') && renderIncoming()}
      {state.matches({ active: 'speakingOpening' }) && renderActive()}
      {state.matches({ active: 'speakingOpeningAudio' }) && renderActive()}
      {state.matches({ active: 'connectingToAgent' }) && renderActive()}
      {state.matches({ active: 'generatingAgentGreeting' }) && renderActive()}
      {state.matches({ active: 'speakingAgentGreeting' }) && renderActive()}
      {state.matches({ active: 'main' }) && renderActive()}
      {state.matches({ active: 'recording' }) && renderActive()}
      {state.matches({ active: 'transcribing' }) && renderActive()}
      {state.matches({ active: 'processing' }) && renderActive()}
      {state.matches({ active: 'speaking' }) && renderActive()}
      {state.matches({ active: 'keypad' }) && renderKeypad()}
      {state.matches('ended') && renderEnded()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  scenarioHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  scenarioLabel: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  scenarioName: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  callerName: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
  },
  callerLabel: {
    color: 'white',
    fontSize: 18,
    marginTop: 5,
  },
  timer: {
    color: 'white',
    fontSize: 20,
    marginTop: 5,
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 60,
  },
  actionButtonContainer: {
    alignItems: 'center',
  },
  declineBtn: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  acceptBtn: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    width: 75,
    height: 75,
  },
  actionLabel: {
    color: 'white',
    fontSize: 16,
  },
  gridContainer: {
    width: '80%',
    marginTop: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  gridItem: {
    alignItems: 'center',
    width: 80,
  },
  gridButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeGridButton: {
    backgroundColor: 'white',
  },
  gridLabel: {
    color: 'white',
    fontSize: 12,
  },
  endCallContainer: {
    marginBottom: 40,
  },
  keypadDisplay: {
    height: 50,
    justifyContent: 'center',
    marginBottom: 20,
  },
  keypadDisplayText: {
    color: 'white',
    fontSize: 32,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '80%',
  },
  keypadKey: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  keyNumber: {
    color: 'white',
    fontSize: 30,
  },
  keySub: {
    color: 'white',
    fontSize: 10,
    letterSpacing: 2,
  },
  hideKeypadBtn: {
    marginBottom: 20,
  },
  hideKeypadText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  endedTitle: {
    color: 'white',
    fontSize: 34,
    marginTop: 40,
  },
  restartBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  restartText: {
    color: 'white',
    fontSize: 18,
  },
  homeBtn: {
    padding: 15,
    marginBottom: 40,
  },
  homeBtnText: {
    color: '#007AFF',
    fontSize: 16,
  },
  statusText: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  micButtonActive: {
    backgroundColor: 'rgba(255,59,48,0.3)',
    borderWidth: 3,
    borderColor: '#FF3B30',
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  micHint: {
    color: '#999',
    fontSize: 14,
  },
  // Feedback Styles
  feedbackContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  feedbackTitle: {
    color: '#FF3B30',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackTitleSuccess: {
    color: '#34C759',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  tipsContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
    width: '100%',
  },
  tipsTitle: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tipItem: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    color: '#FF3B30',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  modalTitleSuccess: {
    color: '#34C759',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  modalText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  modalTextSmall: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonSecondary: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  modalButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
