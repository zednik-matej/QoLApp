import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useLocalSearchParams, useRouter } from 'expo-router';

const DEFAULT_COORDS = { lat: 50.0755, lon: 14.4378, country: 'Czechia' };

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CompassScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [target, setTarget] = useState<{ lat: number; lon: number; country: string } | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [address, setAddress] = useState<{ city?: string; country?: string } | null>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const DEFAULT_LOCATION = {
    coords: {
      latitude: 49.3531,
      longitude: 16.0131,
      altitude: 0,
      accuracy: 0,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };

  // Fetch target country coordinates if not provided
  useEffect(() => {
    const countryName = params.country ? String(params.country) : DEFAULT_COORDS.country;
    if (params.lat && params.lon) {
      setTarget({
        lat: Number(params.lat),
        lon: Number(params.lon),
        country: countryName,
      });
    } else {
      setLoadingTarget(true);
      fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=latlng,name`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data[0]?.latlng) {
            setTarget({
              lat: data[0].latlng[0],
              lon: data[0].latlng[1],
              country: data[0].name.common || countryName,
            });
          } else {
            setTarget(DEFAULT_COORDS);
            setErrorMsg('Could not fetch country coordinates, using default.');
          }
        })
        .catch(() => {
          setTarget(DEFAULT_COORDS);
          setErrorMsg('Could not fetch country coordinates, using default.');
        })
        .finally(() => setLoadingTarget(false));
    }
  }, [params.lat, params.lon, params.country]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied. Using default location (Křižanov).');
        setLocation(DEFAULT_LOCATION as Location.LocationObject);
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } catch (e) {
        setErrorMsg('Could not get location. Using default location (Křižanov).');
        setLocation(DEFAULT_LOCATION as Location.LocationObject);
      }
    })();

    const subscription = Magnetometer.addListener((data) => {
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      angle = angle >= 0 ? angle : angle + 360;
      setHeading(angle);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (location) {
      Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }).then((results) => {
        if (results && results.length > 0) {
          setAddress({
            city: results[0].city ?? undefined,
            country: results[0].country ?? undefined,
          });
        }
      });
    }
  }, [location]);

  if (loadingTarget || !target) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading country coordinates...</Text>
      </View>
    );
  }

  if (!location) {
    let loadingMsg = 'Waiting for location...';
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>{loadingMsg}</Text>
        {errorMsg && <Text style={{ color: 'red' }}>{errorMsg}</Text>}
      </View>
    );
  }
  const usedHeading = heading ?? 0;

  const bearing = getBearing(
    location.coords.latitude,
    location.coords.longitude,
    target.lat,
    target.lon
  );
  const distance = getDistance(
    location.coords.latitude,
    location.coords.longitude,
    target.lat,
    target.lon
  );
  const direction = (bearing - usedHeading + 360) % 360;

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Compass to {target.country}</Text>
      <View style={{ marginVertical: 32 }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            borderWidth: 4,
            borderColor: '#1976d2',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: `${direction}deg` }],
            backgroundColor: '#f0f4fa',
          }}
        >
          <Text style={{ fontSize: 48, color: '#1976d2' }}>↑</Text>
        </View>
      </View>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>
        Distance: {distance.toFixed(1)} km
      </Text>
      {address && (
        <Text style={{ fontSize: 18, marginBottom: 8 }}>
          Device Location: {address.city ? address.city + ', ' : ''}{address.country}
        </Text>
      )}
      <Text style={{ fontSize: 18, marginBottom: 8 }}>
        Device Location Latitude:  {location.coords.latitude.toFixed(4)}
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>
        Device Location Longitude:  {location.coords.longitude.toFixed(4)}
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>
        Country Location Latitude:  {target.lat.toFixed(4)}
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>
        Country Location Longitude:  {target.lon.toFixed(4)}
      </Text>
      <Text style={{ fontSize: 16, color: '#555' }}>
        Bearing: {bearing.toFixed(0)}°
      </Text>
      {heading === null && (
        <Text style={{ color: '#888', marginBottom: 8 }}>
          Compass not available, showing north.
        </Text>
      )}
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});