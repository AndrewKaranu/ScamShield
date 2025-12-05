import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, SafeAreaView, Platform, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GuideOverlay } from '../components/GuideOverlay';

export default function TDBankScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [showCookiePopup, setShowCookiePopup] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showScamAlert, setShowScamAlert] = useState(false);
  
  const mode = (route.params as any)?.mode || 'practice';
  const [guideStep, setGuideStep] = useState(2); // Start at 2 assuming flow from message

  const handleDownload = () => {
    if (mode === 'guide') {
        setGuideStep(4); // Move to download explanation
    }
    setShowDownloadModal(true);
  };

  const handleSaveFile = () => {
    setShowDownloadModal(false);
    if (mode === 'practice') {
        setShowScamAlert(true);
    }
  };

  const handleFinishSimulation = () => {
    setShowScamAlert(false);
    navigation.navigate('Home' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Scam Alert Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showScamAlert}
        onRequestClose={handleFinishSimulation}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Ionicons name="warning" size={40} color="#E31837" />
                    <Text style={styles.modalTitle}>Scam Detected!</Text>
                </View>
                <Text style={styles.modalText}>
                    You just downloaded a <Text style={{fontWeight: 'bold'}}>Malicious File</Text>.
                </Text>
                <Text style={styles.modalText}>
                    1. <Text style={{fontWeight: 'bold'}}>The File:</Text> Banks never ask you to download update files (.ipa/.apk) from a website. They only use the App Store.
                </Text>
                <Text style={styles.modalText}>
                    2. <Text style={{fontWeight: 'bold'}}>The Urgency:</Text> "Action Required Immediately" is a classic pressure tactic.
                </Text>
                <Text style={styles.modalText}>
                    3. <Text style={{fontWeight: 'bold'}}>The URL:</Text> The site was <Text style={{fontStyle: 'italic'}}>td-security-update.com</Text>, not <Text style={{fontStyle: 'italic'}}>td.com</Text>.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={handleFinishSimulation}>
                    <Text style={styles.modalButtonText}>I Understand</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* Guide Overlays */}
      {mode === 'guide' && guideStep === 2 && (
        <GuideOverlay 
            text="Check the URL (if this were a real browser). It says 'td-security-update.com'. Real banks NEVER use separate domains for security updates."
            onNext={() => setGuideStep(3)}
            position="top"
        />
      )}

      {mode === 'guide' && guideStep === 3 && (
        <GuideOverlay 
            text="Notice the urgency. 'Action Required' and 'Immediately' are designed to make you panic and skip verifying the source."
            onNext={() => setGuideStep(4)} // User needs to click download to see next step usually, but we can guide them
            position="center"
        />
      )}

      {mode === 'guide' && guideStep === 4 && showDownloadModal && (
        <GuideOverlay 
            text="STOP! Banks will NEVER ask you to download a file like this (.ipa or .apk) directly. This bypasses App Store security to install malware."
            onNext={() => setGuideStep(5)}
            position="bottom"
        />
      )}

      {mode === 'guide' && guideStep === 5 && (
        <GuideOverlay 
            text="Even the 'Cookie Consent' popup is fake. Scammers add these to make the site look professional and trustworthy. Don't be fooled by polish."
            onNext={() => navigation.navigate('Home' as never)}
            position="bottom"
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="#171717" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
            <Image 
                source={require('../../assets/Toronto-Dominion_Bank_logo.svg.png')} 
                style={styles.tdLogo}
                resizeMode="contain"
            />
        </View>
        <TouchableOpacity style={styles.loginButton}>
            <Ionicons name="person" size={20} color="#008a00" />
            <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcomeText}>Bank Security Portal</Text>
        
        <Text style={styles.subText}>
            Important security notice for all mobile banking users.
        </Text>

        <View style={styles.alertBox}>
            <Ionicons name="warning" size={40} color="#E31837" style={{marginBottom: 10}} />
            <Text style={styles.alertTitle}>Action Required</Text>
            <Text style={styles.alertText}>
                Our security systems have detected that your TD Canada Trust app is out of date. 
                To continue accessing your accounts securely, you must download and install the latest security certificate immediately.
            </Text>
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                <Text style={styles.downloadButtonText}>Download Required Security Update</Text>
            </TouchableOpacity>
        </View>

        {/* Fake Links to make it look real */}
        <View style={styles.linkRow}>
            <View style={styles.circleIcon}>
                <Ionicons name="card-outline" size={24} color="#171717" />
            </View>
            <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Find a chequing account ›</Text>
                <Text style={styles.linkDesc}>For daily spending, making bill payments and more</Text>
            </View>
        </View>

        <View style={styles.linkRow}>
            <View style={styles.circleIcon}>
                <Ionicons name="wallet-outline" size={24} color="#171717" />
            </View>
            <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Find a savings account ›</Text>
                <Text style={styles.linkDesc}>Accounts to help you grow your savings</Text>
            </View>
        </View>

      </ScrollView>

      {/* Cookie Popup */}
      {showCookiePopup && (
        <View style={styles.cookiePopup}>
            <Text style={styles.cookieText}>
                We and third parties that we select, use technologies and tracking tools to collect certain information about your device and usage of our apps and websites. We do this to deliver our service, improve your experience, and prevent fraud. Your activity on our apps and sites will be collected to enhance your experience, contact you and present you with relevant ads and offers on our apps and sites and on third party apps and websites. The information may also be used by these third parties in accordance with their privacy policies. You have control over the collection of this information. To learn more about the information we collect on our apps and websites visit: <Text style={styles.cookieLink}>TD Privacy Policy: Interacting with TD Online</Text>
            </Text>
            <TouchableOpacity style={styles.cookieButtonOutline}>
                <Text style={styles.cookieButtonTextOutline}>Manage online experience</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cookieButtonFilled} onPress={() => setShowCookiePopup(false)}>
                <Text style={styles.cookieButtonTextFilled}>Accept all</Text>
            </TouchableOpacity>
        </View>
      )}

      {/* iOS Save File Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDownloadModal}
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <View style={styles.bottomSheetOverlay}>
            <View style={styles.iosSheet}>
                <View style={styles.iosHeader}>
                    <TouchableOpacity onPress={() => setShowDownloadModal(false)}>
                        <Text style={styles.iosCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.iosTitle}>Save in...</Text>
                    <TouchableOpacity onPress={handleSaveFile}>
                        <Text style={styles.iosSave}>Save</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.filePreview}>
                    <Image 
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg' }} // Placeholder or use icon
                        style={{width: 40, height: 50, marginRight: 15}} 
                    />
                    <View style={{flex: 1}}>
                        <Text style={styles.fileName}>TD_Security_Update_v4.2.ipa</Text>
                        <Text style={styles.fileSize}>128 KB</Text>
                    </View>
                    <Ionicons name="close-circle" size={24} color="#8E8E93" />
                </View>

                <Text style={styles.iosSectionTitle}>Choose where to save</Text>
                
                <TouchableOpacity style={styles.iosRow} onPress={() => {}}>
                    <View style={styles.iosIconContainer}>
                        <Ionicons name="folder" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.iosRowText}>Files</Text>
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iosRow} onPress={() => {}}>
                    <View style={styles.iosIconContainer}>
                        <Ionicons name="logo-google" size={24} color="#F4B400" />
                    </View>
                    <Text style={styles.iosRowText}>Drive</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iosButton} onPress={handleSaveFile}>
                    <Text style={styles.iosButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 5,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 15,
  },
  tdLogo: {
    width: 50,
    height: 50,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: '#008a00',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Space for cookie popup
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#171717',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subText: {
    fontSize: 18,
    color: '#171717',
    textAlign: 'center',
    marginBottom: 30,
  },
  alertBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E31837',
    marginBottom: 10,
  },
  alertText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  downloadButton: {
    backgroundColor: '#008a00',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  circleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#008a00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  linkContent: {
    flex: 1,
    justifyContent: 'center',
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008a00',
    marginBottom: 5,
  },
  linkDesc: {
    fontSize: 15,
    color: '#555',
    lineHeight: 20,
  },
  // Cookie Popup
  cookiePopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  cookieText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    lineHeight: 16,
  },
  cookieLink: {
    color: '#008a00',
    fontWeight: 'bold',
  },
  cookieButtonOutline: {
    borderWidth: 1,
    borderColor: '#008a00',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  cookieButtonTextOutline: {
    color: '#008a00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cookieButtonFilled: {
    backgroundColor: '#008a00',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cookieButtonTextFilled: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // iOS Modal
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  // Scam Alert Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E31837',
    marginTop: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'left',
    width: '100%',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#E31837',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iosSheet: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  iosCancel: {
    color: '#007AFF',
    fontSize: 17,
  },
  iosTitle: {
    fontWeight: '600',
    fontSize: 17,
  },
  iosSave: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#8E8E93',
  },
  iosSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 15,
    color: '#000',
  },
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#C6C6C8',
  },
  iosIconContainer: {
    marginRight: 15,
  },
  iosRowText: {
    fontSize: 17,
    flex: 1,
  },
  iosButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  iosButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
