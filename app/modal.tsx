import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Linking, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';

export const title = "About App";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quality of Life Mobile App</Text>
      <Text style={styles.text}>
        Quality of Life data loaded from{' '}
        <Pressable onPress={() => Linking.openURL('https://www.numbeo.com/quality-of-life/rankings_by_country.jsp')}>
          <Text style={{ color: '#1976d2', textDecorationLine: 'underline' }}>numbeo</Text>
        </Pressable>
      </Text>
      <Text style={styles.text}>
        Location of countries loaded from{' '}
        <Pressable onPress={() => Linking.openURL('https://restcountries.com/')}>
          <Text style={{ color: '#1976d2', textDecorationLine: 'underline' }}>restcountries</Text>
        </Pressable>
      </Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 15,
    fontWeight: 'normal',
    textAlign: 'center',
  },
});