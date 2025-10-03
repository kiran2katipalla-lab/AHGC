
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, storage, auth } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddTaskScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low'|'Medium'|'High'>('Low');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: 8
    });
    if (!res.canceled) {
      const uris = res.assets?.map(a => a.uri) ?? [];
      setImages(prev => [...prev, ...uris].slice(0, 12));
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow camera access.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setImages(prev => [...prev, res.assets[0].uri]);
    }
  };

  const uploadAll = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const uri = images[i];
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const key = `tasks/${Date.now()}-${i}.jpg`;
      const storageRef = ref(storage, key);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  };

  const saveTask = async () => {
    try {
      if (!title.trim()) return Alert.alert('Missing', 'Please enter a title');
      setSaving(true);
      const photos = await uploadAll();
      await addDoc(collection(db, 'tasks'), {
        title,
        description,
        priority,
        status: 'Pending',
        photos,
        createdBy: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp()
      });
      setSaving(false);
      navigation.goBack();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e?.message ?? 'Failed to save task');
    }
  };

  return (
    <View style={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>New Task</Text>

      <Text>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={{borderWidth:1, padding:10, borderRadius:8}} />

      <Text>Description</Text>
      <TextInput value={description} onChangeText={setDescription} style={{borderWidth:1, padding:10, borderRadius:8}} />

      <Text>Priority (Low | Medium | High)</Text>
      <TextInput value={priority} onChangeText={(t)=>setPriority((t as any))} style={{borderWidth:1, padding:10, borderRadius:8}} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
        {images.map((u, idx) => (
          <Image key={idx} source={{ uri: u }} style={{ width: 90, height: 90, marginRight: 8, borderRadius: 8 }} />
        ))}
      </ScrollView>

      <Button title="Pick from gallery" onPress={pickImages} />
      <Button title="Take photo" onPress={takePhoto} />
      <Button title={saving ? "Saving..." : "Save Task"} disabled={saving} onPress={saveTask} />
    </View>
  );
}
