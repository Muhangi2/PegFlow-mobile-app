import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StellarMobileMoneyService from '../../services/StellarMobileMoneyService';

// Stub for exchange rates (replace with real API call if needed)
const useExchangeRates = () => {
  const [rates, setRates] = useState({ XLMUSD: 0.12 });
  useEffect(() => {
    // TODO: Replace with real API call
    setRates({ XLMUSD: 0.12 });
  }, []);
  return rates;
};

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState<{ ugx: number; usd: number; usdc: number }>({
    ugx: 1250000,
    usd: 340.5,
    usdc: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rates = useExchangeRates();
  const service = new StellarMobileMoneyService();

  const fetchBalances = async () => {
    setLoading(true);
    setError(null);
    try {
      const usdc = await service.getBalance();
      setBalances((prev) => ({ ...prev, usdc }));
    } catch (e) {
      setError('Failed to fetch balances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBalances();
  };

  const quickActions = [
    { icon: 'send', title: 'Send USDC', screen: 'Send', color: '#0A6DD1' },
    { icon: 'receipt', title: 'Pay Bills', screen: 'PayBills', color: '#4285F4' },
    { icon: 'cash-outline', title: 'Withdraw', screen: 'Withdraw', color: '#06B6D4' },
    { icon: 'time', title: 'History', screen: 'History', color: '#34A853' },
  ];

  const CARD_SHADOW = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#0A6DD1', '#06B6D4']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning!</Text>
            <Text style={styles.userName}>John Doe</Text>
          </View>
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {/* Exchange rates */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            USDC/USD: $1.00
          </Text>
        </View>
      </LinearGradient>
      <View style={styles.balanceContainer}>
        <View style={[styles.balanceCard, styles.balanceCardMain, CARD_SHADOW]}> {/* Main balance card */}
          <Text style={styles.balanceLabel}>Uganda Shillings</Text>
          <Text style={styles.balanceAmountMain}>UGX {balances.ugx.toLocaleString()}</Text>
        </View>
        <View style={[styles.balanceCard, styles.balanceCardSecondary, CARD_SHADOW]}> {/* Secondary balances */}
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>US Dollar</Text>
              <Text style={styles.balanceAmount}>${balances.usd}</Text>
            </View>
            <View style={styles.balanceRight}>
              <Text style={styles.balanceLabel}>USDC</Text>
              <Text style={styles.balanceAmount}>{loading ? <ActivityIndicator size="small" color="#06B6D4" /> : `${balances.usdc} USDC`}</Text>
            </View>
          </View>
        </View>
        {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
      </View>
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, CARD_SHADOW]}
              onPress={() => action.screen && navigation.navigate(action.screen)}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}> 
                <Ionicons name={action.icon as any} size={24} color="white" />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.recentTransactions}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity style={[styles.transactionItem, CARD_SHADOW]}>
          <View style={styles.transactionIcon}>
            <Ionicons name="arrow-up" size={20} color="#0A6DD1" />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>Sent to Sarah K.</Text>
            <Text style={styles.transactionDate}>Today, 2:30 PM</Text>
          </View>
          <Text style={styles.transactionAmount}>-$50.00</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.transactionItem, CARD_SHADOW]}>
          <View style={styles.transactionIcon}>
            <Ionicons name="arrow-down" size={20} color="#34A853" />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>Received from Mom</Text>
            <Text style={styles.transactionDate}>Yesterday, 10:15 AM</Text>
          </View>
          <Text style={[styles.transactionAmount, styles.positiveAmount]}>+$200.00</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.viewAllText}>View All Transactions</Text>
          <Ionicons name="arrow-forward" size={16} color="#0A6DD1" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationIcon: {
    padding: 8,
  },
  balanceContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  balanceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceCardSecondary: {
    backgroundColor: '#f8f9fa',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  balanceAmount: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  balanceCardMain: {
    backgroundColor: '#eaf6fd',
    borderWidth: 1.5,
    borderColor: '#0A6DD1',
  },
  balanceAmountMain: {
    color: '#0A6DD1',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  recentTransactions: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A6DD1',
  },
  positiveAmount: {
    color: '#34A853',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 15,
  },
  viewAllText: {
    color: '#0A6DD1',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 5,
  },
});

export default DashboardScreen; 