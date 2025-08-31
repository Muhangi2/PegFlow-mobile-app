import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { getTransactionHistory, Transaction } from '../../services/stellar';

const TransactionHistoryScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const txs = await getTransactionHistory();
        setTransactions(txs);
      } catch (e) {
        setError('Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.item}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.type === 'send' ? 'arrow-up' : 'arrow-down'}
          size={24}
          color={item.type === 'send' ? '#0A6DD1' : '#06B6D4'}
        />
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{item.type === 'send' ? `Sent to ${item.counterparty}` : `Received from ${item.counterparty}`}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Text style={[styles.amount, item.type === 'send' ? styles.negative : styles.positive]}>
        {item.type === 'send' ? '-' : '+'}{item.amount} USDC
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0A6DD1" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={{ color: 'red', marginTop: 40 }}>{error}</Text>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          style={{ width: '100%' }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#0A6DD1',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    width: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  negative: {
    color: '#0A6DD1',
  },
  positive: {
    color: '#34A853',
  },
});

export default TransactionHistoryScreen; 