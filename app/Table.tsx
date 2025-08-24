import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View, Text, Button, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

export const title = "Country List";

type CountryRow = {
  [key: string]: string;
};

function isNumber(value: string) {
  return !isNaN(Number(value.replace(/,/g, '')));
}

function compareValues(a: string, b: string, header: string) {
  if (!isNumber(a) || !isNumber(b)) return 0;
  const numA = Number(a.replace(/,/g, ''));
  const numB = Number(b.replace(/,/g, ''));
  if (/rank/i.test(header)) return numA < numB ? 1 : numA > numB ? -1 : 0; // lower is better
  return numA > numB ? 1 : numA < numB ? -1 : 0; // higher is better
}

export default function Table() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selected, setSelected] = useState<CountryRow | null>(null);
  const [compareWith, setCompareWith] = useState<CountryRow | null>(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    fetch('https://www.numbeo.com/quality-of-life/rankings_by_country.jsp')
      .then((res) => res.text())
      .then((html) => {
        const match = html.match(/<table[^>]*id=["']t2["'][\s\S]*?<\/table>/);
        if (!match) {
          setError('Table not found.');
          setLoading(false);
          return;
        }
        const rows = Array.from(match[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g));
        const headers = Array.from(rows[0][1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)).map((h) =>
          h[1].replace(/<[^>]+>/g, '').trim()
        );
        const data: CountryRow[] = rows.slice(1).map((row) => {
          const cols = Array.from(row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map((c) =>
            c[1].replace(/<[^>]+>/g, '').trim()
          );
          const obj: CountryRow = {};
          headers.forEach((header, i) => {
            obj[header] = cols[i] || '';
          });
          return obj;
        }).filter((row) => row[headers[1]]);
        setHeaders(headers);
        setCountries(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const filtered = countries.filter((row) =>
    row['Country']?.toLowerCase().includes(filter.toLowerCase())
  );

  function renderDetailCard(country: CountryRow) {
    return (
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
          {country['Country']}
        </Text>
        {headers
          .filter((header) => header !== 'Country')
          .map((header, idx) => (
            <View
              key={header}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                backgroundColor: idx % 2 === 0 ? '#f6f6f6' : '#fff',
                paddingVertical: 6,
                paddingHorizontal: 4,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontWeight: '500', color: '#333', width: '60%' }}>{header}</Text>
              <Text style={{ fontWeight: '400', color: '#222', width: '38%', textAlign: 'right' }}>
                {country[header]}
              </Text>
            </View>
          ))}
          <Button title="Show on Compass"
            onPress={() =>
                router.push({
                pathname: '/Compass',
                params: {
                    country: country['Country'],
                },
                })
                }
            />
          <Button title="Compare with..." onPress={() => setCompareMode(true)} />
          <Button title="Back to country list" onPress={() => setSelected(null)} />
      </View>
    );
  }

  function renderComparison() {
    if (!selected || !compareWith) return null;
    return (
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
          {selected['Country']} vs {compareWith['Country']}
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ width: '40%', fontWeight: 'bold', color: '#555' }}>Metric</Text>
          <Text style={{ width: '28%', fontWeight: 'bold', color: '#388e3c', textAlign: 'center' }}>
            {selected['Country']}
          </Text>
          <Text style={{ width: '4%' }} />
          <Text style={{ width: '28%', fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
            {compareWith['Country']}
          </Text>
        </View>
        {headers
          .filter((header) => header !== 'Country')
          .map((header, idx) => {
            const sel = selected[header];
            const cmp = compareWith[header];
            const selBetter = compareValues(sel, cmp, header) === 1;
            const cmpBetter = compareValues(cmp, sel, header) === 1;
            return (
              <View
                key={header}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: idx % 2 === 0 ? '#f6f6f6' : '#fff',
                  paddingVertical: 6,
                  paddingHorizontal: 4,
                  borderRadius: 6,
                }}
              >
                <Text style={{ width: '40%', color: '#333' }}>{header}</Text>
                <Text
                  style={{
                    width: '28%',
                    textAlign: 'center',
                    fontWeight: selBetter ? 'bold' : 'normal',
                    color: selBetter ? '#388e3c' : '#222',
                  }}
                >
                  {sel}
                </Text>
                <Text style={{ width: '4%', textAlign: 'center', color: '#aaa' }}>|</Text>
                <Text
                  style={{
                    width: '28%',
                    textAlign: 'center',
                    fontWeight: cmpBetter ? 'bold' : 'normal',
                    color: cmpBetter ? '#1976d2' : '#222',
                  }}
                >
                  {cmp}
                </Text>
              </View>
            );
          })}
        <Button title="Back to country detail" onPress={() => setCompareWith(null)} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      <Text style={{ fontSize: 24, marginBottom: 16, fontWeight: 'bold', textAlign: 'center' }}>
        Numbeo Table
      </Text>
      {selected ? (
        compareWith ? (
          renderComparison()
        ) : compareMode ? (
          <>
            <Text style={{ fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
              Select country to compare with {selected['Country']}:
            </Text>
            <TextInput
              placeholder="Search country..."
              value={filter}
              onChangeText={setFilter}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 8,
                marginBottom: 16,
                backgroundColor: '#fff',
              }}
            />
            {filtered
              .filter((item) => item['Country'] !== selected['Country'])
              .sort((a, b) => (a['Country'] || '').localeCompare(b['Country'] || ''))
              .map((item) => (
                <View key={item['Country']} style={{ marginBottom: 8 }}>
                  <Button
                    title={item['Country']}
                    onPress={() => {
                      setCompareWith(item);
                      setCompareMode(false);
                    }}
                  />
                </View>
              ))}
            <Button title="Cancel" color="#d32f2f" onPress={() => setCompareMode(false)} />
          </>
        ) : (
          <>
            {renderDetailCard(selected)}
          </>
        )
      ) : (
        <>
          <TextInput
            placeholder="Search country..."
            value={filter}
            onChangeText={setFilter}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 8,
              marginBottom: 16,
              backgroundColor: '#fff',
            }}
          />
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {loading && <ActivityIndicator />}
          {!loading &&
            !error &&
            filtered
              .sort((a, b) => (a['Country'] || '').localeCompare(b['Country'] || ''))
              .map((item) => (
                <View key={item['Country']} style={{ marginBottom: 8 }}>
                  <Button title={item['Country']} onPress={() => setSelected(item)} />
                </View>
              ))}
        </>
      )}
    </ScrollView>
  );
}