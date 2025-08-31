import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const onboardingData = [
    {
      icon: 'send-outline',
      title: 'Send USDC Globally',
      description: 'Send USDC to family and friends anywhere in the world with low fees using Stellar blockchain.',
    },
    {
      icon: 'receipt-outline',
      title: 'Pay Bills with USDC',
      description: 'Pay for utilities, internet, airtime, and other bills directly with your USDC balance.',
    },
    {
      icon: 'cash-outline',
      title: 'Withdraw to Local Currency',
      description: 'Convert USDC to Uganda Shillings and receive funds via mobile money or bank transfer.',
    },
  ];

  const nextPage = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const skipOnboarding = () => {
    navigation.replace('Login');
  };

  return (
    <LinearGradient colors={['#0A6DD1', '#06B6D4']} style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={onboardingData[currentPage].icon as any}
            size={100}
            color="white"
          />
        </View>

        <Text style={styles.title}>{onboardingData[currentPage].title}</Text>
        <Text style={styles.description}>{onboardingData[currentPage].description}</Text>

        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentPage && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
        <Text style={styles.nextButtonText}>
          {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#0A6DD1" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 40,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: 'white',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 50,
  },
  nextButtonText: {
    color: '#0A6DD1',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default OnboardingScreen; 