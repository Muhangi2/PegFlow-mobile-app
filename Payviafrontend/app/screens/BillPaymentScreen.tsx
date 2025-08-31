import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const billCategories = [
  { id: 'electricity', title: 'Electricity', icon: 'flash', color: '#FF6B35' },
  { id: 'internet', title: 'Internet', icon: 'wifi', color: '#4285F4' },
  { id: 'airtime', title: 'Airtime', icon: 'phone-portrait', color: '#34A853' },
  { id: 'water', title: 'Water', icon: 'water', color: '#06B6D4' },
  { id: 'tv', title: 'TV Subscription', icon: 'tv', color: '#9C27B0' },
  { id: 'other', title: 'Other Bills', icon: 'receipt', color: '#FF9800' },
];

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

const BillPaymentScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
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
  }, [amount, accountNumber, selectedCategory]);

  const handlePayBill = async () => {
    if (!selectedCategory || !accountNumber || !amount) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual bill payment API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      Alert.alert('Success', `Bill payment of ${amount} USDC processed successfully!`);
      setAccountNumber('');
      setAmount('');
      setSelectedCategory(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to process bill payment.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = billCategories.find(cat => cat.id === categoryId);
    return category?.icon || 'receipt';
  };

  const getCategoryTitle = (categoryId: string) => {
    const category = billCategories.find(cat => cat.id === categoryId);
    return category?.title || 'Other';
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.card, CARD_SHADOW, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
        <Text style={styles.title}>Pay Bills with USDC</Text>
        <Text style={styles.subtitle}>Select a bill category and pay directly with your USDC</Text>
        
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Select Bill Category</Text>
          <View style={styles.categoryGrid}>
            {billCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                  CARD_SHADOW
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={24} color="white" />
                </View>
                <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedCategory && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            
            <TextInput
              style={styles.input}
              placeholder={`${getCategoryTitle(selectedCategory)} Account Number`}
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

        {selectedCategory && accountNumber && amount && (
          <Animated.View style={[styles.summaryBox, CARD_SHADOW, { opacity: summaryAnim, transform: [{ scale: summaryAnim }] }]}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bill Category:</Text>
              <Text style={styles.summaryValue}>{getCategoryTitle(selectedCategory)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Account Number:</Text>
              <Text style={styles.summaryValue}>{accountNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>{amount} USDC</Text>
            </View>
          </Animated.View>
        )}

        {selectedCategory && accountNumber && amount && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayBill}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Pay Bill</Text>
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
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  categoryButtonActive: {
    borderColor: '#0A6DD1',
    backgroundColor: '#f0f8ff',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  categoryTextActive: {
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
  payButton: {
    backgroundColor: '#0A6DD1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BillPaymentScreen;
