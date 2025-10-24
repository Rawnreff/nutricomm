// import React from 'react';
// import { Tabs, Redirect } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { StatusBar } from 'react-native';
// import { useAuth } from '../contexts/AuthContext';

// export default function TabLayout() {
//   const { isAuthenticated } = useAuth();

//   if (!isAuthenticated) {
//     return <Redirect href="/login" />;
//   }

//   return (
//     <>
//       <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//       <Tabs
//         screenOptions={{
//           tabBarActiveTintColor: '#2E7D32',
//           tabBarInactiveTintColor: '#757575',
//           tabBarStyle: {
//             backgroundColor: '#ffffff',
//             borderTopColor: '#E0E0E0',
//           },
//           headerShown: false,
//         }}
//       >
//         <Tabs.Screen
//           name="dashboard"
//           options={{
//             title: 'Dashboard',
//             tabBarIcon: ({ color, size }) => (
//               <Ionicons name="speedometer" size={size} color={color} />
//             ),
//           }}
//         />
//         <Tabs.Screen
//           name="absensi"
//           options={{
//             title: 'Absensi',
//             tabBarIcon: ({ color, size }) => (
//               <Ionicons name="calendar" size={size} color={color} />
//             ),
//           }}
//         />
//         <Tabs.Screen
//           name="aktivitas"
//           options={{
//             title: 'Aktivitas',
//             tabBarIcon: ({ color, size }) => (
//               <Ionicons name="leaf" size={size} color={color} />
//             ),
//           }}
//         />
//         <Tabs.Screen
//           name="profile"
//           options={{
//             title: 'Profil',
//             tabBarIcon: ({ color, size }) => (
//               <Ionicons name="person" size={size} color={color} />
//             ),
//           }}
//         />
//       </Tabs>
//     </>
//   );
// }

// frontend/app/(tabs)/_layout.tsx
import React, { useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { IPConfig } from '../../components/IPConfig';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const [showIPConfig, setShowIPConfig] = useState(false);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const handleIPChange = (ip: string) => {
    console.log(`Backend IP changed to: ${ip}`);
    // Di sini Anda bisa trigger reconnect socket/refresh data
    // Misalnya dengan event emitter atau context
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2E7D32',
          tabBarInactiveTintColor: '#757575',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#E0E0E0',
          },
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => setShowIPConfig(true)}
              style={{ 
                marginRight: 15,
                padding: 8,
                backgroundColor: '#f5f5f5',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#E0E0E0'
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#2E7D32" />
            </TouchableOpacity>
          ),
          headerTitleStyle: {
            color: '#2E7D32',
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#ffffff',
            shadowColor: 'transparent',
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="absensi"
          options={{
            title: 'Absensi',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="aktivitas"
          options={{
            title: 'Aktivitas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="leaf" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <IPConfig 
        isVisible={showIPConfig}
        onClose={() => setShowIPConfig(false)}
        onIPChange={handleIPChange}
      />
    </>
  );
}