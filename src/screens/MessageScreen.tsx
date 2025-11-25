import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useMachine } from '@xstate/react';
import { messageMachine, Conversation } from '../machines/messageMachine';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

// Pulse Component
const PulseView = ({ children, style, disabled }: any) => {
  const scale = useSharedValue(1);

  const pulse = () => {
    scale.value = withSequence(withTiming(1.1, { duration: 150 }), withTiming(1, { duration: 150 }));
  };

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <TouchableOpacity 
        activeOpacity={disabled ? 1 : 0.7}
        onPress={() => {
            if (disabled) pulse();
            else if (children.props.onPress) children.props.onPress();
        }}
        style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MessageScreen() {
  const [state, send] = useMachine(messageMachine);
  const { conversations, activeConversationId, isDarkMode, replyText } = state.context;

  const theme = isDarkMode ? darkTheme : lightTheme;

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]} 
      onPress={() => send({ type: 'OPEN_CONVERSATION', id: item.id })}
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
    </View>
  );

  const renderConversation = () => {
    const conversation = conversations.find(c => c.id === activeConversationId);
    if (!conversation) return null;

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => send({ type: 'BACK' })}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#007AFF" />
            <Text style={styles.headerLink}>Messages</Text>
          </TouchableOpacity>
          <View style={styles.contactInfo}>
            <View style={[styles.avatarSmall, { backgroundColor: conversation.avatarColor }]}>
                <Text style={styles.avatarTextSmall}>{conversation.avatarText}</Text>
            </View>
            <Text style={[styles.contactName, { color: theme.secondaryText }]}>{conversation.sender}</Text>
          </View>
          <MaterialIcons name="info-outline" size={24} color="#007AFF" />
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
                <Text style={[
                  styles.messageText, 
                  item.type === 'sent' ? { color: 'white' } : { color: theme.text }
                ]}>{item.text}</Text>
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
                    />
                ) : (
                    <PulseView disabled={true} style={{ width: '100%', alignItems: 'flex-start' }}>
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
});
