import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useMachine } from '@xstate/react';
import { phoneMachine } from '../machines/phoneMachine';
import { playAudio } from '../services/aiService';
import { useAudioPlayerStatus } from 'expo-audio';
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
  const [inputText, setInputText] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);

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
          <TouchableOpacity onPress={() => send({ type: 'DECLINE' })} style={styles.declineBtn}>
            <Image source={require('../../assets/decline-icon.png')} style={styles.actionIcon} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Decline</Text>
        </View>
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity onPress={() => send({ type: 'ACCEPT' })} style={styles.acceptBtn}>
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
        {state.context.agentState !== 'idle' && (
            <Text style={styles.statusText}>
                {state.context.agentState === 'thinking' ? 'Thinking...' : 
                 state.context.agentState === 'speaking' ? 'Speaking...' : 'Listening...'}
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

      {/* Conversation Input */}
      <View style={styles.inputContainer}>
        <TextInput
            style={styles.input}
            placeholder="Type to speak..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => {
                if (inputText.trim()) {
                    send({ type: 'USER_SPEAK', text: inputText });
                    setInputText('');
                }
            }}
        />
        <TouchableOpacity 
            onPress={() => {
                if (inputText.trim()) {
                    send({ type: 'USER_SPEAK', text: inputText });
                    setInputText('');
                }
            }}
            style={styles.sendBtn}
        >
            <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
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
  inputContainer: {
    flexDirection: 'row',
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    color: 'white',
    height: 40,
    paddingHorizontal: 10,
  },
  sendBtn: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
});
