import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/providers/firebase';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen(): React.ReactElement {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [race, setRace] = useState('');
  const [saving, setSaving] = useState(false);

  // Load profile data from Firebase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setFirstName(data.firstName || '');
          setMiddleName(data.middleName || '');
          setLastName(data.lastName || '');
          setAddress(data.address || '');
          setCity(data.city || '');
          setState(data.state || '');
          setZipCode(data.zipCode || '');
          setOccupation(data.occupation || '');
          setRace(data.race || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save your profile.');
      return;
    }

    console.log('Starting save...', { userId: user.uid });
    setSaving(true);
    try {
      const profileData = {
        firstName,
        middleName,
        lastName,
        address,
        city,
        state,
        zipCode,
        occupation,
        race,
        updatedAt: new Date().toISOString(),
      };
      console.log('Saving profile data:', profileData);
      
      await setDoc(doc(db, 'profiles', user.uid), profileData);
      console.log('Profile saved successfully!');
      Alert.alert('Success', 'Your profile has been saved!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', `Failed to save profile: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={['#93C5FD', '#E0F2FE', '#FFFFFF', '#FECACA', '#F87171']}
      locations={[0, 0.25, 0.45, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>VoterID Profile</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Middle Name</Text>
          <TextInput
            style={styles.input}
            value={middleName}
            onChangeText={setMiddleName}
            placeholder="Enter middle name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter street address"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>State</Text>
          <Picker
            selectedValue={state}
            onValueChange={setState}
            style={styles.picker}
            itemStyle={styles.pickerItem}>
            <Picker.Item label="Select state" value="" />
            <Picker.Item label="Alabama" value="AL" />
            <Picker.Item label="Alaska" value="AK" />
            <Picker.Item label="Arizona" value="AZ" />
            <Picker.Item label="Arkansas" value="AR" />
            <Picker.Item label="California" value="CA" />
            <Picker.Item label="Colorado" value="CO" />
            <Picker.Item label="Connecticut" value="CT" />
            <Picker.Item label="Delaware" value="DE" />
            <Picker.Item label="Florida" value="FL" />
            <Picker.Item label="Georgia" value="GA" />
            <Picker.Item label="Hawaii" value="HI" />
            <Picker.Item label="Idaho" value="ID" />
            <Picker.Item label="Illinois" value="IL" />
            <Picker.Item label="Indiana" value="IN" />
            <Picker.Item label="Iowa" value="IA" />
            <Picker.Item label="Kansas" value="KS" />
            <Picker.Item label="Kentucky" value="KY" />
            <Picker.Item label="Louisiana" value="LA" />
            <Picker.Item label="Maine" value="ME" />
            <Picker.Item label="Maryland" value="MD" />
            <Picker.Item label="Massachusetts" value="MA" />
            <Picker.Item label="Michigan" value="MI" />
            <Picker.Item label="Minnesota" value="MN" />
            <Picker.Item label="Mississippi" value="MS" />
            <Picker.Item label="Missouri" value="MO" />
            <Picker.Item label="Montana" value="MT" />
            <Picker.Item label="Nebraska" value="NE" />
            <Picker.Item label="Nevada" value="NV" />
            <Picker.Item label="New Hampshire" value="NH" />
            <Picker.Item label="New Jersey" value="NJ" />
            <Picker.Item label="New Mexico" value="NM" />
            <Picker.Item label="New York" value="NY" />
            <Picker.Item label="North Carolina" value="NC" />
            <Picker.Item label="North Dakota" value="ND" />
            <Picker.Item label="Ohio" value="OH" />
            <Picker.Item label="Oklahoma" value="OK" />
            <Picker.Item label="Oregon" value="OR" />
            <Picker.Item label="Pennsylvania" value="PA" />
            <Picker.Item label="Rhode Island" value="RI" />
            <Picker.Item label="South Carolina" value="SC" />
            <Picker.Item label="South Dakota" value="SD" />
            <Picker.Item label="Tennessee" value="TN" />
            <Picker.Item label="Texas" value="TX" />
            <Picker.Item label="Utah" value="UT" />
            <Picker.Item label="Vermont" value="VT" />
            <Picker.Item label="Virginia" value="VA" />
            <Picker.Item label="Washington" value="WA" />
            <Picker.Item label="West Virginia" value="WV" />
            <Picker.Item label="Wisconsin" value="WI" />
            <Picker.Item label="Wyoming" value="WY" />
          </Picker>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Zip Code</Text>
          <TextInput
            style={styles.input}
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="Enter zip code"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Enter occupation"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Race/Ethnicity</Text>
          <Picker
            selectedValue={race}
            onValueChange={setRace}
            style={styles.picker}
            itemStyle={styles.pickerItem}>
            <Picker.Item label="Select race/ethnicity" value="" />
            <Picker.Item label="American Indian or Alaska Native" value="american_indian" />
            <Picker.Item label="Asian" value="asian" />
            <Picker.Item label="Black or African American" value="black" />
            <Picker.Item label="Hispanic or Latino" value="hispanic" />
            <Picker.Item label="Native Hawaiian or Other Pacific Islander" value="pacific_islander" />
            <Picker.Item label="White" value="white" />
            <Picker.Item label="Two or More Races" value="multiracial" />
            <Picker.Item label="Other" value="other" />
            <Picker.Item label="Prefer not to say" value="prefer_not_to_say" />
          </Picker>
        </View>

        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  heading: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 28,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  card: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 50,
  },
  pickerItem: {
    fontSize: 16,
    color: '#374151',
    height: 50,
  },
  saveButton: {
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});