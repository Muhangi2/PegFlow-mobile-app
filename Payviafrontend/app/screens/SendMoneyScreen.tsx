import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import StellarMobileMoneyService from '../../services/StellarMobileMoneyService';

const currencies = [
  { label: 'UGX', icon: 'cash-outline' },
  { label: 'USD', icon: 'logo-usd' },
  { label: 'XLM', icon: 'star-outline' },
];

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

const SendMoneyScreen: React.FC = () => {
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [currency, setCurrency] = useState('UGX');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const service = new StellarMobileMoneyService();

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(summaryAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, [amount, recipient, currency, mode]);

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient and amount.');
      return;
    }
    if (currency === 'XLM') {
      setLoading(true);
      try {
        await service.sendToMobile(recipient, parseFloat(amount), 'MTN');
        Alert.alert('Success', `${mode === 'send' ? 'Sent' : 'Requested'} ${amount} XLM ${mode === 'send' ? 'to' : 'from'} ${recipient}!`);
        setRecipient('');
        setAmount('');
      } catch (e) {
        Alert.alert('Error', 'Failed to send asset.');
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Not Supported', 'Only XLM is supported for sending at this time.');
    }
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, CARD_SHADOW, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{mode === 'send' ? 'Send' : 'Request'} Money</Text>
          <TouchableOpacity
            style={styles.swapButton}
            onPress={() => setMode(mode === 'send' ? 'receive' : 'send')}
            accessibilityLabel="Swap send/receive"
            activeOpacity={0.85}
          >
            <Ionicons name="swap-horizontal" size={28} color="#0A6DD1" />
          </TouchableOpacity>
        </View>
        <View style={styles.selectorRow}>
          {currencies.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.currencyButton, currency === c.label && styles.currencyButtonActive, CARD_SHADOW]}
              onPress={() => setCurrency(c.label)}
              activeOpacity={0.85}
            >
              <Ionicons name={c.icon as any} size={22} color={currency === c.label ? '#fff' : '#0A6DD1'} />
              <Text style={[styles.currencyText, currency === c.label && styles.currencyTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Amount in ${currency}`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder={mode === 'send' ? 'Recipient Name or Address' : 'Sender Name or Address'}
          value={recipient}
          onChangeText={setRecipient}
        />
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>{mode === 'send' ? 'Send' : 'Request'}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.summaryBox, CARD_SHADOW, { opacity: summaryAnim, transform: [{ scale: summaryAnim }] }]}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>
            {mode === 'send' ? 'You will send' : 'You will request'}
            <Text style={{ fontWeight: 'bold' }}> {amount || '0'} {currency}</Text>
            {recipient ? ` ${mode === 'send' ? 'to' : 'from'} ${recipient}` : ''}
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0A6DD1',
  },
  swapButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  currencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0A6DD1',
    backgroundColor: '#fff',
  },
  currencyButtonActive: {
    backgroundColor: '#0A6DD1',
    borderColor: '#0A6DD1',
  },
  currencyText: {
    marginLeft: 6,
    color: '#0A6DD1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  currencyTextActive: {
    color: '#fff',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  actionButton: {
    backgroundColor: '#0A6DD1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  summaryTitle: {
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 2,
  },
  summaryText: {
    color: '#333',
    fontSize: 15,
  },
});

export default SendMoneyScreen; 