import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GuideOverlayProps {
  text: string;
  onNext: () => void;
  position?: 'top' | 'bottom' | 'center';
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({ text, onNext, position = 'center' }) => {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <View style={[styles.overlayContainer, { backgroundColor: 'transparent' }]} pointerEvents="box-none">
        {/* Transparent blocker to prevent app interaction while minimized */}
        <TouchableWithoutFeedback onPress={() => {}}>
            <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <TouchableOpacity 
            style={styles.minimizedFab} 
            onPress={() => setMinimized(false)}
            activeOpacity={0.8}
        >
            <Ionicons name="school" size={24} color="white" />
            <Text style={styles.minimizedText}>Guide</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getPositionStyle = (): any => {
    switch (position) {
      case 'top': return { top: 100 };
      case 'bottom': return { bottom: 100 };
      default: return { top: '40%' };
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => setMinimized(true)}>
      <View style={styles.overlayContainer}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={[styles.guideBox, getPositionStyle()]}>
            <View style={styles.guideHeader}>
              <Ionicons name="school" size={24} color="#34C759" />
              <Text style={styles.guideTitle}>Guide Mode</Text>
              <TouchableOpacity 
                style={styles.minimizeButton}
                onPress={() => setMinimized(true)}
              >
                <Ionicons name="chevron-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.guideText}>{text}</Text>
            
            <TouchableOpacity style={styles.guideButton} onPress={onNext}>
              <Text style={styles.guideButtonText}>Next Step</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    // Transparent background to allow seeing behind, but captures touches
    backgroundColor: 'rgba(0,0,0,0.05)', 
    alignItems: 'center',
  },
  guideBox: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Translucent
    padding: 20,
    borderRadius: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginLeft: 10,
    flex: 1,
  },
  minimizeButton: {
    padding: 5,
  },
  guideText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },
  guideButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
  },
  guideButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 5,
  },
  minimizedFab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  minimizedText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});
