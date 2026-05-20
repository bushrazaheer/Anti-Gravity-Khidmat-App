import { MatchedProvider } from '@/engine/AntigravityAgent';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  match: MatchedProvider;
  isTop: boolean;
  onBook: () => void;
}

export const ProviderCard = ({ match, isTop, onBook }: Props) => {
  const { provider, quote, matchScore, matchReasons } = match;

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={isTop ? ['#10B981', '#059669'] : ['#FFFFFF', '#F9FAFB']}
        style={[styles.card, isTop ? styles.cardTop : undefined]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isTop && (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>✨ Best Match (Score: {matchScore})</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: provider.name.toLowerCase().includes('sadia') || provider.name.toLowerCase().includes('kiran')
                    ? `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(provider.name)}`
                    : `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(provider.name)}`
                }} 
                style={styles.avatar} 
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.name, isTop && styles.textLight]}>{provider.name}</Text>
              <Text style={[styles.rating, isTop && styles.textLightOpacity]}>⭐ {provider.rating} ({provider.reviews} reviews)</Text>
              <Text style={[styles.stats, isTop && styles.textLightOpacity]}>Reliability: {provider.reliabilityScore}% | Cancel Risk: {provider.cancellationRate}%</Text>
            </View>
          </View>

          <View style={styles.reasonsContainer}>
            {matchReasons.slice(0, 3).map((reason, idx) => (
              <View key={idx} style={[styles.reasonBadge, isTop && styles.reasonBadgeTop]}>
                <Text style={[styles.reasonText, isTop && styles.reasonTextTop]}>✓ {reason}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.quoteContainer, isTop && styles.quoteContainerTop]}>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, isTop && styles.textLight]}>Base Fee</Text>
              <Text style={[styles.quoteValue, isTop && styles.textLight]}>Rs {quote.visitFee}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, isTop && styles.textLight]}>Distance ({provider.distanceKm}km)</Text>
              <Text style={[styles.quoteValue, isTop && styles.textLight]}>Rs {quote.distanceCost}</Text>
            </View>
            {quote.urgencyAdjustment > 0 && (
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: isTop ? '#FEE2E2' : '#EF4444' }]}>Urgency Surge</Text>
                <Text style={[styles.quoteValue, { color: isTop ? '#FEE2E2' : '#EF4444' }]}>+Rs {quote.urgencyAdjustment}</Text>
              </View>
            )}
            <View style={[styles.totalRow, isTop && styles.totalRowTop]}>
              <Text style={[styles.totalLabel, isTop && styles.textLight]}>Total Estimate</Text>
              <Text style={[styles.totalValue, isTop && styles.textLight]}>Rs {quote.total}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.bookButton, isTop && styles.bookButtonTop]} onPress={onBook}>
            <LinearGradient
              colors={isTop ? ['#FFFFFF', '#F3F4F6'] : ['#111827', '#374151']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.bookButtonText, isTop && styles.bookButtonTextTop]}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5, // 3D effect shadow
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cardTop: {
    borderColor: '#34D399',
  },
  content: {
    paddingBottom: 16,
  },
  topBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  rating: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
  },
  stats: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textLightOpacity: {
    color: 'rgba(255,255,255,0.8)',
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 16,
  },
  reasonBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonBadgeTop: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  reasonText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  reasonTextTop: {
    color: '#FFFFFF',
  },
  quoteContainer: {
    backgroundColor: 'rgba(249, 250, 251, 0.5)',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
  },
  quoteContainerTop: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quoteLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  quoteValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRowTop: {
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  bookButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  bookButtonTop: {
    shadowOpacity: 0.3,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  bookButtonTextTop: {
    color: '#059669',
  },
});
