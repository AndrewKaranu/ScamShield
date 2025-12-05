import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useMachine } from '@xstate/react';
import { phoneMachine } from '../machines/phoneMachine';
import { playAudio, playRingtone, enableRecordingMode } from '../services/aiService';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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

export default function PhoneScreen() {
  const [state, send] = useMachine(phoneMachine);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const ringtonePlayerRef = useRef<any>(null);

  // Function to stop ringtone
  const stopRingtone = () => {
    console.log('stopRingtone called, ref:', ringtonePlayerRef.current);
    if (ringtonePlayerRef.current) {
      ringtonePlayerRef.current.stop();
      ringtonePlayerRef.current = null;
    }
  };

  // Request recording permissions on mount
  useEffect(() => {
    requestRecordingPermissionsAsync();
  }, []);

  // Play ringtone when in incoming state
  const isIncoming = state.matches('incoming');
  useEffect(() => {
    let mounted = true;
    
    if (isIncoming) {
      // Play ringtone - make sure you have added the ringtone file
      playRingtone(require('../../assets/ringtone.mp3'))
        .then(result => {
          if (mounted) {
            ringtonePlayerRef.current = result;
          } else {
            // Component unmounted or state changed, stop immediately
            result.stop();
          }
        })
        .catch(err => {
          console.log('No ringtone file found or error playing:', err);
        });
    } else {
      // Stop ringtone when leaving incoming state
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
    if (state.context.lastAudio) {
        console.log('Starting audio playback...');
        playAudio(state.context.lastAudio).then(result => {
            const player = (result as any)._player;
            setCurrentPlayer(player);
            console.log('Player set, isLoaded:', player.isLoaded, 'playing:', player.playing);
            
            // Give a small delay for player to start, then poll for completion
            setTimeout(() => {
                const checkInterval = setInterval(() => {
                    console.log('Checking player status - playing:', player.playing, 'isLoaded:', player.isLoaded);
                    // Check if finished: not playing AND either loaded or duration elapsed
                    if (!player.playing && player.isLoaded) {
                        clearInterval(checkInterval);
                        console.log('Audio finished, cleaning up');
                        send({ type: 'AUDIO_FINISHED' });
                        setCurrentPlayer(null);
                        player.remove();
                    }
                }, 200);
                
                // Safety timeout - if audio doesn't finish in 30 seconds, force finish
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (currentPlayer) {
                        console.log('Safety timeout reached, forcing audio finish');
                        send({ type: 'AUDIO_FINISHED' });
                        setCurrentPlayer(null);
                        player.remove();
                    }
                }, 30000);
            }, 500);
        }).catch(err => {
            console.error('Audio playback error:', err);
            send({ type: 'AUDIO_FINISHED' });
        });
    }
  }, [state.context.lastAudio]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      send({ type: 'START_RECORDING' });
      // Enable recording mode before starting
      await enableRecordingMode();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      const uri = audioRecorder.uri;
      if (uri) {
        send({ type: 'STOP_RECORDING', uri });
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
    }
  };

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const renderIncoming = () => (
    <View style={styles.screen}>
      <View style={styles.callerInfo}>
        <Text style={styles.callerName}>Tech Maniac</Text>
        <Text style={styles.callerLabel}>mobile</Text>
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
        <Text style={styles.callerName}>Tech Maniac</Text>
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

      {/* Conversation Input - Mic Button */}
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
        <TouchableOpacity onPress={() => send({ type: 'END_CALL' })} style={styles.declineBtn}>
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
        <TouchableOpacity onPress={() => send({ type: 'END_CALL' })} style={styles.declineBtn}>
           <Image source={require('../../assets/accept-icon.png')} style={styles.actionIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEnded = () => (
    <View style={styles.screen}>
      <Text style={styles.endedTitle}>Call Ended</Text>
      <TouchableOpacity onPress={() => send({ type: 'RESTART' })} style={styles.restartBtn}>
        <Text style={styles.restartText}>Restart Simulation</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {state.matches('incoming') && renderIncoming()}
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
    backgroundColor: '#000', // Dark background like iOS call
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: 40,
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
    marginTop: 100,
  },
  restartBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 100,
  },
  restartText: {
    color: 'white',
    fontSize: 18,
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
});
