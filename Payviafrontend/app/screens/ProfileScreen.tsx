import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import StellarMobileMoneyService from '../../services/StellarMobileMoneyService';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

const ProfileScreen: React.FC = () => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const service = new StellarMobileMoneyService();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.timing(avatarAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const p = await service.getUserProfile();
        setProfile(p);
      } catch (e) {
        // ignore for now
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logged out', 'You have been logged out.');
  };

  const handleSetPin = () => {
    setPinSet(true);
    Alert.alert('PIN Set', 'Your PIN has been set. (Demo only)');
  };

  const handleBackup = () => {
    Alert.alert('Backup', 'Wallet backup started. (Demo only)');
  };

  const handleRestore = () => {
    Alert.alert('Restore', 'Wallet restore started. (Demo only)');
  };

  return (
    <View style={styles.container}>
      <Animated.Image
        source={{ uri: 'https://ui-avatars.com/api/?name=John+Doe&background=FF6B35&color=fff&size=128' }}
        style={[styles.avatar, { opacity: avatarAnim, transform: [{ scale: avatarAnim }] }]}
      />
      <Text style={styles.name}>{profile?.phone || 'John Doe'}</Text>
      <Text style={styles.email}>{profile?.is_verified ? 'Verified' : 'Not Verified'}</Text>
      <Animated.View style={[styles.securityBox, CARD_SHADOW, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
        <Text style={styles.securityTitle}>Wallet Security</Text>
        <TouchableOpacity style={styles.securityButton} onPress={handleSetPin} activeOpacity={0.85}>
          <Text style={styles.securityButtonText}>{pinSet ? 'Change PIN' : 'Set PIN'}</Text>
        </TouchableOpacity>
        <View style={styles.securityRow}>
          <Text style={styles.securityLabel}>Enable Biometric</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            thumbColor={biometricEnabled ? '#FF6B35' : '#ccc'}
            trackColor={{ true: '#FF6B35', false: '#ccc' }}
          />
        </View>
        <TouchableOpacity style={styles.securityButton} onPress={handleBackup} activeOpacity={0.85}>
          <Text style={styles.securityButtonText}>Backup Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.securityButton} onPress={handleRestore} activeOpacity={0.85}>
          <Text style={styles.securityButtonText}>Restore Wallet</Text>
        </TouchableOpacity>
      </Animated.View>
      <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#0A6DD1',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  securityBox: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 18,
    marginBottom: 32,
    alignItems: 'center',
  },
  securityTitle: {
    fontWeight: 'bold',
    color: '#0A6DD1',
    fontSize: 18,
    marginBottom: 12,
  },
  securityButton: {
    backgroundColor: '#0A6DD1',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%',
    alignItems: 'center',
  },
  securityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  securityLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#0A6DD1',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 