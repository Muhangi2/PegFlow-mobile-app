import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const withdrawalMethods = [
  { id: 'mtn', title: 'MTN Mobile Money', icon: 'phone-portrait', color: '#FF6B35' },
  { id: 'airtel', title: 'Airtel Money', icon: 'phone-portrait', color: '#FF0000' },
  { id: 'bank', title: 'Bank Transfer', icon: 'business', color: '#4285F4' },
];

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

const WithdrawScreen: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(3800); // UGX per USD
  const cardAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;

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
  }, [amount, accountNumber, selectedMethod]);

  const handleWithdraw = async () => {
    if (!selectedMethod || !accountNumber || !amount) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual withdrawal API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      Alert.alert('Success', `Withdrawal of ${amount} USDC to ${getMethodTitle(selectedMethod)} processed successfully!`);
      setAccountNumber('');
      setAmount('');
      setSelectedMethod(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to process withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  const getMethodTitle = (methodId: string) => {
    const method = withdrawalMethods.find(m => m.id === methodId);
    return method?.title || 'Unknown';
  };

  const getMethodIcon = (methodId: string) => {
    const method = withdrawalMethods.find(m => m.id === methodId);
    return method?.icon || 'receipt';
  };

  const getMethodColor = (methodId: string) => {
    const method = withdrawalMethods.find(m => m.id === methodId);
    return method?.color || '#666';
  };

  const calculateUGXAmount = () => {
    const usdcAmount = parseFloat(amount) || 0;
    return (usdcAmount * exchangeRate).toLocaleString();
  };

  const getAccountPlaceholder = () => {
    switch (selectedMethod) {
      case 'mtn':
      case 'airtel':
        return 'Phone Number (e.g., 0770123456)';
      case 'bank':
        return 'Bank Account Number';
      default:
        return 'Account Number';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.card, CARD_SHADOW, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
        <Text style={styles.title}>Withdraw USDC to UGX</Text>
        <Text style={styles.subtitle}>Convert your USDC to Uganda Shillings</Text>
        
        <View style={styles.rateSection}>
          <Text style={styles.rateText}>Exchange Rate: 1 USDC = {exchangeRate.toLocaleString()} UGX</Text>
        </View>
        
        <View style={styles.methodSection}>
          <Text style={styles.sectionTitle}>Select Withdrawal Method</Text>
          <View style={styles.methodGrid}>
            {withdrawalMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  selectedMethod === method.id && styles.methodButtonActive,
                  CARD_SHADOW
                ]}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                  <Ionicons name={method.icon as any} size={24} color="white" />
                </View>
                <Text style={[styles.methodText, selectedMethod === method.id && styles.methodTextActive]}>
                  {method.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedMethod && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Withdrawal Details</Text>
            
            <TextInput
              style={styles.input}
              placeholder={getAccountPlaceholder()}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Amount in USDC"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
        )}

        {selectedMethod && accountNumber && amount && (
          <Animated.View style={[styles.summaryBox, CARD_SHADOW, { opacity: summaryAnim, transform: [{ scale: summaryAnim }] }]}>
            <Text style={styles.summaryTitle}>Withdrawal Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Method:</Text>
              <Text style={styles.summaryValue}>{getMethodTitle(selectedMethod)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Account:</Text>
              <Text style={styles.summaryValue}>{accountNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>USDC Amount:</Text>
              <Text style={styles.summaryValue}>{amount} USDC</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>UGX Amount:</Text>
              <Text style={styles.summaryValue}>{calculateUGXAmount()} UGX</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeText}>Fee: 0.5% ({(parseFloat(amount) * 0.005).toFixed(2)} USDC)</Text>
            </View>
          </Animated.View>
        )}

        {selectedMethod && accountNumber && amount && (
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={handleWithdraw}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.withdrawButtonText}>Withdraw to UGX</Text>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0A6DD1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  rateSection: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  rateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A6DD1',
  },
  methodSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  methodButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  methodButtonActive: {
    borderColor: '#0A6DD1',
    backgroundColor: '#f0f8ff',
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  methodTextActive: {
    color: '#0A6DD1',
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: 24,
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
  summaryBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontWeight: 'bold',
    color: '#0A6DD1',
    fontSize: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 14,
  },
  summaryValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  feeRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  feeText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  withdrawButton: {
    backgroundColor: '#0A6DD1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WithdrawScreen;
