import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Course {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

const GRADE_POINTS: { [key: string]: number } = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0
};

export default function GPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '', credits: '', grade: '' }
  ]);
  const [gpa, setGpa] = useState<number | null>(null);
  const [savedGPAs, setSavedGPAs] = useState<string[]>([]);

  useEffect(() => {
    loadSavedGPAs();
  }, []);

  const loadSavedGPAs = async () => {
    try {
      const saved = await AsyncStorage.getItem('gpa_history');
      if (saved) setSavedGPAs(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  };

  const addCourse = () => {
    setCourses([...courses, { 
      id: Date.now().toString(), 
      name: '', 
      credits: '', 
      grade: '' 
    }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length === 1) {
      setCourses([{ id: Date.now().toString(), name: '', credits: '', grade: '' }]);
    } else {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string) => {
    setCourses(courses.map(c => 
      c.id === id ? { ...c, [field]: field === 'grade' ? value.toUpperCase() : value } : c
    ));
  };

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;

    for (const course of courses) {
      const credits = parseFloat(course.credits);
      const grade = course.grade.toUpperCase();
      
      if (!credits || credits <= 0) continue;
      if (!GRADE_POINTS.hasOwnProperty(grade)) continue;
      
      totalPoints += credits * GRADE_POINTS[grade];
      totalCredits += credits;
    }

    if (totalCredits === 0) {
      Alert.alert('Error', 'Please enter valid credits and grades (A, B, C, D, F)');
      return;
    }

    const calculatedGPA = totalPoints / totalCredits;
    const roundedGPA = parseFloat(calculatedGPA.toFixed(2));
    setGpa(roundedGPA);
    saveGPA(roundedGPA);
  };

  const saveGPA = async (calculatedGPA: number) => {
    try {
      const newEntry = `${new Date().toLocaleDateString()}: ${calculatedGPA.toFixed(2)}`;
      const updated = [newEntry, ...savedGPAs].slice(0, 5);
      await AsyncStorage.setItem('gpa_history', JSON.stringify(updated));
      setSavedGPAs(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = () => {
    setCourses([{ id: Date.now().toString(), name: '', credits: '', grade: '' }]);
    setGpa(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>GPA Calculator</Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {gpa !== null && (
          <View style={[styles.gpaCard, gpa >= 3.0 ? styles.goodGpa : styles.badGpa]}>
            <Text style={styles.gpaLabel}>Your GPA</Text>
            <Text style={styles.gpaNumber}>{gpa}</Text>
            <Text style={styles.gpaScale}>out of 4.0</Text>
            {gpa >= 3.5 && <Text style={styles.gpaMessage}>Dean's List! 🎉</Text>}
            {gpa < 2.0 && <Text style={styles.gpaMessage}>Need to improve 📚</Text>}
          </View>
        )}

        <Text style={styles.sectionTitle}>Enter Your Courses</Text>
        
        {courses.map((course) => (
          <View key={course.id} style={styles.courseRow}>
            <View style={styles.inputs}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Course Name"
                placeholderTextColor="#6b7280"
                value={course.name}
                onChangeText={(text) => updateCourse(course.id, 'name', text)}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginHorizontal: 8 }]}
                placeholder="Credits"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={course.credits}
                onChangeText={(text) => updateCourse(course.id, 'credits', text)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Grade"
                placeholderTextColor="#6b7280"
                autoCapitalize="characters"
                maxLength={2}
                value={course.grade}
                onChangeText={(text) => updateCourse(course.id, 'grade', text)}
              />
            </View>
            <TouchableOpacity onPress={() => removeCourse(course.id)} style={styles.removeBtn}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addCourse}>
          <Ionicons name="add" size={20} color="#38bdf8" />
          <Text style={styles.addText}>Add Course</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.calcBtn} onPress={calculateGPA}>
          <Text style={styles.calcText}>Calculate GPA</Text>
        </TouchableOpacity>

        <View style={styles.scaleCard}>
          <Text style={styles.scaleTitle}>Grade Scale</Text>
          <View style={styles.scaleGrid}>
            <Text style={styles.scaleItem}>A = 4.0</Text>
            <Text style={styles.scaleItem}>A- = 3.7</Text>
            <Text style={styles.scaleItem}>B+ = 3.3</Text>
            <Text style={styles.scaleItem}>B = 3.0</Text>
            <Text style={styles.scaleItem}>B- = 2.7</Text>
            <Text style={styles.scaleItem}>C+ = 2.3</Text>
            <Text style={styles.scaleItem}>C = 2.0</Text>
            <Text style={styles.scaleItem}>C- = 1.7</Text>
          </View>
        </View>

        {savedGPAs.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Recent Calculations</Text>
            {savedGPAs.map((entry, idx) => (
              <Text key={idx} style={styles.historyItem}>{entry}</Text>
            ))}
          </View>
        )}
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  gpaCard: {
    margin: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  goodGpa: {
    backgroundColor: '#10b981',
  },
  badGpa: {
    backgroundColor: '#ef4444',
  },
  gpaLabel: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  gpaNumber: {
    color: '#000',
    fontSize: 72,
    fontWeight: '900',
    marginVertical: 10,
  },
  gpaScale: {
    color: '#000',
    fontSize: 14,
    opacity: 0.7,
  },
  gpaMessage: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  inputs: {
    flex: 1,
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  removeBtn: {
    marginLeft: 10,
    padding: 5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    backgroundColor: '#1f2937',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addText: {
    color: '#38bdf8',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 15,
  },
  calcBtn: {
    backgroundColor: '#38bdf8',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  calcText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scaleCard: {
    backgroundColor: '#1f2937',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 30,
  },
  scaleTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
    fontSize: 16,
  },
  scaleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scaleItem: {
    color: '#9ca3af',
    fontSize: 13,
    width: '23%',
  },
  historyCard: {
    backgroundColor: '#1f2937',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  historyTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  historyItem: {
    color: '#9ca3af',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    fontSize: 14,
  },
});